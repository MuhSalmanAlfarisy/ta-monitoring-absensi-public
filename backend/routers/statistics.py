import calendar
from datetime import datetime, timedelta, date
from typing import List, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc, extract, and_
from sqlalchemy.orm import Session

from database import get_db
import models
from config import settings
from utils import get_sholat_order, is_ramadhan_active_for_date, get_ramadhan_status

router = APIRouter(
    prefix="/api/statistics",
    tags=["Statistics"]
)

OUTSIDE_PRAYER_LABEL = "Di Luar Waktu Sholat"


def _now_local() -> datetime:
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now()


def _coerce_date(raw_value) -> Optional[date]:
    if raw_value is None:
        return None
    if isinstance(raw_value, datetime):
        return raw_value.date()
    if isinstance(raw_value, date):
        return raw_value
    if isinstance(raw_value, str):
        try:
            return datetime.strptime(raw_value[:10], "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


def _month_start(d: date) -> date:
    return date(d.year, d.month, 1)


def _add_months(base_month_start: date, delta_months: int) -> date:
    month_index = (base_month_start.month - 1) + delta_months
    year = base_month_start.year + (month_index // 12)
    month = (month_index % 12) + 1
    return date(year, month, 1)


# ======================================================
# SUMMARY STATISTICS
# ======================================================

@router.get("/summary")
def get_statistics_summary(
    period: str = Query("bulan-ini", description="Periode: hari-ini, pekan-ini, bulan-ini, tahun-ini"),
    db: Session = Depends(get_db)
):
    """
    API agregator untuk halaman Statistik.
    Mengembalikan seluruh data statistik dalam satu request.
    """
    now = _now_local()
    today = now.date()
    ramadhan_active_today = is_ramadhan_active_for_date(today, db)

    # Helper function untuk filter periode
    def get_period_filter():
        if period == "hari-ini":
            return func.date(models.AttendanceLog.scan_time) == today
        elif period == "pekan-ini":
            start_week = today - timedelta(days=today.weekday())
            return models.AttendanceLog.scan_time >= start_week
        elif period == "bulan-ini":
            return and_(
                extract('month', models.AttendanceLog.scan_time) == now.month,
                extract('year', models.AttendanceLog.scan_time) == now.year
            )
        elif period == "tahun-ini":
            return extract('year', models.AttendanceLog.scan_time) == now.year
        elif period == "ramadhan":
            ramadhan_cfg = get_ramadhan_status(target_date=today, db=db)
            start_ramadhan = ramadhan_cfg.get("start_date")
            end_ramadhan = ramadhan_cfg.get("end_date")
            if start_ramadhan and end_ramadhan:
                return and_(
                    func.date(models.AttendanceLog.scan_time) >= start_ramadhan,
                    func.date(models.AttendanceLog.scan_time) <= end_ramadhan
                )
            return models.AttendanceLog.id == -1
        else:
            return None  # All time

    period_filter = get_period_filter()

    # --------------------------------------------------
    # 1. Top Jamaah (Leaderboard Ringkas)
    # --------------------------------------------------
    top_jamaah_query = db.query(
        models.Jamaah.id,
        models.Jamaah.nama,
        func.count(models.AttendanceLog.id).label("kehadiran_period")
    ).join(
        models.AttendanceLog, models.Jamaah.id == models.AttendanceLog.jamaah_id
    )

    if period_filter is not None:
        top_jamaah_query = top_jamaah_query.filter(period_filter)

    top_jamaah_results = top_jamaah_query.group_by(
        models.Jamaah.id, models.Jamaah.nama
    ).order_by(
        desc("kehadiran_period")
    ).limit(5).all()

    max_attendance = top_jamaah_results[0].kehadiran_period if top_jamaah_results else 1

    top_jamaah_data = [
        {
            "id": row.id,
            "nama": row.nama,
            "kehadiran": row.kehadiran_period,
            "persentase": round(
                (row.kehadiran_period / max_attendance) * 100, 1
            ) if max_attendance > 0 else 0
        }
        for row in top_jamaah_results
    ]

    # --------------------------------------------------
    # 2. Distribusi Waktu Sholat (Pie Chart)
    # --------------------------------------------------
    distribusi_query = db.query(
        models.AttendanceLog.waktu_sholat,
        func.count(models.AttendanceLog.id).label("count")
    ).filter(
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    )

    if period_filter is not None:
        distribusi_query = distribusi_query.filter(period_filter)

    distribusi_raw = distribusi_query.group_by(
        models.AttendanceLog.waktu_sholat
    ).all()

    COLORS = {
        "Subuh": "#0C5E3C",
        "Syuruq": "#4CAF50",
        "Dzuhur": "#78C2A4",
        "Ashar": "#D4AF37",
        "Maghrib": "#0A4D30",
        "Isya": "#5A9D7E",
        "Tarawih": "#8B5CF6",
    }

    distribusi_data = []
    for waktu, count in distribusi_raw:
        if waktu == "Tarawih" and not ramadhan_active_today:
            continue
        distribusi_data.append({
            "kategori": waktu if waktu else "Tidak diketahui",
            "nilai": count,
            "color": COLORS.get(waktu, "#CCCCCC"),
            "persentase": 0
        })

    # Calculate percentages
    total_distribusi = sum(item["nilai"] for item in distribusi_data)
    for item in distribusi_data:
        if total_distribusi > 0:
            item["persentase"] = round((item["nilai"] / total_distribusi) * 100, 1)

    # --------------------------------------------------
    # 3. Monthly Trend (Rolling 6 Bulan)
    # - Basis bulan berjalan
    # - Tidak mundur melewati bulan pertama data
    # --------------------------------------------------
    first_data_raw = db.query(func.min(func.date(models.AttendanceLog.scan_time))).scalar()
    first_data_date = _coerce_date(first_data_raw)

    current_month_start = _month_start(today)
    first_month_start = _month_start(first_data_date) if first_data_date else current_month_start
    window_start_month = max(first_month_start, _add_months(current_month_start, -5))

    month_starts: List[date] = []
    cursor_month = window_start_month
    while cursor_month <= current_month_start:
        month_starts.append(cursor_month)
        cursor_month = _add_months(cursor_month, 1)

    monthly_data = []
    for month_start in month_starts:
        next_month_start = _add_months(month_start, 1)
        total = db.query(func.count(models.AttendanceLog.id)).filter(
            models.AttendanceLog.scan_time >= month_start,
            models.AttendanceLog.scan_time < next_month_start,
            models.AttendanceLog.status_kehadiran != "DI_LUAR_WAKTU_SHOLAT"
        ).scalar() or 0

        unique_jamaah = db.query(func.count(func.distinct(models.AttendanceLog.jamaah_id))).filter(
            models.AttendanceLog.scan_time >= month_start,
            models.AttendanceLog.scan_time < next_month_start,
            models.AttendanceLog.status_kehadiran != "DI_LUAR_WAKTU_SHOLAT"
        ).scalar() or 0

        monthly_data.append({
            "bulan": calendar.month_abbr[month_start.month],
            "tahun": month_start.year,
            "bulan_angka": month_start.month,
            "kehadiran": total,
            "unique_jamaah": unique_jamaah,
            "avg_per_jamaah": round(total / max(unique_jamaah, 1), 2),
            "target": 100
        })

    # --------------------------------------------------
    # 4. Peak Hours (Jam Tersibuk)
    # --------------------------------------------------
    peak_hours_query = db.query(
        extract('hour', models.AttendanceLog.scan_time).label("jam"),
        func.count(models.AttendanceLog.id).label("count")
    ).filter(
        models.AttendanceLog.status_kehadiran != "DI_LUAR_WAKTU_SHOLAT"
    )

    if period_filter is not None:
        peak_hours_query = peak_hours_query.filter(period_filter)

    peak_hours_raw = peak_hours_query.group_by("jam").order_by("jam").all()

    peak_hours_data = [
        {
            "jam": f"{int(jam):02d}:00",
            "jam_angka": int(jam),
            "jamaah": count,
            "persentase_dari_total": round((count / total_distribusi) * 100, 1) if total_distribusi > 0 else 0
        }
        for jam, count in peak_hours_raw
    ]

    # --------------------------------------------------
    # 5. Status Kehadiran (Tepat Waktu vs Terlambat)
    # --------------------------------------------------
    status_query = db.query(
        models.AttendanceLog.status_kehadiran,
        func.count(models.AttendanceLog.id).label("count")
    )

    if period_filter is not None:
        status_query = status_query.filter(period_filter)

    status_raw = status_query.group_by(models.AttendanceLog.status_kehadiran).all()

    status_data = []
    for status, count in status_raw:
        if status:  # Skip None
            status_data.append({
                "status": status,
                "count": count,
                "persentase": round((count / total_distribusi) * 100, 1) if total_distribusi > 0 else 0
            })

    # --------------------------------------------------
    # 6. Overall Statistics
    # --------------------------------------------------
    overall_stats = {
        "total_jamaah": db.query(models.Jamaah).count(),
        "total_attendance_all_time": db.query(models.AttendanceLog).count(),
        "period": period,
        "period_filter_applied": period_filter is not None
    }

    # Add period-specific stats
    if period_filter is not None:
        overall_stats["attendance_in_period"] = db.query(models.AttendanceLog).filter(period_filter).count()
        overall_stats["unique_jamaah_in_period"] = db.query(
            func.count(func.distinct(models.AttendanceLog.jamaah_id))
        ).filter(period_filter).scalar()

    # --------------------------------------------------
    # 7. Sholat Trend Data (Rolling 4 Minggu)
    # - Basis minggu berjalan (current week)
    # - Urutan: minggu1=terlama ... minggu4=minggu berjalan
    # --------------------------------------------------
    sholat_trend_data = []
    sholat_list = get_sholat_order(
        db=db,
        target_date=today,
        include_syuruq=False,
    )

    current_week_start = today - timedelta(days=today.weekday())
    week_starts = [
        current_week_start - timedelta(weeks=3),
        current_week_start - timedelta(weeks=2),
        current_week_start - timedelta(weeks=1),
        current_week_start,
    ]

    for sholat in sholat_list:
        weekly_counts: List[int] = []
        for week_start in week_starts:
            week_end_exclusive = week_start + timedelta(days=7)

            count = db.query(func.count(models.AttendanceLog.id)).filter(
                models.AttendanceLog.waktu_sholat == sholat,
                models.AttendanceLog.scan_time >= week_start,
                models.AttendanceLog.scan_time < week_end_exclusive,
                models.AttendanceLog.status_kehadiran != "DI_LUAR_WAKTU_SHOLAT"
            ).scalar() or 0

            weekly_counts.append(count)

        sholat_trend_data.append({
            "waktu": sholat,
            "minggu1": weekly_counts[0],
            "minggu2": weekly_counts[1],
            "minggu3": weekly_counts[2],
            "minggu4": weekly_counts[3],
            "total": sum(weekly_counts),
            "rata_rata": round(sum(weekly_counts) / 4, 1)
        })

    # --------------------------------------------------
    # Response
    # --------------------------------------------------
    return {
        "overall_stats": overall_stats,
        "top_jamaah": top_jamaah_data,
        "distribusi_sholat": distribusi_data,
        "monthly_trend": monthly_data,
        "peak_hours": peak_hours_data,
        "status_kehadiran": status_data,
        "sholat_trend": sholat_trend_data,
        "period_info": {
            "period": period,
            "start_date": window_start_month.isoformat() if month_starts else None,
            "end_date": today.isoformat(),
            "timestamp": now.isoformat()
        }
    }
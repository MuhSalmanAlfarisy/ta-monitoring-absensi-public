from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from typing import Optional
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo

from database import get_db
import models
from utils import get_hari_indonesia, get_sholat_order
from config import settings

router = APIRouter(prefix="/api/attendance", tags=["Attendance Stats"])

OUTSIDE_PRAYER_LABEL = "Di Luar Waktu Sholat"


def _now_local() -> datetime:
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now()


@router.get("/stats/daily")
def get_daily_attendance_stats(
    days: int = Query(7, ge=1, le=365, description="Jumlah hari ke belakang"),
    db: Session = Depends(get_db)
):
    """
    Get daily attendance statistics (untuk dashboard chart)
    """
    try:
        now_local = _now_local()
        today = now_local.date()

        def _coerce_date(raw_value) -> Optional[date]:
            if raw_value is None:
                return None
            if isinstance(raw_value, datetime):
                return raw_value.date()
            if isinstance(raw_value, date):
                return raw_value
            if isinstance(raw_value, str):
                # SQLite biasanya mengembalikan string "YYYY-MM-DD" untuk func.date(...)
                try:
                    return datetime.strptime(raw_value[:10], "%Y-%m-%d").date()
                except ValueError:
                    return None
            return None

        # Rolling window maksimal 7 hari (atau sesuai param), tidak mundur melewati hari pertama data.
        first_data_raw = db.query(func.min(func.date(models.AttendanceLog.scan_time))).filter(
            models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
            models.AttendanceLog.event_id.is_(None)
        ).scalar()
        first_data_date = _coerce_date(first_data_raw)
        requested_start = today - timedelta(days=days - 1)
        window_start = max(requested_start, first_data_date) if first_data_date else requested_start
        window_end = today

        start_dt = datetime.combine(window_start, datetime.min.time())
        end_dt_exclusive = datetime.combine(window_end + timedelta(days=1), datetime.min.time())

        # Query aggregate harian di window rolling.
        daily_stats_rows = db.query(
            func.date(models.AttendanceLog.scan_time).label("date"),
            func.count(models.AttendanceLog.id).label("total"),
            func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("unique_jamaah"),
            func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
            func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat")
        ).filter(
            models.AttendanceLog.scan_time >= start_dt,
            models.AttendanceLog.scan_time < end_dt_exclusive,
            models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
            models.AttendanceLog.event_id.is_(None)
        ).group_by(
            func.date(models.AttendanceLog.scan_time)
        ).order_by(
            func.date(models.AttendanceLog.scan_time).asc()
        ).all()

        # Query per sholat distribution untuk hari ini
        sholat_stats = db.query(
            models.AttendanceLog.waktu_sholat,
            func.count(models.AttendanceLog.id).label("count")
        ).filter(
            func.date(models.AttendanceLog.scan_time) == today,
            models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
            models.AttendanceLog.event_id.is_(None)
        ).group_by(
            models.AttendanceLog.waktu_sholat
        ).all()

        # Format sholat stats
        sholat_distribution = {sholat: count for sholat, count in sholat_stats}

        # Normalisasi hasil query ke map tanggal -> agregasi,
        # lalu isi hari yang tidak punya log dengan nol agar chart tidak kosong/putus.
        daily_map = {}
        for stat in daily_stats_rows:
            stat_date = _coerce_date(stat.date)
            if not stat_date:
                continue
            daily_map[stat_date] = {
                "total": stat.total or 0,
                "unique_jamaah": stat.unique_jamaah or 0,
                "tepat_waktu": stat.tepat_waktu or 0,
                "terlambat": stat.terlambat or 0
            }

        formatted_daily = []
        cursor = window_start
        while cursor <= window_end:
            stat = daily_map.get(cursor, {
                "total": 0,
                "unique_jamaah": 0,
                "tepat_waktu": 0,
                "terlambat": 0
            })
            formatted_daily.append({
                "date": cursor.strftime("%Y-%m-%d"),
                "day": get_hari_indonesia(cursor),
                "total": stat["total"],
                "unique_jamaah": stat["unique_jamaah"],
                "tepat_waktu": stat["tepat_waktu"],
                "terlambat": stat["terlambat"],
                "avg_per_jamaah": round(stat["total"] / max(stat["unique_jamaah"], 1), 2)
            })
            cursor += timedelta(days=1)

        total_attendance_window = sum(item["total"] for item in formatted_daily)
        total_unique_window = sum(item["unique_jamaah"] for item in formatted_daily)
        total_days_window = len(formatted_daily)

        return {
            "period": {
                "start_date": window_start.strftime("%Y-%m-%d"),
                "end_date": window_end.strftime("%Y-%m-%d"),
                "days": total_days_window
            },
            "daily_stats": formatted_daily,
            "today_stats": {
                "total_jamaah": db.query(models.Jamaah).count(),
                "attendance_today": db.query(models.AttendanceLog).filter(
                    func.date(models.AttendanceLog.scan_time) == today,
                    models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
                    models.AttendanceLog.event_id.is_(None)
                ).count(),
                "unique_jamaah_today": db.query(func.distinct(models.AttendanceLog.jamaah_id)).filter(
                    func.date(models.AttendanceLog.scan_time) == today,
                    models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
                    models.AttendanceLog.event_id.is_(None)
                ).count()
            },
            "sholat_distribution": sholat_distribution,
            "summary": {
                "total_days": total_days_window,
                "total_attendance": total_attendance_window,
                "avg_attendance_per_day": round(total_attendance_window / max(total_days_window, 1), 1),
                "avg_unique_jamaah_per_day": round(total_unique_window / max(total_days_window, 1), 1)
            }
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ Error in get_daily_attendance_stats: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve daily stats: {str(e)}")


@router.get("/stats/sholat")
def get_sholat_attendance_stats(
    start_date: Optional[date] = Query(None, description="Tanggal mulai"),
    end_date: Optional[date] = Query(None, description="Tanggal akhir"),
    db: Session = Depends(get_db)
):
    """
    Get attendance statistics per waktu sholat
    """
    try:
        # Default to last 30 days if no date range provided
        if not start_date or not end_date:
            end_date = _now_local().date()
            start_date = end_date - timedelta(days=30)

        # Query per sholat
        sholat_stats = db.query(
            models.AttendanceLog.waktu_sholat,
            func.count(models.AttendanceLog.id).label("total"),
            func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("unique_jamaah"),
            func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
            func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat"),
            func.avg(
                extract('hour', models.AttendanceLog.scan_time) * 60
                + extract('minute', models.AttendanceLog.scan_time)
            ).label("avg_scan_time")
        ).filter(
            models.AttendanceLog.scan_time >= start_date,
            models.AttendanceLog.scan_time < (end_date + timedelta(days=1)),
            models.AttendanceLog.waktu_sholat.isnot(None),
            models.AttendanceLog.event_id.is_(None)
        ).group_by(
            models.AttendanceLog.waktu_sholat
        ).order_by(
            func.count(models.AttendanceLog.id).desc()
        ).all()

        # Format response
        formatted_stats = []
        for stat in sholat_stats:
            if stat.waktu_sholat:  # Skip null/None
                avg_minutes = int(stat.avg_scan_time) if stat.avg_scan_time else 0
                avg_time = f"{avg_minutes // 60:02d}:{avg_minutes % 60:02d}" if avg_minutes > 0 else "N/A"

                formatted_stats.append({
                    "waktu_sholat": stat.waktu_sholat,
                    "total": stat.total,
                    "unique_jamaah": stat.unique_jamaah,
                    "tepat_waktu": stat.tepat_waktu or 0,
                    "terlambat": stat.terlambat or 0,
                    "persentase_tepat_waktu": round((stat.tepat_waktu or 0) / max(stat.total, 1) * 100, 1),
                    "avg_scan_time": avg_time,
                    "avg_attendance_per_jamaah": round(stat.total / max(stat.unique_jamaah, 1), 2)
                })

        # Sort by predefined sholat order
        sholat_order = get_sholat_order(
            db=db,
            target_date=_now_local().date(),
            include_syuruq=True,
        )
        sorted_stats = sorted(
            [
                stat for stat in formatted_stats
                if stat["waktu_sholat"] in sholat_order
            ],
            key=lambda x: sholat_order.index(x["waktu_sholat"]) if x["waktu_sholat"] in sholat_order else 999
        )

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "sholat_stats": sorted_stats,
            "summary": {
                "total_attendance": sum(stat["total"] for stat in sorted_stats),
                "most_attended": max(sorted_stats, key=lambda x: x["total"]) if sorted_stats else None,
                "least_attended": min(sorted_stats, key=lambda x: x["total"]) if sorted_stats else None,
                "best_punctuality": max(sorted_stats, key=lambda x: x["persentase_tepat_waktu"]) if sorted_stats else None
            }
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"❌ Error in get_sholat_attendance_stats: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sholat stats: {str(e)}")
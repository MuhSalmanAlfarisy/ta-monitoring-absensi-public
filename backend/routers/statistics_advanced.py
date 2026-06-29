from datetime import datetime, timedelta, date
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract, case, text
from sqlalchemy.orm import Session

from database import get_db
import models
from config import settings
from utils import get_sholat_order

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


# ======================================================
# ADVANCED STATISTICS
# ======================================================

@router.get("/attendance-trend")
def get_attendance_trend(
    interval: str = Query("daily", description="Interval: daily, weekly, monthly"),
    days: int = Query(30, ge=1, le=365, description="Jumlah hari ke belakang"),
    db: Session = Depends(get_db)
):
    """
    Get attendance trend data untuk line chart
    """
    end_date = _now_local()
    start_date = end_date - timedelta(days=days)

    if interval == "daily":
        group_by_expr = func.date(models.AttendanceLog.scan_time)
        label_format = "%Y-%m-%d"
    elif interval == "weekly":
        # MySQL-compatible: get Monday of each week
        group_by_expr = func.date(
            models.AttendanceLog.scan_time - text("INTERVAL WEEKDAY(scan_time) DAY")
        )
        label_format = "Week %U"
    else:  # monthly
        # MySQL-compatible: truncate to first day of month
        group_by_expr = func.date_format(
            models.AttendanceLog.scan_time, '%Y-%m-01'
        )
        label_format = "%b %Y"

    trend_data = db.query(
        group_by_expr.label("period"),
        func.count(models.AttendanceLog.id).label("total"),
        func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("unique_jamaah"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat")
    ).filter(
        models.AttendanceLog.scan_time >= start_date,
        models.AttendanceLog.scan_time <= end_date,
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    ).group_by(
        group_by_expr
    ).order_by(
        "period"
    ).all()

    formatted_data = []
    for row in trend_data:
        period_date = row.period
        # MySQL DATE_FORMAT returns string, DATE() returns date object
        if isinstance(period_date, str):
            try:
                period_date = datetime.strptime(period_date[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
        elif isinstance(period_date, datetime):
            period_date = period_date.date()

        if isinstance(period_date, date):
            period_str = period_date.strftime(label_format)
        else:
            period_str = str(period_date)

        period_iso = period_date.isoformat() if hasattr(period_date, 'isoformat') else str(period_date)

        formatted_data.append({
            "period": period_str,
            "period_date": period_iso,
            "total": row.total,
            "unique_jamaah": row.unique_jamaah,
            "tepat_waktu": row.tepat_waktu or 0,
            "terlambat": row.terlambat or 0,
            "persentase_tepat_waktu": round((row.tepat_waktu or 0) / max(row.total, 1) * 100, 1)
        })

    return {
        "interval": interval,
        "period": {
            "start_date": start_date.date().isoformat(),
            "end_date": end_date.date().isoformat(),
            "days": days
        },
        "data": formatted_data,
        "summary": {
            "total_period": sum(item["total"] for item in formatted_data),
            "avg_per_period": round(sum(item["total"] for item in formatted_data) / max(len(formatted_data), 1), 1),
            "max_period": max(item["total"] for item in formatted_data) if formatted_data else 0,
            "min_period": min(item["total"] for item in formatted_data) if formatted_data else 0
        }
    }


@router.get("/punctuality-analysis")
def get_punctuality_analysis(
    waktu_sholat: Optional[str] = Query(None, description="Filter by waktu sholat"),
    db: Session = Depends(get_db)
):
    """
    Analisis ketepatan waktu per sholat
    """
    query = db.query(
        models.AttendanceLog.waktu_sholat,
        func.count(models.AttendanceLog.id).label("total"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat"),
        func.avg(
            extract('hour', models.AttendanceLog.scan_time) * 60 +
            extract('minute', models.AttendanceLog.scan_time)
        ).label("avg_scan_time_minutes")
    ).filter(
        models.AttendanceLog.waktu_sholat.isnot(None),
        models.AttendanceLog.status_kehadiran.isnot(None),
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    )

    if waktu_sholat and waktu_sholat != "all":
        query = query.filter(models.AttendanceLog.waktu_sholat == waktu_sholat)

    results = query.group_by(
        models.AttendanceLog.waktu_sholat
    ).order_by(
        models.AttendanceLog.waktu_sholat
    ).all()

    analysis = []
    for row in results:
        total = row.total or 0
        tepat_waktu = row.tepat_waktu or 0
        terlambat = row.terlambat or 0

        # Convert average minutes to time string
        avg_minutes = int(row.avg_scan_time_minutes) if row.avg_scan_time_minutes else 0
        avg_time = f"{avg_minutes // 60:02d}:{avg_minutes % 60:02d}" if avg_minutes > 0 else "N/A"

        analysis.append({
            "waktu_sholat": row.waktu_sholat,
            "total": total,
            "tepat_waktu": tepat_waktu,
            "terlambat": terlambat,
            "persentase_tepat_waktu": round((tepat_waktu / total * 100), 1) if total > 0 else 0,
            "persentase_terlambat": round((terlambat / total * 100), 1) if total > 0 else 0,
            "rata_rata_waktu_scan": avg_time,
            "rata_rata_menit": avg_minutes
        })

    # Sort by predefined sholat order
    sholat_order = get_sholat_order(
        db=db,
        target_date=_now_local().date(),
        include_syuruq=True,
    )
    sorted_analysis = sorted(
        [item for item in analysis if item["waktu_sholat"] in sholat_order],
        key=lambda x: sholat_order.index(x["waktu_sholat"]) if x["waktu_sholat"] in sholat_order else 999
    )

    return {
        "analysis": sorted_analysis,
        "summary": {
            "total_analyzed": sum(item["total"] for item in sorted_analysis),
            "overall_punctuality": round(
                sum(item["tepat_waktu"] for item in sorted_analysis) /
                max(sum(item["total"] for item in sorted_analysis), 1) * 100, 1
            ),
            "most_punctual": max(sorted_analysis, key=lambda x: x["persentase_tepat_waktu"]) if sorted_analysis else None,
            "least_punctual": min(sorted_analysis, key=lambda x: x["persentase_tepat_waktu"]) if sorted_analysis else None
        }
    }
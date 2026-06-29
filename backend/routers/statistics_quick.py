from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract, case
from sqlalchemy.orm import Session

from database import get_db
import models
from config import settings

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
# QUICK STATS (Untuk Dashboard Widget)
# ======================================================

@router.get("/quick-stats")
def get_quick_stats(db: Session = Depends(get_db)):
    """
    Quick statistics untuk dashboard widgets
    """
    now = _now_local()
    today = now.date()

    # Today's overall scans (termasuk scan di luar waktu sholat)
    today_total_all = db.query(
        func.count(models.AttendanceLog.id)
    ).filter(
        func.date(models.AttendanceLog.scan_time) == today
    ).scalar() or 0

    # Today's valid scans (exclude di luar waktu sholat) untuk punctuality
    today_stats = db.query(
        func.count(models.AttendanceLog.id).label("total"),
        func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("unique_jamaah"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat")
    ).filter(
        func.date(models.AttendanceLog.scan_time) == today,
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    ).first()

    # Yesterday's valid stats for comparison
    yesterday = today - timedelta(days=1)
    yesterday_valid_total = db.query(
        func.count(models.AttendanceLog.id)
    ).filter(
        func.date(models.AttendanceLog.scan_time) == yesterday,
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    ).scalar() or 0

    # This week stats (valid scans only)
    start_week = today - timedelta(days=today.weekday())
    week_stats = db.query(
        func.count(models.AttendanceLog.id).label("total"),
        func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("unique_jamaah")
    ).filter(
        models.AttendanceLog.scan_time >= start_week,
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    ).first()

    # This month stats (valid scans only)
    month_stats = db.query(
        func.count(models.AttendanceLog.id).label("total"),
        func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("unique_jamaah")
    ).filter(
        extract('month', models.AttendanceLog.scan_time) == now.month,
        extract('year', models.AttendanceLog.scan_time) == now.year,
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    ).first()

    # All time stats
    all_time_stats = {
        "total_jamaah": db.query(func.count(models.Jamaah.id)).scalar() or 0,
        "total_attendance": db.query(func.count(models.AttendanceLog.id)).scalar() or 0,
        "total_with_photos": db.query(func.count(models.AttendanceLog.id)).filter(
            models.AttendanceLog.photo_url.isnot(None),
            models.AttendanceLog.photo_url != ""
        ).scalar() or 0
    }

    # Calculate changes
    today_total = today_stats.total or 0
    yesterday_total = yesterday_valid_total or 0
    daily_change = today_total - yesterday_total
    daily_change_percent = round((daily_change / yesterday_total * 100), 1) if yesterday_total > 0 else 0

    return {
        "today": {
            # Tetap expose total semua scan untuk widget "Total Scan Hari Ini"
            "total": today_total_all,
            "total_valid": today_total,
            "unique_jamaah": today_stats.unique_jamaah or 0,
            "tepat_waktu": today_stats.tepat_waktu or 0,
            "terlambat": today_stats.terlambat or 0,
            "daily_change": daily_change,
            "daily_change_percent": daily_change_percent,
            "persentase_tepat_waktu": round((today_stats.tepat_waktu or 0) / max(today_total, 1) * 100, 1)
        },
        "this_week": {
            "total": week_stats.total or 0,
            "unique_jamaah": week_stats.unique_jamaah or 0,
            "avg_per_day": round((week_stats.total or 0) / 7, 1)
        },
        "this_month": {
            "total": month_stats.total or 0,
            "unique_jamaah": month_stats.unique_jamaah or 0,
            "avg_per_day": round((month_stats.total or 0) / now.day, 1)
        },
        "all_time": all_time_stats,
        "updated_at": now.isoformat()
    }

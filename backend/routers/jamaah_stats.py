from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, date, timedelta

from database import get_db
import models

router = APIRouter(prefix="/api/jamaah", tags=["Jamaah Stats"])


@router.get("/{jamaah_id}/stats/daily")
def get_jamaah_daily_stats(
    jamaah_id: str,
    days: int = Query(30, ge=1, le=365, description="Jumlah hari ke belakang"),
    db: Session = Depends(get_db)
):
    """
    Get daily statistics untuk jamaah (untuk chart)
    """
    # Validasi jamaah exists
    jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == jamaah_id).first()
    if not jamaah:
        raise HTTPException(status_code=404, detail="Jamaah tidak ditemukan")

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Query daily counts
    daily_stats = db.query(
        func.date(models.AttendanceLog.scan_time).label("date"),
        func.count(models.AttendanceLog.id).label("count"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat")
    ).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.scan_time >= start_date,
        models.AttendanceLog.scan_time <= end_date,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).group_by(
        func.date(models.AttendanceLog.scan_time)
    ).order_by(
        func.date(models.AttendanceLog.scan_time).desc()
    ).all()

    # Format response
    formatted_stats = []
    for stat in daily_stats:
        # Handle SQLite date returning string
        date_obj = stat.date
        if isinstance(date_obj, str):
            try:
                date_obj = datetime.strptime(date_obj, "%Y-%m-%d").date()
            except ValueError:
                date_obj = date.today()  # Fallback
        elif isinstance(date_obj, datetime):
            date_obj = date_obj.date()

        formatted_stats.append({
            "date": date_obj.strftime("%Y-%m-%d"),
            "day": date_obj.strftime("%A"),
            "total": stat.count,
            "tepat_waktu": stat.tepat_waktu or 0,
            "terlambat": stat.terlambat or 0,
            "sholat_distribution": {}  # Bisa ditambahkan jika perlu
        })

    return {
        "jamaah_id": jamaah_id,
        "jamaah_nama": jamaah.nama,
        "period": {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "days": days
        },
        "daily_stats": formatted_stats,
        "summary": {
            "total_days_with_attendance": len(daily_stats),
            "total_attendance": sum(stat.count for stat in daily_stats),
            "average_per_day": round(sum(stat.count for stat in daily_stats) / max(len(daily_stats), 1), 2)
        }
    }
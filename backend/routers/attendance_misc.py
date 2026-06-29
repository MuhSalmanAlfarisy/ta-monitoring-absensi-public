from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from zoneinfo import ZoneInfo

from database import get_db
import models
from utils import get_hari_indonesia
from config import settings
from routers.system import require_king_admin

router = APIRouter(prefix="/api/attendance", tags=["Attendance Misc"])


def _now_local() -> datetime:
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now()


@router.get("/recent")
def get_recent_attendance(
    limit: int = Query(20, ge=1, le=100, description="Jumlah data terbaru"),
    include_photo: bool = Query(True, description="Include log dengan foto"),
    db: Session = Depends(get_db)
):
    """
    Get recent attendance logs (untuk dashboard widget)
    """
    query = db.query(
        models.AttendanceLog,
        models.Jamaah.nama.label("nama_jamaah"),
        models.Jamaah.foto_profil_url.label("foto_profil")
    ).join(
        models.Jamaah, models.AttendanceLog.jamaah_id == models.Jamaah.id
    ).filter(
        models.AttendanceLog.event_id.is_(None)
    )

    # Filter hanya yang ada foto jika diminta
    if include_photo:
        query = query.filter(models.AttendanceLog.photo_url.isnot(None))

    logs = query.order_by(
        desc(models.AttendanceLog.scan_time)
    ).limit(limit).all()

    # Format response
    results = []
    for log, nama_jamaah, foto_profil in logs:
        results.append({
            "id": log.id,
            "jamaah_id": log.jamaah_id,
            "jamaah_nama": nama_jamaah,
            "scan_time": log.scan_time,
            "hari": get_hari_indonesia(log.scan_time) if log.scan_time else None,
            "waktu": log.scan_time.strftime("%H:%M") if log.scan_time else None,
            "waktu_sholat": log.waktu_sholat,
            "status_kehadiran": log.status_kehadiran,
            "photo_url": log.photo_url,
            "foto_profil_jamaah": foto_profil,
            "verify_method": log.verify_method,
            "device_cloud_id": log.device_cloud_id
        })

    return {
        "recent_attendance": results,
        "total": len(results),
        "limit": limit,
        "include_photo": include_photo
    }


@router.get("/photos/recent")
def get_recent_photos(
    limit: int = Query(12, ge=1, le=50, description="Jumlah foto terbaru"),
    db: Session = Depends(get_db)
):
    """
    Get recent attendance photos (untuk gallery dashboard)
    """
    logs = db.query(
        models.AttendanceLog,
        models.Jamaah.nama.label("nama_jamaah")
    ).join(
        models.Jamaah, models.AttendanceLog.jamaah_id == models.Jamaah.id
    ).filter(
        models.AttendanceLog.photo_url.isnot(None),
        models.AttendanceLog.photo_url != "",
        models.AttendanceLog.event_id.is_(None)
    ).order_by(
        desc(models.AttendanceLog.scan_time)
    ).limit(limit).all()

    photos = []
    for log, nama_jamaah in logs:
        photos.append({
            "id": log.id,
            "jamaah_id": log.jamaah_id,
            "jamaah_nama": nama_jamaah,
            "scan_time": log.scan_time,
            "photo_url": log.photo_url,
            "waktu_sholat": log.waktu_sholat,
            "status_kehadiran": log.status_kehadiran,
            "waktu": log.scan_time.strftime("%H:%M") if log.scan_time else None
        })

    return {
        "photos": photos,
        "total": len(photos),
        "limit": limit
    }


@router.delete("/{log_id}", dependencies=[Depends(require_king_admin)])
def delete_attendance_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete satu attendance log.
    Endpoint ini hanya boleh diakses King Admin.
    """
    log = db.query(models.AttendanceLog).filter(models.AttendanceLog.id == log_id).first()

    if not log:
        raise HTTPException(status_code=404, detail="Attendance log tidak ditemukan")

    try:
        jamaah_id = log.jamaah_id

        db.delete(log)
        db.commit()

        jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == jamaah_id).first()

        return {
            "success": True,
            "message": f"Attendance log {log_id} berhasil dihapus",
            "deleted_log_id": log_id,
            "jamaah_id": jamaah_id,
            # total_scan & last_seen tetap berbasis scan attempt (bukan attendance valid)
            "jamaah_total_scan": jamaah.total_kehadiran if jamaah else None,
            "jamaah_last_seen_at": (
                jamaah.last_seen_at.isoformat()
                if jamaah and jamaah.last_seen_at
                else None
            ),
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Gagal menghapus attendance log: {str(e)}"
        )
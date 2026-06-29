from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from datetime import datetime, date
import csv
import io
from zoneinfo import ZoneInfo

from database import get_db
import models
import schemas
from utils import get_hari_indonesia, format_date_id
from config import settings

router = APIRouter(prefix="/api/attendance", tags=["Attendance Global"])

OUTSIDE_PRAYER_LABEL = "Di Luar Waktu Sholat"


def _now_local() -> datetime:
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now()


@router.get("/", response_model=schemas.AttendanceLogListResponse)
def get_attendance_logs(
    # Pagination
    skip: int = Query(0, ge=0, description="Jumlah data yang akan dilewati"),
    limit: int = Query(100, ge=1, le=500, description="Jumlah data per halaman"),

    # Filter Params
    search: Optional[str] = Query(None, description="Cari berdasarkan nama jamaah"),
    start_date: Optional[date] = Query(None, description="Tanggal mulai (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Tanggal akhir (YYYY-MM-DD)"),
    waktu_sholat: Optional[List[str]] = Query(None, description="Filter by waktu sholat"),
    status_kehadiran: Optional[str] = Query(None, description="Filter by status (tepat_waktu/terlambat)"),

    # Tab filter
    tab: Optional[str] = Query("sholat", description="Tab: 'sholat' (default), 'diluar' (di luar waktu sholat), or 'event' (custom event)"),

    # Sorting
    sort_by: str = Query("scan_time", description="Sort by: 'scan_time', 'jamaah_name', 'waktu_sholat'"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),

    db: Session = Depends(get_db)
):
    """
    API untuk Riwayat Absensi Global dengan Server-Side Filtering

    ❗ CATATAN:
    - Data attendance berasal dari webhook mesin absensi
    - Setiap log sudah memiliki waktu_sholat dan status_kehadiran yang otomatis terhitung
    """
    # Base Query dengan join ke tabel Jamaah
    query = db.query(
        models.AttendanceLog,
        models.Jamaah.nama.label("nama_jamaah"),
        models.Jamaah.foto_profil_url.label("foto_profil_jamaah")
    ).join(
        models.Jamaah, models.AttendanceLog.jamaah_id == models.Jamaah.id
    )

    # Untuk tab event, join ke tabel Event agar bisa ambil nama event
    if tab == "event":
        query = query.outerjoin(
            models.Event, models.AttendanceLog.event_id == models.Event.id
        ).add_columns(models.Event.title.label("event_title"))

    # Tab filter: sholat / diluar / event
    if tab == "event":
        # Tab Event: hanya record yang memiliki event_id
        query = query.filter(models.AttendanceLog.event_id.isnot(None))
    elif tab == "diluar":
        # Tab Diluar: di luar waktu sholat DAN bukan record event
        query = query.filter(
            models.AttendanceLog.waktu_sholat == OUTSIDE_PRAYER_LABEL,
            models.AttendanceLog.event_id.is_(None)
        )
    else:
        # Tab Sholat (default): waktu sholat DAN bukan record event
        query = query.filter(
            models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
            models.AttendanceLog.event_id.is_(None)
        )

    # 1. Filter Search (Nama jamaah)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Jamaah.nama.ilike(search_term),
                models.Jamaah.id.ilike(search_term)  # ❗ ID = PIN
            )
        )
    # 2. Filter Tanggal
    if start_date:
        query = query.filter(func.date(models.AttendanceLog.scan_time) >= start_date)
    if end_date:
        query = query.filter(func.date(models.AttendanceLog.scan_time) <= end_date)

    # 3. Filter Waktu Sholat (Multi-select)
    if waktu_sholat:
        # Filter out "all", "semua" or empty strings
        filtered_waktu = [w for w in waktu_sholat if w and w.lower() not in ["all", "semua"]]
        if filtered_waktu:
            query = query.filter(models.AttendanceLog.waktu_sholat.in_(filtered_waktu))

    # 4. Filter Status Kehadiran
    if status_kehadiran and status_kehadiran != "all":
        query = query.filter(models.AttendanceLog.status_kehadiran == status_kehadiran)

    # Get total count before pagination
    total = query.count()

    # 5. Apply Sorting
    if sort_by == "jamaah_name":
        order_column = models.Jamaah.nama
    elif sort_by == "waktu_sholat":
        order_column = models.AttendanceLog.waktu_sholat
    else:  # default: scan_time
        order_column = models.AttendanceLog.scan_time

    # Apply sort order
    if sort_order == "asc":
        query = query.order_by(order_column.asc())
    else:
        query = query.order_by(order_column.desc())

    # 6. Apply Pagination
    logs = query.offset(skip).limit(limit).all()

    # Format response
    results = []
    for row in logs:
        if tab == "event":
            # Tab event: row = (AttendanceLog, nama_jamaah, foto_profil, event_title)
            log, nama_jamaah, foto_profil, event_title = row
        else:
            # Tab sholat/diluar: row = (AttendanceLog, nama_jamaah, foto_profil)
            log, nama_jamaah, foto_profil = row
            event_title = None

        # Add additional formatted fields
        log.nama_jamaah = nama_jamaah
        log.foto_profil_jamaah = foto_profil
        log.hari = get_hari_indonesia(log.scan_time) if log.scan_time else None
        log.waktu = log.scan_time.strftime("%H:%M") if log.scan_time else None
        log.tanggal_format = format_date_id(log.scan_time) if log.scan_time else None
        log.event_title = event_title

        results.append(log)

    # Return with pagination metadata
    return {
        "data": results,
        "pagination": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total
        },
        "filters": {
            "search": search,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "waktu_sholat": waktu_sholat,
            "status_kehadiran": status_kehadiran,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
    }


@router.get("/export", response_class=StreamingResponse)
def export_attendance_logs(
    search: Optional[str] = Query(None, description="Cari berdasarkan nama jamaah"),
    start_date: Optional[date] = Query(None, description="Tanggal mulai"),
    end_date: Optional[date] = Query(None, description="Tanggal akhir"),
    waktu_sholat: Optional[List[str]] = Query(None, description="Filter waktu sholat"),
    status_kehadiran: Optional[str] = Query(None, description="Filter status"),
    db: Session = Depends(get_db)
):
    """
    Export data absensi ke CSV
    """
    # Reuse filtering logic (Copy-paste for safety to ensure independence)
    query = db.query(
        models.AttendanceLog,
        models.Jamaah.nama.label("nama_jamaah")
    ).join(
        models.Jamaah, models.AttendanceLog.jamaah_id == models.Jamaah.id
    ).filter(
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL,
        models.AttendanceLog.event_id.is_(None)
    )

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(or_(models.Jamaah.nama.ilike(search_term), models.Jamaah.id.ilike(search_term)))

    if start_date:
        query = query.filter(func.date(models.AttendanceLog.scan_time) >= start_date)
    if end_date:
        query = query.filter(func.date(models.AttendanceLog.scan_time) <= end_date)

    if waktu_sholat:
        filtered_waktu = [w for w in waktu_sholat if w and w.lower() not in ["all", "semua"]]
        if filtered_waktu:
            query = query.filter(models.AttendanceLog.waktu_sholat.in_(filtered_waktu))

    if status_kehadiran and status_kehadiran != "all":
        query = query.filter(models.AttendanceLog.status_kehadiran == status_kehadiran)

    # Get all matching records sorted by time desc
    logs = query.order_by(models.AttendanceLog.scan_time.desc()).all()

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(['No', 'Nama Jamaah', 'ID Jamaah', 'Waktu', 'Tanggal', 'Hari', 'Waktu Sholat', 'Status', 'Metode Verifikasi'])

    # Data
    for i, (log, nama_jamaah) in enumerate(logs, 1):
        writer.writerow([
            i,
            nama_jamaah,
            log.jamaah_id,
            log.scan_time.strftime("%H:%M:%S") if log.scan_time else "",
            log.scan_time.strftime("%Y-%m-%d") if log.scan_time else "",
            get_hari_indonesia(log.scan_time) if log.scan_time else "",
            log.waktu_sholat or "",
            log.status_kehadiran or "",
            log.verify_method or ""
        ])

    output.seek(0)

    filename = f"absensi_export_{_now_local().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
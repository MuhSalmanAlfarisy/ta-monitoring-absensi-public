from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/jamaah", tags=["Jamaah"])


@router.get("/", response_model=schemas.JamaahListResponse)
def get_all_jamaah(
    skip: int = Query(0, ge=0, description="Jumlah data yang akan dilewati"),
    limit: int = Query(100, ge=1, le=500, description="Jumlah data per halaman"),
    search: Optional[str] = Query(None, description="Cari berdasarkan nama"),
    sort_by: str = Query("last_seen", description="Sort by: 'name', 'last_seen', 'total_attendance'"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    db: Session = Depends(get_db)
):
    """
    Ambil semua data jamaah dengan pagination, search, dan sorting

    ❗ PERHATIAN:
    - Jamaah dibuat otomatis via webhook
    - PIN = Nama Jamaah = Primary Key
    - Tidak ada endpoint create/update jamaah
    """
    # Base query
    query = db.query(models.Jamaah)

    # Apply search filter
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(models.Jamaah.nama.ilike(search_term))

    # Get total count (before pagination)
    total = query.count()

    # Apply sorting
    if sort_by == "name":
        order_column = models.Jamaah.nama
    elif sort_by == "total_attendance":
        order_column = models.Jamaah.total_kehadiran
    else:  # default: last_seen
        order_column = models.Jamaah.last_seen_at

    # Apply sort order
    if sort_order == "asc":
        query = query.order_by(order_column.asc())
    else:
        query = query.order_by(order_column.desc(), models.Jamaah.nama.asc())

    # Apply pagination
    jamaah_list = query.offset(skip).limit(limit).all()

    return {
        "data": jamaah_list,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


@router.get("/{jamaah_id}", response_model=schemas.JamaahDetailResponse)
def get_jamaah_detail(
    jamaah_id: str,  # ❗ STRING, bukan INTEGER! (karena PIN)
    db: Session = Depends(get_db)
):
    """
    Ambil detail jamaah beserta statistik lengkap

    ❗ PERHATIAN:
    - jamaah_id adalah PIN dari mesin (String)
    - Contoh: jamaah_id = "Ahmad Fauzi"
    """
    # Cari jamaah berdasarkan PIN (String)
    jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == jamaah_id).first()

    if not jamaah:
        raise HTTPException(status_code=404, detail=f"Jamaah dengan ID '{jamaah_id}' tidak ditemukan")

    # Hitung statistik
    today = datetime.now()
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    # Query statistik sah
    total_absensi = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).count()

    # Hitung per bulan ini
    bulan_ini = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.scan_time >= start_of_month,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).count()

    # Hitung per minggu ini
    minggu_ini = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.scan_time >= start_of_week,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).count()

    # Hitung per status
    tepat_waktu_count = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU",
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).count()

    terlambat_count = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.status_kehadiran == "TERLAMBAT",
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).count()

    # Hitung per sholat
    sholat_stats = {}
    sholat_query = db.query(
        models.AttendanceLog.waktu_sholat,
        func.count(models.AttendanceLog.id).label("count")
    ).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).group_by(
        models.AttendanceLog.waktu_sholat
    ).all()

    for sholat, count in sholat_query:
        if sholat:
            sholat_stats[sholat] = count

    # Ambil riwayat terbaru (10 terakhir)
    recent_logs = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    ).order_by(
        desc(models.AttendanceLog.scan_time)
    ).limit(10).all()

    # Format recent logs untuk response
    formatted_logs = []
    for log in recent_logs:
        formatted_logs.append({
            "id": log.id,
            "scan_time": log.scan_time,
            "waktu_sholat": log.waktu_sholat,
            "status_kehadiran": log.status_kehadiran,
            "photo_url": log.photo_url,
            "verify_method": log.verify_method,
            "device_cloud_id": log.device_cloud_id
        })

    return {
        **jamaah.__dict__,
        "statistics": {
            "total_absensi": total_absensi,
            "bulan_ini": bulan_ini,
            "minggu_ini": minggu_ini,
            "tepat_waktu": tepat_waktu_count,
            "terlambat": terlambat_count,
            "per_sholat": sholat_stats,
            "persentase_tepat_waktu": round((tepat_waktu_count / total_absensi * 100), 1) if total_absensi > 0 else 0,
            "rata_per_hari": round(total_absensi / max((today - jamaah.first_seen_at).days, 1), 1) if jamaah.first_seen_at else 0
        },
        "recent_attendance": formatted_logs,
        "first_seen": jamaah.first_seen_at.strftime("%d %B %Y") if jamaah.first_seen_at else None,
        "last_seen": jamaah.last_seen_at.strftime("%d %B %Y %H:%M") if jamaah.last_seen_at else None
    }


@router.get("/{jamaah_id}/logs", response_model=schemas.AttendanceLogListResponse)
def get_jamaah_logs(
    jamaah_id: str,  # ❗ STRING!
    start_date: Optional[datetime] = Query(None, description="Tanggal mulai (YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(None, description="Tanggal akhir (YYYY-MM-DD)"),
    waktu_sholat: Optional[List[str]] = Query(None, description="Filter waktu sholat"),
    status_kehadiran: Optional[str] = Query(None, description="Filter by status (tepat_waktu/terlambat)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Ambil riwayat kehadiran jamaah dengan berbagai filter

    ❗ PERHATIAN:
    - Data diurutkan dari yang terbaru
    - Bisa filter by date range, waktu sholat, status
    """
    # Validasi jamaah exists
    jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == jamaah_id).first()
    if not jamaah:
        raise HTTPException(status_code=404, detail=f"Jamaah dengan ID '{jamaah_id}' tidak ditemukan")

    # Base query
    query = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.jamaah_id == jamaah_id,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat"
    )

    # Apply filters
    if start_date:
        query = query.filter(models.AttendanceLog.scan_time >= start_date)

    if end_date:
        query = query.filter(models.AttendanceLog.scan_time <= end_date)

    if waktu_sholat:
        filtered_waktu = [w for w in waktu_sholat if w and w.lower() not in ["all", "semua"]]
        if filtered_waktu:
            query = query.filter(models.AttendanceLog.waktu_sholat.in_(filtered_waktu))

    if status_kehadiran and status_kehadiran != "all":
        query = query.filter(models.AttendanceLog.status_kehadiran == status_kehadiran)

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    logs = query.order_by(
        desc(models.AttendanceLog.scan_time)
    ).offset(skip).limit(limit).all()

    # Return with metadata
    return {
        "data": logs,
        "pagination": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total
        },
        "filters": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "waktu_sholat": waktu_sholat,
            "status_kehadiran": status_kehadiran
        }
    }


@router.delete("/{jamaah_id}", response_model=schemas.JamaahDeleteResponse)
def delete_jamaah(
    jamaah_id: str,  # ❗ STRING!
    db: Session = Depends(get_db)
):
    """
    ❗ HAPUS JAMAHAH DARI WEBSITE SAJA

    ⚠️ PERHATIAN PENTING:
    1. Penghapusan hanya dilakukan di database website
    2. Data MASIH TERSIMPAN di mesin absensi
    3. Jika jamaah ini scan lagi, akan OTOMATIS TERDAFTAR ULANG sebagai jamaah baru
    4. Untuk penghapusan permanen, hapus juga dari mesin absensi secara terpisah

    🔄 ALUR SETELAH DELETE:
    Mesin → Scan → Webhook → "Jamaah tidak ditemukan" → Auto-create baru
    """
    # Cari jamaah
    jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == jamaah_id).first()

    if not jamaah:
        raise HTTPException(status_code=404, detail=f"Jamaah dengan ID '{jamaah_id}' tidak ditemukan")

    try:
        # Simpan info sebelum delete (untuk logging)
        jamaah_info = {
            "nama": jamaah.nama,
            "total_kehadiran": jamaah.total_kehadiran,
            "first_seen": jamaah.first_seen_at,
            "last_seen": jamaah.last_seen_at
        }

        # ❗ HAPUS JAMAHAH (akan cascade delete attendance logs)
        db.delete(jamaah)
        db.commit()

        # Log deletion (opsional, untuk audit)
        print(f"🗑️  Jamaah deleted: {jamaah_id} ({jamaah_info['nama']})")
        print(f"   Total kehadiran: {jamaah_info['total_kehadiran']}")
        print(f"   First seen: {jamaah_info['first_seen']}")
        print(f"   Last seen: {jamaah_info['last_seen']}")

        return {
            "success": True,
            "message": f"Jamaah '{jamaah_info['nama']}' berhasil dihapus dari database website",
            "warning": "❗ Data masih ada di mesin absensi. Penghapusan harus dilakukan terpisah di mesin.",
            "note": "Jika jamaah ini scan lagi, akan otomatis terdaftar ulang sebagai jamaah baru.",
            "deleted_data": {
                "jamaah_id": jamaah_id,
                "nama": jamaah_info["nama"],
                "total_kehadiran": jamaah_info["total_kehadiran"],
                "kehadiran_terakhir": jamaah_info["last_seen"].isoformat() if jamaah_info["last_seen"] else None
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Gagal menghapus jamaah: {str(e)}"
        )


# ❗ TIDAK ADA ENDPOINT CREATE/UPDATE JAMAHAH
# Karena jamaah dibuat otomatis via webhook (sesuai spesifikasi)
# Dan tidak ada fitur edit (sesuai dokumentasi)
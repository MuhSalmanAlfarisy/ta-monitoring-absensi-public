from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db
import models
from services.profile_service import (
    RamadhanSettingsPayload,
    _get_current_user_from_authorization,
    _get_or_create_ramadhan_settings,
    _is_ramadhan_active_today,
)

router = APIRouter(prefix="/api/profile", tags=["Ramadhan Settings"])


def _has_tarawih_history(db: Session) -> bool:
    """Return True if any attendance record with waktu_sholat='Tarawih' exists."""
    return db.query(models.AttendanceLog).filter(
        models.AttendanceLog.waktu_sholat == "Tarawih"
    ).first() is not None


@router.get("/ramadhan-settings")
def get_ramadhan_settings(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Read Ramadhan mode settings.
    Available for authenticated users.
    """
    _get_current_user_from_authorization(authorization, db)
    row = _get_or_create_ramadhan_settings(db)

    active_today = _is_ramadhan_active_today(row)
    has_tarawih = _has_tarawih_history(db)

    return {
        "ramadhan_mode": row.ramadhan_mode,
        "ramadhan_start_date": (
            row.ramadhan_start_date.isoformat() if row.ramadhan_start_date else None
        ),
        "ramadhan_end_date": (
            row.ramadhan_end_date.isoformat() if row.ramadhan_end_date else None
        ),
        "ramadhan_activated_at": (
            row.ramadhan_activated_at.isoformat() if row.ramadhan_activated_at else None
        ),
        "updated_by": row.updated_by,
        "is_ramadhan_active_today": active_today,
        "has_tarawih_history": has_tarawih,
        "available_prayers": (
            ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya", "Tarawih"]
            if active_today or has_tarawih
            else ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"]
        ),
    }


@router.put("/ramadhan-settings")
def update_ramadhan_settings(
    payload: RamadhanSettingsPayload,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Update Ramadhan mode settings.
    Dapat diakses role pengurus dan king_admin.
    """
    current_user = _get_current_user_from_authorization(authorization, db)
    if current_user.role not in {"pengurus", "king_admin"}:
        raise HTTPException(
            status_code=403,
            detail="Hanya pengurus atau king_admin yang dapat mengubah pengaturan Ramadhan",
        )

    if payload.ramadhan_mode:
        if not payload.ramadhan_start_date or not payload.ramadhan_end_date:
            raise HTTPException(
                status_code=400,
                detail="Tanggal mulai dan tanggal akhir wajib diisi saat Mode Ramadhan aktif",
            )
        if payload.ramadhan_end_date < payload.ramadhan_start_date:
            raise HTTPException(
                status_code=400,
                detail="Tanggal akhir Ramadhan tidak boleh sebelum tanggal mulai",
            )

    row = _get_or_create_ramadhan_settings(db)

    # Handle timestamp activation logic
    if payload.ramadhan_mode and not row.ramadhan_mode:
        # Activating now
        row.ramadhan_activated_at = datetime.now()
    elif not payload.ramadhan_mode and row.ramadhan_mode:
        # Deactivating now
        row.ramadhan_activated_at = None

    row.ramadhan_mode = payload.ramadhan_mode
    row.ramadhan_start_date = payload.ramadhan_start_date if payload.ramadhan_mode else None
    row.ramadhan_end_date = payload.ramadhan_end_date if payload.ramadhan_mode else None

    # Update metadata
    row.updated_by_user_id = current_user.id
    row.updated_by = f"{current_user.name} ({current_user.role})"

    db.commit()
    db.refresh(row)

    active_today = _is_ramadhan_active_today(row)
    has_tarawih = _has_tarawih_history(db)

    return {
        "message": "Pengaturan Ramadhan berhasil disimpan",
        "ramadhan_mode": row.ramadhan_mode,
        "ramadhan_start_date": (
            row.ramadhan_start_date.isoformat() if row.ramadhan_start_date else None
        ),
        "ramadhan_end_date": (
            row.ramadhan_end_date.isoformat() if row.ramadhan_end_date else None
        ),
        "ramadhan_activated_at": (
            row.ramadhan_activated_at.isoformat() if row.ramadhan_activated_at else None
        ),
        "updated_by": row.updated_by,
        "is_ramadhan_active_today": active_today,
        "has_tarawih_history": has_tarawih,
        "available_prayers": (
            ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya", "Tarawih"]
            if active_today or has_tarawih
            else ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"]
        ),
    }
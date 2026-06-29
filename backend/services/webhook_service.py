import json
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import time

import models
from utils import (
    validate_webhook_payload,
    parse_scan_time,
    determine_sholat_time,
    determine_attendance_status,
    log_processing_result,
)


# =========================
# EVENT LOOKUP
# =========================

def find_active_event_for_scan(db: Session, jamaah_id: str, scan_time: datetime) -> Optional[int]:
    """Temukan event aktif yang beririsan dengan scan_time untuk partisipan"""
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    hari_ini = days[scan_time.weekday()]
    tgl_ini = scan_time.date()
    scan_minutes = (scan_time.hour * 60) + scan_time.minute

    def _to_minutes(value) -> Optional[int]:
        if value is None:
            return None
        if isinstance(value, str):
            parts = value.split(":")
        else:
            parts = str(value).split(":")
        if len(parts) < 2:
            return None
        try:
            hours = int(parts[0])
            minutes = int(parts[1])
        except (TypeError, ValueError):
            return None
        if hours < 0 or hours > 23 or minutes < 0 or minutes > 59:
            return None
        return (hours * 60) + minutes

    participations = db.query(models.EventParticipant).filter(
        models.EventParticipant.jamaah_id == jamaah_id
    ).all()

    for p in participations:
        event = db.query(models.Event).filter(
            models.Event.id == p.event_id,
            models.Event.status == "active"
        ).first()
        if not event:
            continue

        # Pengecekan Tanggal
        valid_date = False
        if event.event_type == "one-time" and event.date == tgl_ini:
            valid_date = True
        elif event.event_type == "recurring" and event.days and hari_ini in [
            d.strip() for d in event.days.split(",")
        ]:
            valid_date = True
        elif (
            event.event_type == "rentang"
            and event.start_date
            and event.end_date
            and (event.start_date <= tgl_ini <= event.end_date)
        ):
            valid_date = True

        if not valid_date:
            continue

        # Pengecekan Waktu (bisa absen 60 menit sebelum mulai sampai waktu selesai event).
        start_minutes = _to_minutes(event.start_time)
        end_minutes = _to_minutes(event.end_time)
        if start_minutes is None or end_minutes is None:
            continue

        window_start_minutes = max(0, start_minutes - 60)
        if window_start_minutes <= scan_minutes <= end_minutes:
            return event.id

    return None


# =========================
# CORE PROCESSING
# =========================

async def process_attendance_webhook(
    payload: dict,
    source_ip: str,
    db: Session
) -> dict:
    """
    Core function untuk process webhook attendance.
    Dipanggil oleh kedua endpoint (legacy dan new).
    """
    start_time = time.time()

    # Validasi payload menggunakan utils
    is_valid, error_msg, data = validate_webhook_payload(payload)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    cloud_id = payload.get("cloud_id")
    pin = data["pin"].strip()  # PIN = Nama Jamaah
    scan_time = parse_scan_time(data["scan"])

    # LOG RAW PAYLOAD (untuk audit)
    webhook_log = models.WebhookLog(
        webhook_type=payload.get("type"),
        cloud_id=cloud_id,
        raw_payload=json.dumps(payload),
        created_at=datetime.now()
    )
    db.add(webhook_log)
    db.flush()  # Commit sementara untuk dapat ID log

    # CEK JAMAAH DI DATABASE + lock row untuk cegah race duplicate log
    jamaah = db.query(models.Jamaah).filter(
        models.Jamaah.id == pin
    ).with_for_update().first()

    is_new_jamaah = False

    # KONDISI: JAMAAH BARU (belum terdaftar)
    if not jamaah:
        try:
            # Gunakan nested transaction (SAVEPOINT) untuk handling race condition
            # Jika insert gagal, hanya rollback bagian ini, WebhookLog tetap aman
            with db.begin_nested():
                jamaah = models.Jamaah(
                    id=pin,
                    nama=pin,
                    foto_profil_url=data.get("photo_url"),
                    first_seen_at=scan_time,
                    last_seen_at=scan_time,
                    # Total scan attempt (valid/duplicate/rejected)
                    total_kehadiran=1,
                    created_at=datetime.now()
                )
                db.add(jamaah)
                db.flush()  # Trigger insert untuk cek constraint

                is_new_jamaah = True
                webhook_log.jamaah_created = True
                print(f"JAMAAH BARU: {pin} (auto-registered)")

        except IntegrityError:
            # Race condition: jamaah sudah dibuat oleh request lain
            # Nested transaction otomatis rollback ke savepoint
            print(f"Race condition handled: {pin} already exists")

            jamaah = db.query(models.Jamaah).filter(
                models.Jamaah.id == pin
            ).with_for_update().first()

            if not jamaah:
                raise HTTPException(
                    status_code=500,
                    detail="Gagal membuat jamaah baru (race condition unresolved)"
                )
        except Exception as e:
            print(f"Error creating jamaah: {str(e)}")
            raise

    # KONDISI: JAMAAH LAMA (sudah terdaftar)
    else:
        # Catat attempt scan untuk monitoring (valid/duplicate/rejected tetap dihitung)
        jamaah.last_seen_at = scan_time
        jamaah.total_kehadiran = (jamaah.total_kehadiran or 0) + 1

        # Update foto profil jika belum ada dan ada foto baru
        if not jamaah.foto_profil_url and data.get("photo_url"):
            jamaah.foto_profil_url = data.get("photo_url")

        print(f"JAMAAH LAMA: {pin}")

    # TENTUKAN WAKTU SHOLAT & STATUS KEHADIRAN
    waktu_sholat = determine_sholat_time(scan_time, db)
    status_kehadiran = determine_attendance_status(scan_time, waktu_sholat, db)

    # status_kehadiran is always a valid string (never None)
    # — every scan is recorded, edge cases fallback to DI_LUAR_WAKTU_SHOLAT

    # PROSES PARALEL: jalur general attendance + jalur custom event dipisah total.
    active_event_id = find_active_event_for_scan(db, jamaah.id, scan_time)

    general_inserted = False
    event_inserted = False
    general_duplicate_log_id = None
    event_duplicate_log_id = None

    # 1) Jalur GENERAL (sholat / luar waktu)
    # Duplicate check untuk SEMUA waktu:
    # - Sholat 5 waktu: duplicate per (jamaah_id, waktu_sholat, tanggal), event_id IS NULL
    # - Di luar waktu sholat: duplicate per (jamaah_id, tanggal, scan_time ±30 detik)
    general_should_insert = True
    if waktu_sholat != "Di Luar Waktu Sholat":
        existing_general = db.query(models.AttendanceLog.id).filter(
            models.AttendanceLog.jamaah_id == jamaah.id,
            models.AttendanceLog.event_id.is_(None),
            models.AttendanceLog.waktu_sholat == waktu_sholat,
            func.date(models.AttendanceLog.scan_time) == scan_time.date(),
        ).first()
        if existing_general:
            general_should_insert = False
            general_duplicate_log_id = existing_general[0]
    else:
        # Di luar waktu sholat: cek duplikat dalam window 30 detik
        from datetime import timedelta
        existing_outside = db.query(models.AttendanceLog.id).filter(
            models.AttendanceLog.jamaah_id == jamaah.id,
            models.AttendanceLog.event_id.is_(None),
            models.AttendanceLog.waktu_sholat == "Di Luar Waktu Sholat",
            models.AttendanceLog.scan_time >= scan_time - timedelta(seconds=30),
            models.AttendanceLog.scan_time <= scan_time + timedelta(seconds=30),
        ).first()
        if existing_outside:
            general_should_insert = False
            general_duplicate_log_id = existing_outside[0]

    if general_should_insert:
        general_log = models.AttendanceLog(
            jamaah_id=jamaah.id,
            scan_time=scan_time,
            verify_method=data.get("verify"),
            status_scan=data.get("status_scan"),
            work_code=data.get("work_code"),
            photo_url=data.get("photo_url"),
            device_cloud_id=cloud_id,
            waktu_sholat=waktu_sholat,
            status_kehadiran=status_kehadiran,
            event_id=None,
            raw_payload=payload,  # Simpan payload asli untuk debugging
            created_at=datetime.now()
        )
        db.add(general_log)
        general_inserted = True

    # 2) Jalur EVENT (independen dari general)
    # Duplicate event hanya berdasarkan (jamaah_id, event_id, tanggal)
    if active_event_id:
        existing_event = db.query(models.AttendanceLog.id).filter(
            models.AttendanceLog.jamaah_id == jamaah.id,
            models.AttendanceLog.event_id == active_event_id,
            func.date(models.AttendanceLog.scan_time) == scan_time.date()
        ).first()

        if existing_event:
            event_duplicate_log_id = existing_event[0]
        else:
            event_log = models.AttendanceLog(
                jamaah_id=jamaah.id,
                scan_time=scan_time,
                verify_method=data.get("verify"),
                status_scan=data.get("status_scan"),
                work_code=data.get("work_code"),
                photo_url=data.get("photo_url"),
                device_cloud_id=cloud_id,
                waktu_sholat=waktu_sholat,
                status_kehadiran=status_kehadiran,
                event_id=active_event_id,
                raw_payload=payload,  # Simpan payload asli untuk debugging
                created_at=datetime.now()
            )
            db.add(event_log)
            event_inserted = True

    inserted_any = general_inserted or event_inserted
    db.flush()

    # FINAL COMMIT
    webhook_log.processed = True
    db.commit()

    # LOG PROCESSING RESULT
    processing_time_ms = int((time.time() - start_time) * 1000)
    log_processing_result(
        jamaah_id=jamaah.id,
        is_new=is_new_jamaah,
        processing_time_ms=processing_time_ms,
        status="success" if inserted_any else "duplicate"
    )

    if inserted_any:
        print(
            f"ABSENSI TERCATAT: {pin} | {waktu_sholat} ({status_kehadiran}) "
            f"[general_inserted={general_inserted}, event_inserted={event_inserted}]"
        )
    else:
        print(
            f"DUPLIKAT DIABAIKAN: {pin} | {waktu_sholat} ({scan_time.date()}) "
            f"[general_duplicate_log_id={general_duplicate_log_id}, "
            f"event_duplicate_log_id={event_duplicate_log_id}]"
        )

    # RETURN RESPONSE
    return {
        "status": "success" if inserted_any else "duplicate",
        "message": "Attendance logged successfully" if inserted_any else "Duplicate attendance ignored",
        "jamaah_status": "new" if is_new_jamaah else "existing",
        "data": {
            "jamaah_id": jamaah.id,
            "jamaah_nama": jamaah.nama,
            "scan_time": scan_time.isoformat(),
            "waktu_sholat": waktu_sholat,
            "status_kehadiran": status_kehadiran,
            "photo_available": bool(data.get("photo_url")),
            "active_event_id": active_event_id,
            "general_inserted": general_inserted,
            "event_inserted": event_inserted,
            "general_duplicate_log_id": general_duplicate_log_id,
            "event_duplicate_log_id": event_duplicate_log_id,
            "processing_time_ms": processing_time_ms
        }
    }
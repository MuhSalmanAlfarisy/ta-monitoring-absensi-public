from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo
import json

from database import get_db
import models
from config import settings
from utils import (
    parse_scan_time,
    determine_sholat_time,
    determine_attendance_status,
    get_sholat_order,
)
from routers.system import require_king_admin
from schemas import (
    DeviceStatusResponse,
    SystemLogsResponse,
    OutsideWindowLogListResponse,
)

router = APIRouter(prefix="/api/settings", tags=["Settings"])


def _resolve_local_timezone():
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return ZoneInfo(tz_name)
    except Exception:
        if tz_name == "Asia/Jakarta":
            return timezone(timedelta(hours=7))
        return timezone.utc


LOCAL_TZ = _resolve_local_timezone()


def _to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _to_local(dt: Optional[datetime]) -> Optional[datetime]:
    dt_utc = _to_utc(dt)
    if dt_utc is None:
        return None
    return dt_utc.astimezone(LOCAL_TZ)


@router.get("/device-status", response_model=DeviceStatusResponse)
def get_device_status(db: Session = Depends(get_db)):
    """
    Get device status based on last heartbeat (webhook activity)
    """
    # Find last webhook log
    last_log = db.query(models.WebhookLog).order_by(models.WebhookLog.created_at.desc()).first()

    is_online = False
    last_seen = None
    device_id = None

    if last_log:
        last_seen = _to_local(last_log.created_at)
        device_id = last_log.cloud_id

        # Check if last seen is within 1 hour
        last_seen_utc = _to_utc(last_log.created_at)
        if last_seen_utc and (datetime.now(timezone.utc) - last_seen_utc) < timedelta(hours=1):
            is_online = True

    # Try to find device ID from AttendanceLog if not in WebhookLog
    if not device_id:
        last_att = db.query(models.AttendanceLog).order_by(models.AttendanceLog.created_at.desc()).first()
        if last_att:
            device_id = last_att.device_cloud_id

    return {
        "device_id": device_id or "UNKNOWN",
        "device_name": "Fingerspot Vida Series",  # Hardcoded for now as we don't have Device table
        "is_online": is_online,
        "last_heartbeat": last_seen,
        "firmware": "v2.1.5"  # Hardcoded
    }


@router.get("/logs", response_model=SystemLogsResponse)
def get_system_logs(db: Session = Depends(get_db)):
    """
    Get recent system logs + daily summary grouped by prayer windows.
    """
    # Get recent webhook logs. Data tidak masif, jadi summary per-hari dibuat dari event satuan.
    webhooks = (
        db.query(models.WebhookLog)
        .order_by(models.WebhookLog.created_at.desc())
        .limit(200)
        .all()
    )

    results = []
    daily_map = {}
    prayer_order = get_sholat_order(
        db=db,
        target_date=datetime.now(LOCAL_TZ).date(),
        include_syuruq=True,
    )

    for wh in webhooks:
        # Determine status
        status = "success" if wh.processed else "failed"
        if wh.error_message:
            status = "failed"

        # Try to count records from raw_payload if possible, or just mock it based on processing
        records_count = 0
        if wh.processed:
            # This is a simplification. Parsing raw_payload here might be heavy.
            # For now, we assume if processed, it had records.
            # Ideally we should save record_count in WebhookLog.
            records_count = 1  # Placeholder

        local_ts = _to_local(wh.created_at)

        results.append({
            "id": wh.id,
            "timestamp": local_ts,
            "status": status,
            "records": records_count,
            "type": wh.webhook_type
        })

        if local_ts is None:
            continue

        day_key = local_ts.date().isoformat()
        if day_key not in daily_map:
            daily_map[day_key] = {
                "date": day_key,
                "total": 0,
                "successful": 0,
                "failed": 0,
                "outside_prayer_count": 0,
                "latest_timestamp": local_ts,
                "prayer_counts": {name: 0 for name in prayer_order},
            }

        day_item = daily_map[day_key]
        day_item["total"] += 1
        if status == "success":
            day_item["successful"] += 1
        else:
            day_item["failed"] += 1

        if local_ts > day_item["latest_timestamp"]:
            day_item["latest_timestamp"] = local_ts

        # Klasifikasi event: waktu sholat vs di luar waktu sholat
        # Jika parsing gagal/invalid, tetap dihitung sebagai "di luar waktu sholat".
        classified = False
        try:
            payload = json.loads(wh.raw_payload) if wh.raw_payload else {}
            data = payload.get("data") or {}
            scan_raw = data.get("scan")
            if scan_raw:
                scan_time = parse_scan_time(scan_raw)
                waktu_sholat = determine_sholat_time(scan_time, db)
                status_kehadiran = determine_attendance_status(scan_time, waktu_sholat, db)
                if status_kehadiran is None:
                    day_item["outside_prayer_count"] += 1
                elif waktu_sholat in day_item["prayer_counts"]:
                    day_item["prayer_counts"][waktu_sholat] += 1
                else:
                    day_item["outside_prayer_count"] += 1
                classified = True
        except Exception:
            classified = False

        if not classified:
            day_item["outside_prayer_count"] += 1

    daily_summaries = sorted(
        daily_map.values(),
        key=lambda item: item["date"],
        reverse=True,
    )

    return {"logs": results, "daily_summaries": daily_summaries}


@router.get(
    "/outside-window-logs",
    response_model=OutsideWindowLogListResponse,
    dependencies=[Depends(require_king_admin)],
)
def get_outside_window_logs(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Get all attendance logs with status 'DI_LUAR_WAKTU_SHOLAT'.
    King Admin only — read-only, no status modification.
    """
    OUTSIDE_STATUS = "DI_LUAR_WAKTU_SHOLAT"

    base_query = (
        db.query(
            models.AttendanceLog,
            models.Jamaah.nama.label("nama_jamaah"),
        )
        .join(models.Jamaah, models.AttendanceLog.jamaah_id == models.Jamaah.id)
        .filter(models.AttendanceLog.status_kehadiran == OUTSIDE_STATUS)
    )

    total = base_query.count()

    rows = (
        base_query
        .order_by(models.AttendanceLog.scan_time.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    data = []
    for log, nama_jamaah in rows:
        data.append({
            "id": log.id,
            "nama_jamaah": nama_jamaah,
            "scan_time": log.scan_time,  # Already WIB (naive) from parse_scan_time
            "photo_url": log.photo_url,
        })

    return {
        "data": data,
        "pagination": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total,
        },
    }
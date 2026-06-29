from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

import models
import schemas


# =========================
# TIME HELPERS
# =========================

def _time_to_minutes(time_str: str) -> int:
    hours, minutes = map(int, time_str.split(":"))
    return (hours * 60) + minutes


def _safe_time_to_minutes(time_str: Optional[str]) -> Optional[int]:
    if not time_str:
        return None
    parts = str(time_str).split(":")
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


def _get_event_history_status(
    scan_time: datetime,
    event_start_time: Optional[str],
    late_threshold: Optional[int]
) -> str:
    start_minutes = _safe_time_to_minutes(event_start_time)
    if start_minutes is None:
        return "hadir"

    safe_late_threshold = (
        late_threshold
        if isinstance(late_threshold, int) and late_threshold >= 0
        else 15
    )
    scan_minutes = (scan_time.hour * 60) + scan_time.minute
    return "telat" if scan_minutes > (start_minutes + safe_late_threshold) else "hadir"


# =========================
# DATE / OVERLAP HELPERS
# =========================

def _check_time_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    return max(start1, start2) < min(end1, end2)


def _get_dates_for_rentang(start_date: date, end_date: date) -> List[date]:
    delta = end_date - start_date
    return [start_date + timedelta(days=i) for i in range(delta.days + 1)]


def _get_weekday_name(dt: date) -> str:
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    return days[dt.weekday()]


def _check_date_overlap(e1: models.Event, e2: models.Event) -> bool:
    # Build date sets for e1 and e2 if possible, or use logical checks

    # helper: convert recurring days string to set
    def get_days_set(days_str: str) -> set:
        if not days_str:
            return set()
        return set(d.strip() for d in days_str.split(","))

    type1, type2 = e1.event_type, e2.event_type

    if type1 == schemas.EventType.ONE_TIME and type2 == schemas.EventType.ONE_TIME:
        return e1.date == e2.date

    if type1 == schemas.EventType.RECURRING and type2 == schemas.EventType.RECURRING:
        days1 = get_days_set(e1.days)
        days2 = get_days_set(e2.days)
        return bool(days1.intersection(days2))

    if type1 == schemas.EventType.RENTANG and type2 == schemas.EventType.RENTANG:
        return max(e1.start_date, e2.start_date) <= min(e1.end_date, e2.end_date)

    # Mixed checks
    # Treat rentang as a concrete list of dates
    # Target concrete list if either is ONE_TIME or RENTANG
    dates1 = []
    if type1 == schemas.EventType.ONE_TIME and e1.date:
        dates1 = [e1.date]
    elif type1 == schemas.EventType.RENTANG and e1.start_date and e1.end_date:
        dates1 = _get_dates_for_rentang(e1.start_date, e1.end_date)

    dates2 = []
    if type2 == schemas.EventType.ONE_TIME and e2.date:
        dates2 = [e2.date]
    elif type2 == schemas.EventType.RENTANG and e2.start_date and e2.end_date:
        dates2 = _get_dates_for_rentang(e2.start_date, e2.end_date)

    # Both are concrete (one-time vs rentang)
    if dates1 and dates2:
        return bool(set(dates1).intersection(set(dates2)))

    # One is restricted, one is recurring
    concrete_dates = dates1 if dates1 else dates2
    recurring_days = (
        get_days_set(e2.days) if type2 == schemas.EventType.RECURRING
        else get_days_set(e1.days)
    )

    for dt in concrete_dates:
        if _get_weekday_name(dt) in recurring_days:
            return True

    return False


def _check_overlap(e1: models.Event, e2: models.Event) -> bool:
    if not _check_time_overlap(e1.start_time, e1.end_time, e2.start_time, e2.end_time):
        return False
    return _check_date_overlap(e1, e2)


# =========================
# PARTICIPANT VALIDATION
# =========================

def check_participant_overlap(
    db: Session,
    jamaah_id: str,
    new_event: models.Event,
    ignore_event_id: int = None
):
    # Fetch all active events the jamaah is part of
    participant_links = db.query(models.EventParticipant).filter(
        models.EventParticipant.jamaah_id == jamaah_id
    ).all()

    for link in participant_links:
        existing_event = db.query(models.Event).filter(
            models.Event.id == link.event_id,
            models.Event.status == "active"
        ).first()

        if not existing_event:
            continue

        if ignore_event_id and existing_event.id == ignore_event_id:
            continue

        if _check_overlap(existing_event, new_event):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Jadwal bentrok: Jamaah {jamaah_id} sudah terdaftar pada event aktif "
                    f"yang beririsan waktu ('{existing_event.title}')."
                )
            )
from datetime import datetime, timezone, timedelta, date
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from utils import verify_auth_token_with_reason, get_token_error_detail
from config import settings


# =========================
# TIMEZONE HELPERS
# =========================

def _resolve_local_timezone():
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return ZoneInfo(tz_name)
    except Exception:
        if tz_name == "Asia/Jakarta":
            return timezone(timedelta(hours=7))
        return timezone.utc


LOCAL_TZ = _resolve_local_timezone()


def _to_local_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(LOCAL_TZ).isoformat()


# =========================
# AUTH HELPERS
# =========================

def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    return token


def _get_current_user_from_authorization(
    authorization: Optional[str],
    db: Session,
) -> models.User:
    token = _extract_bearer_token(authorization)
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    _, uid = user_data
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# =========================
# RAMADHAN HELPERS
# =========================

class RamadhanSettingsPayload(BaseModel):
    ramadhan_mode: bool
    ramadhan_start_date: Optional[date] = None
    ramadhan_end_date: Optional[date] = None


def _ensure_ramadhan_settings_table(db: Session) -> None:
    models.RamadhanSettings.__table__.create(bind=db.get_bind(), checkfirst=True)


def _get_or_create_ramadhan_settings(db: Session) -> models.RamadhanSettings:
    _ensure_ramadhan_settings_table(db)
    row = db.query(models.RamadhanSettings).order_by(models.RamadhanSettings.id.asc()).first()
    if row:
        return row

    row = models.RamadhanSettings(
        ramadhan_mode=False,
        ramadhan_start_date=None,
        ramadhan_end_date=None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _is_ramadhan_active_today(row: models.RamadhanSettings) -> bool:
    today = datetime.now(LOCAL_TZ).date()
    return bool(
        row.ramadhan_mode
        and row.ramadhan_start_date
        and row.ramadhan_end_date
        and row.ramadhan_start_date <= today <= row.ramadhan_end_date
    )
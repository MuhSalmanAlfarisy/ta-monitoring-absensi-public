from datetime import datetime, timezone, timedelta
from typing import Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Request

import models
from config import settings
from utils import verify_auth_token_with_reason, get_token_error_detail, get_client_ip


# =========================
# TIMEZONE HELPERS
# =========================

def _resolve_local_timezone(tz_name: str):
    try:
        return ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        # Windows / minimal env sometimes misses IANA tz database.
        # Fallback for Indonesia Western Time (WIB).
        if tz_name == "Asia/Jakarta":
            return timezone(timedelta(hours=7))
        return timezone.utc


LOCAL_TZ = _resolve_local_timezone(settings.TIMEZONE or "Asia/Jakarta")


def _to_local_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(LOCAL_TZ)


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


# =========================
# WHITELIST HELPERS
# =========================

def _build_whitelist_payload(rows) -> tuple[list[dict], bool]:
    """
    Build whitelist payload with status + timestamps.
    Also backfills activated_at for historical active users when still null.
    """
    response = []
    needs_commit = False

    for wl, user in rows:
        is_active = user is not None
        if wl.created_at is None:
            wl.created_at = user.created_at or datetime.now(timezone.utc)
            needs_commit = True

        if is_active and wl.activated_at is None:
            wl.activated_at = user.created_at or datetime.now(timezone.utc)
            needs_commit = True

        created_at = _to_local_datetime(wl.created_at)
        activated_at = _to_local_datetime(wl.activated_at)

        response.append({
            "email": wl.email,
            "status": "active" if is_active else "waiting",
            "uid": user.id if user else None,
            "created_at": created_at,
            "activated_at": activated_at,
        })

    return response, needs_commit


# =========================
# SECURITY / ACTIVITY LOG HELPERS
# =========================

def _log_security_event(
    db: Session,
    request: Request,
    email: Optional[str],
    action: str,
    details: str,
) -> None:
    try:
        ip = get_client_ip(request)
        ua = request.headers.get("user-agent")
        new_log = models.ActivityLog(
            email=email,
            action=action,
            details=details,
            ip_address=ip,
            user_agent=ua,
        )
        db.add(new_log)
        db.commit()
    except Exception as log_error:
        db.rollback()
        print(f"[SECURITY_LOG] Failed to write activity log ({action}): {log_error}")


def _is_firebase_user_not_found_error(error: Exception) -> bool:
    error_text = str(error).lower()
    return (
        "no user record found" in error_text
        or "user not found" in error_text
        or "user-not-found" in error_text
    )


def _delete_account_with_firebase_sync(
    db: Session,
    request: Request,
    user: models.User,
    actor_email: str,
    origin: str,
) -> None:
    from firebase_admin import auth as firebase_auth

    firebase_uid = user.id  # users.id is Firebase UID by schema design
    target_email = user.email

    if not firebase_uid:
        raise HTTPException(status_code=500, detail="firebase_uid tidak valid pada akun ini.")

    # 1) Delete Firebase user first. If this fails, stop to avoid inconsistency.
    try:
        firebase_auth.delete_user(firebase_uid)
    except Exception as firebase_error:
        if not _is_firebase_user_not_found_error(firebase_error):
            _log_security_event(
                db,
                request,
                target_email or actor_email,
                "DELETE_ACCOUNT_FIREBASE_FAILED",
                (
                    f"{origin}: Firebase delete failed for uid={firebase_uid}. "
                    f"actor={actor_email}. error={firebase_error}"
                ),
            )
            print(f"[DELETE_ACCOUNT] {origin} Firebase delete failed uid={firebase_uid}: {firebase_error}")
            raise HTTPException(
                status_code=500,
                detail="Gagal menghapus akun di Firebase. Data lokal tidak dihapus untuk menjaga sinkronisasi.",
            )

    # 2) Delete local records only after Firebase delete succeeded.
    try:
        db.delete(user)

        if target_email:
            wl_entry = db.query(models.WhitelistUser).filter(
                models.WhitelistUser.email == target_email
            ).first()
            if wl_entry:
                db.delete(wl_entry)

        db.add(models.ActivityLog(
            email=target_email or actor_email,
            action="DELETE_ACCOUNT_SUCCESS",
            details=(
                f"{origin}: Account deleted (uid={firebase_uid}) "
                f"from Firebase and local DB by actor={actor_email}"
            ),
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        ))
        db.commit()
    except Exception as db_error:
        db.rollback()
        _log_security_event(
            db,
            request,
            target_email or actor_email,
            "DELETE_ACCOUNT_DB_FAILED",
            (
                f"{origin}: Local DB delete failed after Firebase deletion for uid={firebase_uid}. "
                f"actor={actor_email}. error={db_error}"
            ),
        )
        raise HTTPException(
            status_code=500,
            detail="Akun Firebase sudah terhapus, tetapi penghapusan data lokal gagal. Hubungi admin.",
        )


# =========================
# PYDANTIC MODELS
# =========================

class LoginRequest(BaseModel):
    token: str


class WhitelistRequest(BaseModel):
    email: str


class CheckRegistrationRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class TransferRoleRequest(BaseModel):
    target_email: str
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
import models
from config import settings
from utils import (
    get_system_resources,
    verify_auth_token_with_reason,
    get_token_error_detail,
)
from services.system_service import _extract_bearer_token

router = APIRouter(prefix="/api/system", tags=["System"])


# ======================================================
# SHARED DEPENDENCIES (dipakai lintas file via import)
# ======================================================

def get_current_user_role(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> str:
    token = _extract_bearer_token(authorization)
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=403, detail="User not registered")

    return user.role


def require_king_admin(role: str = Depends(get_current_user_role)):
    if role != "king_admin":
        raise HTTPException(status_code=403, detail="Access denied: King Admin only")


# ======================================================
# BASIC HEALTH CHECK (WAJIB UNTUK PRODUCTION)
# ======================================================

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Lightweight health check for monitoring / uptime check
    """
    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "environment": settings.ENV,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


# ======================================================
# SYSTEM STATUS (RINGAN)
# ======================================================

@router.get("/status")
def system_status(db: Session = Depends(get_db)):
    """
    Simple system status overview
    """
    # Database check
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    # Last activity
    last_log = (
        db.query(models.AttendanceLog)
        .order_by(models.AttendanceLog.created_at.desc())
        .first()
    )

    last_webhook = (
        db.query(models.WebhookLog)
        .order_by(models.WebhookLog.created_at.desc())
        .first()
    )

    last_activity = None
    if last_log:
        last_activity = last_log.created_at
    elif last_webhook:
        last_activity = last_webhook.created_at

    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV,
        "database": db_status,
        "last_activity": last_activity.isoformat() if last_activity else None,
        "resources": get_system_resources(),
        "timestamp": datetime.utcnow().isoformat(),
    }


# ======================================================
# SYSTEM INFO (SAFE VERSION)
# ======================================================

@router.get("/info")
def system_info():
    """
    Basic configuration info (tanpa bocor credential)
    """
    return {
        "application": {
            "name": settings.APP_NAME,
            "version": settings.VERSION,
            "environment": settings.ENV,
            "debug": settings.DEBUG,
        },
        "server": {
            "host": settings.HOST,
            "port": settings.PORT,
        },
        "database": {
            "configured": bool(settings.DATABASE_URL),
            "type": "mysql" if "mysql" in settings.DATABASE_URL else "other",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
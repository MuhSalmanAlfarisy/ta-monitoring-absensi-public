from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from routers.system import require_king_admin
from services.system_service import _to_local_datetime
from utils import get_client_ip

router = APIRouter(prefix="/api/system", tags=["System Logs"])


@router.post("/log-activity")
def log_activity(
    payload: schemas.ActivityLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Log user activity for security monitoring
    """
    # Extract IP and User Agent if not provided
    ip = payload.ip_address or get_client_ip(request)
    ua = payload.user_agent or request.headers.get("user-agent")

    new_log = models.ActivityLog(
        email=payload.email,
        action=payload.action,
        details=payload.details,
        ip_address=ip,
        user_agent=ua
    )
    db.add(new_log)
    db.commit()

    return {"status": "logged"}


@router.get("/admin/activity-logs", dependencies=[Depends(require_king_admin)])
def get_activity_logs(limit: int = 100, db: Session = Depends(get_db)):
    """
    Get activity logs (King Admin only)
    """
    logs = db.query(models.ActivityLog).order_by(
        models.ActivityLog.timestamp.desc()
    ).limit(limit).all()

    return [
        {
            "id": log.id,
            "email": log.email,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": _to_local_datetime(log.timestamp),
        }
        for log in logs
    ]
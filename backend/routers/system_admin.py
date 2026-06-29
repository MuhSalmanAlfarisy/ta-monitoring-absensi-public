from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from utils import verify_auth_token_with_reason, get_token_error_detail
from routers.system import require_king_admin
from services.system_service import (
    _extract_bearer_token,
    _to_local_datetime,
    _log_security_event,
    _build_whitelist_payload,
    _delete_account_with_firebase_sync,
    WhitelistRequest,
    TransferRoleRequest,
)

router = APIRouter(prefix="/api/system", tags=["System Admin"])


@router.post("/admin/whitelist", dependencies=[Depends(require_king_admin)])
def add_to_whitelist(payload: WhitelistRequest, db: Session = Depends(get_db)):
    """
    Add user to whitelist (King Admin only)
    """
    # Check duplicate
    existing = db.query(models.WhitelistUser).filter(
        models.WhitelistUser.email == payload.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah ada di whitelist")

    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    new_whitelist = models.WhitelistUser(
        email=payload.email,
        created_at=datetime.now(timezone.utc),
        activated_at=datetime.now(timezone.utc) if existing_user else None,
    )
    db.add(new_whitelist)
    db.commit()
    db.refresh(new_whitelist)

    created_at = _to_local_datetime(new_whitelist.created_at)
    activated_at = _to_local_datetime(new_whitelist.activated_at)

    return {
        "message": "User berhasil ditambahkan ke whitelist",
        "email": new_whitelist.email,
        "created_at": created_at,
        "activated_at": activated_at,
    }


@router.get("/admin/whitelist", dependencies=[Depends(require_king_admin)])
def get_whitelist(db: Session = Depends(get_db)):
    """
    Get all whitelist users with status (King Admin only)
    """
    # Left join whitelist with users
    results = db.query(
        models.WhitelistUser,
        models.User
    ).outerjoin(
        models.User, models.User.email == models.WhitelistUser.email
    ).order_by(
        models.WhitelistUser.created_at.desc()
    ).all()

    response, needs_commit = _build_whitelist_payload(results)
    if needs_commit:
        db.commit()

    return response


@router.get(
    "/admin/whitelist/history",
    dependencies=[Depends(require_king_admin)],
    response_model=list[schemas.WhitelistHistoryResponse],
)
def get_whitelist_history(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get whitelist history with timestamps.
    Optional filter: waiting | active | all
    """
    normalized_filter = status_filter.lower() if status_filter else None
    if normalized_filter not in (None, "waiting", "active", "all"):
        raise HTTPException(
            status_code=400,
            detail="status_filter harus: waiting | active | all"
        )

    results = db.query(
        models.WhitelistUser,
        models.User
    ).outerjoin(
        models.User, models.User.email == models.WhitelistUser.email
    ).order_by(
        models.WhitelistUser.created_at.desc()
    ).all()

    payload, needs_commit = _build_whitelist_payload(results)
    if needs_commit:
        db.commit()

    if normalized_filter and normalized_filter != "all":
        payload = [row for row in payload if row["status"] == normalized_filter]

    return payload


@router.delete("/admin/whitelist/{email}", dependencies=[Depends(require_king_admin)])
def remove_from_whitelist(
    email: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Remove user from whitelist (King Admin only)
    """
    wl_user = db.query(models.WhitelistUser).filter(
        models.WhitelistUser.email == email
    ).first()
    if not wl_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan di whitelist")

    # Also delete from users table if exists to revoke access immediately
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.role == "king_admin":
        raise HTTPException(
            status_code=403,
            detail="King Admin tidak dapat dihapus dari endpoint ini"
        )

    # If registered user exists, use the same synced delete flow as self-delete.
    if user:
        actor_token = _extract_bearer_token(authorization)
        actor_data, reason, _ = verify_auth_token_with_reason(actor_token)
        if not actor_data:
            raise HTTPException(status_code=401, detail=get_token_error_detail(reason))
        actor_email, _ = actor_data

        _delete_account_with_firebase_sync(
            db=db,
            request=request,
            user=user,
            actor_email=actor_email,
            origin="admin_delete",
        )
        return {"message": "User berhasil dihapus dari Firebase, database, dan whitelist"}

    # Fallback for waiting whitelist entries (belum punya user account)
    db.delete(wl_user)
    db.commit()
    _log_security_event(
        db,
        request,
        email,
        "DELETE_WHITELIST_ONLY_SUCCESS",
        "Whitelist entry removed without local user account",
    )

    return {"message": "User berhasil dihapus dari whitelist"}


@router.post("/admin/transfer-job", dependencies=[Depends(require_king_admin)])
def transfer_king_admin(
    payload: TransferRoleRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Transfer King Admin role to another user.
    Requester (Current King Admin) -> Pengurus
    Target User -> King Admin
    """
    # 1. Verify Current User (Requester)
    token = _extract_bearer_token(authorization)
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    current_email, current_uid = user_data
    current_user = db.query(models.User).filter(models.User.id == current_uid).first()

    if not current_user or current_user.role != "king_admin":
        raise HTTPException(status_code=403, detail="Hanya King Admin yang bisa melakukan ini")

    # 2. Verify Target User
    target_user = db.query(models.User).filter(models.User.email == payload.target_email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user tidak ditemukan")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Tidak bisa transfer ke diri sendiri")

    # 3. Perform Transfer (Transaction)
    try:
        # A. Downgrade Current King Admin -> Pengurus
        current_user.role = "pengurus"

        # Add Current User to Whitelist (so they can still login as pengurus)
        wl_entry = db.query(models.WhitelistUser).filter(
            models.WhitelistUser.email == current_email
        ).first()
        if not wl_entry:
            new_wl = models.WhitelistUser(
                email=current_email,
                created_at=datetime.now(timezone.utc),
                activated_at=datetime.now(timezone.utc),
            )
            db.add(new_wl)
        elif wl_entry.activated_at is None:
            wl_entry.activated_at = current_user.created_at or datetime.now(timezone.utc)

        # B. Upgrade Target -> King Admin
        target_user.role = "king_admin"

        # Remove Target from Whitelist (King Admin implies access, standard cleanup)
        target_wl = db.query(models.WhitelistUser).filter(
            models.WhitelistUser.email == payload.target_email
        ).first()
        if target_wl:
            db.delete(target_wl)

        db.commit()

        return {"message": f"Jabatan King Admin berhasil dialihkan ke {payload.target_email}"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan transfer: {str(e)}")
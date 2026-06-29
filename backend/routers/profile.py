from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os
import shutil
import uuid

from database import get_db
import models
from utils import verify_auth_token_with_reason, get_token_error_detail
from services.profile_service import _to_local_iso

router = APIRouter(prefix="/api/profile", tags=["Profile"])

# Ensure uploads directory exists
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload profile photo.
    Returns the URL of the uploaded file.
    """
    # Verify User
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate filename
    ext = file.filename.split(".")[-1]
    filename = f"{uid}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Construct URL
    # Use relative URL for better compatibility
    photo_url = f"/static/uploads/{filename}"

    # Update User in DB
    user = db.query(models.User).filter(models.User.id == uid).first()
    if user:
        user.photo_url = photo_url
        db.commit()

    return {"url": photo_url}


@router.post("/password-changed")
async def password_changed(
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Update last_password_change timestamp.
    """
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.last_password_change = datetime.now(timezone.utc)
    db.commit()

    return {"status": "success", "timestamp": _to_local_iso(user.last_password_change)}


@router.put("/me")
async def update_profile(
    name: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Update user profile (specifically name).
    """
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = name
    db.commit()

    return {"status": "success", "name": name}


@router.get("/me")
async def get_my_profile(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get current user profile from DB
    """
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data
    user = db.query(models.User).filter(models.User.id == uid).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    last_login_log = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.email == user.email,
            models.ActivityLog.action == "LOGIN_SUCCESS",
        )
        .order_by(models.ActivityLog.timestamp.desc())
        .first()
    )

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "photo_url": user.photo_url,
        "last_password_change": _to_local_iso(user.last_password_change),
        "created_at": _to_local_iso(user.created_at),
        "last_login_at": _to_local_iso(last_login_log.timestamp if last_login_log else None),
    }
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import requests as http_requests
from firebase_admin import auth as firebase_auth

from database import get_db
import models
from config import settings
from utils import (
    verify_firebase_token_with_reason,
    verify_auth_token_with_reason,
    create_access_token,
    get_token_error_detail,
)
from services.system_service import (
    _extract_bearer_token,
    _log_security_event,
    _is_firebase_user_not_found_error,
    _delete_account_with_firebase_sync,
    CheckRegistrationRequest,
    ForgotPasswordRequest,
    LoginRequest,
)

router = APIRouter(prefix="/api/system", tags=["System Auth"])

ALLOWED_RESET_ROLES = {"user", "pengurus", "king_admin"}


def _normalize_email(email: Optional[str]) -> str:
    return (email or "").strip().lower()


def _is_bootstrap_admin_email(email: str) -> bool:
    return _normalize_email(email) in set(settings.BOOTSTRAP_ADMIN_EMAILS)


def _handle_unauthorized_google_user(
    db: Session,
    request: Request,
    email: str,
    uid: str,
    reason: str,
) -> None:
    if not settings.AUTO_DELETE_UNAUTHORIZED_FIREBASE_USER:
        _log_security_event(
            db,
            request,
            email,
            "GOOGLE_UNAUTHORIZED_BLOCKED",
            f"{reason}. Blocked without Firebase deletion (uid={uid})",
        )
        return

    try:
        firebase_auth.delete_user(uid)
        _log_security_event(
            db,
            request,
            email,
            "GOOGLE_UNAUTHORIZED_CLEANUP_SUCCESS",
            f"{reason}. Unauthorized Firebase user deleted (uid={uid})",
        )
    except Exception as cleanup_error:
        if _is_firebase_user_not_found_error(cleanup_error):
            _log_security_event(
                db,
                request,
                email,
                "GOOGLE_UNAUTHORIZED_CLEANUP_NOOP",
                f"{reason}. Firebase user already absent during cleanup (uid={uid})",
            )
            return

        _log_security_event(
            db,
            request,
            email,
            "GOOGLE_UNAUTHORIZED_CLEANUP_FAILED",
            f"{reason}. Failed cleanup unauthorized Firebase user uid={uid}: {cleanup_error}",
        )
        print(f"[GOOGLE_LOGIN] Unauthorized cleanup failed for uid={uid}: {cleanup_error}")
        raise HTTPException(
            status_code=500,
            detail="Gagal membersihkan akun Firebase yang tidak memiliki akses.",
        )


def _recover_uid_mismatch_in_development(
    db: Session,
    request: Request,
    local_user: models.User,
    incoming_uid: str,
    email: str,
) -> Optional[models.User]:
    """
    Development-only recovery path for a desynced Firebase UID.

    We only auto-sync when the old local UID no longer exists in Firebase,
    which indicates the Firebase account was recreated and the local DB
    simply still points to the historical UID.
    """
    if not settings.is_development():
        return None

    try:
        firebase_auth.get_user(local_user.id)
        return None
    except Exception as lookup_error:
        if not _is_firebase_user_not_found_error(lookup_error):
            _log_security_event(
                db,
                request,
                email,
                "LOGIN_UID_RECOVERY_LOOKUP_FAILED",
                (
                    "Gagal memverifikasi UID lokal lama di Firebase saat recovery development. "
                    f"local_uid={local_user.id}, incoming_uid={incoming_uid}, error={lookup_error}"
                ),
            )
            print(
                "[LOGIN_UID_RECOVERY] Firebase lookup failed "
                f"local_uid={local_user.id}, incoming_uid={incoming_uid}: {lookup_error}"
            )
            raise HTTPException(
                status_code=500,
                detail="Gagal memverifikasi sinkronisasi akun Firebase.",
            )

    old_uid = local_user.id
    local_user.id = incoming_uid
    local_user.email = email or local_user.email
    db.commit()
    db.refresh(local_user)

    _log_security_event(
        db,
        request,
        email,
        "LOGIN_UID_RECOVERED_DEV",
        (
            "Development UID recovery succeeded after Firebase account recreation. "
            f"old_uid={old_uid}, new_uid={incoming_uid}, role={local_user.role}"
        ),
    )
    return local_user


@router.post("/auth/check-registration")
def check_registration(payload: CheckRegistrationRequest, db: Session = Depends(get_db)):
    """
    Check if email is allowed to register.
    Status:
    - genesis: System is empty, user should login with Google to be King Admin
    - whitelisted: Email is in whitelist, allowed to register
    - unauthorized: Email not in whitelist
    - registered: Email already registered in users table
    """
    # 1. Check Genesis
    total_users = db.query(models.User).count()
    if total_users == 0:
        if not _is_bootstrap_admin_email(payload.email):
            return {
                "status": "unauthorized",
                "message": "Email ini tidak diizinkan menjadi admin pertama.",
            }
        return {"status": "genesis", "message": "Genesis mode active"}

    # 2. Check if already registered
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        return {"status": "registered", "message": "Email sudah terdaftar"}

    # 3. Check Whitelist
    whitelist_entry = db.query(models.WhitelistUser).filter(
        models.WhitelistUser.email == payload.email
    ).first()
    if whitelist_entry:
        return {"status": "whitelisted", "message": "Email terdaftar sebagai pengurus"}

    # 4. Unauthorized
    return {"status": "unauthorized", "message": "Email belum terdaftar sebagai pengurus masjid"}


@router.post("/auth/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    not_registered_message = "Anda belum terdaftar pada sistem ini."

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or user.role not in ALLOWED_RESET_ROLES:
        _log_security_event(
            db,
            request,
            email,
            "RESET_PASSWORD_EMAIL_NOT_FOUND",
            "Reset password ditolak: email tidak terdaftar atau role tidak diizinkan",
        )
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": not_registered_message},
        )

    try:
        firebase_auth.get_user_by_email(email)
    except Exception as firebase_lookup_error:
        error_text = str(firebase_lookup_error).lower()
        is_not_found = (
            "no user record found" in error_text
            or "user not found" in error_text
            or "user-not-found" in error_text
        )
        if is_not_found:
            _log_security_event(
                db,
                request,
                email,
                "RESET_PASSWORD_EMAIL_NOT_FOUND",
                f"Reset password ditolak: user Firebase tidak ditemukan ({firebase_lookup_error})",
            )
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": not_registered_message},
            )

        _log_security_event(
            db,
            request,
            email,
            "RESET_PASSWORD_REQUEST_FAILED",
            f"Gagal verifikasi user Firebase: {firebase_lookup_error}",
        )
        print(f"[RESET_PASSWORD] Firebase lookup failed for {email}: {firebase_lookup_error}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Gagal mengirim link reset password. Silakan coba lagi.",
            },
        )

    api_key = settings.FIREBASE_WEB_API_KEY
    if not api_key:
        details = "FIREBASE_WEB_API_KEY belum dikonfigurasi"
        _log_security_event(
            db,
            request,
            email,
            "RESET_PASSWORD_REQUEST_FAILED",
            details,
        )
        print(f"[RESET_PASSWORD] {details}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Gagal mengirim link reset password. Silakan coba lagi.",
            },
        )

    try:
        response = http_requests.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={api_key}",
            json={
                "requestType": "PASSWORD_RESET",
                "email": email,
            },
            timeout=15,
        )

        if response.status_code != 200:
            error_detail = response.text
            try:
                data = response.json()
                error_detail = data.get("error", {}).get("message", response.text)
            except Exception:
                pass

            _log_security_event(
                db,
                request,
                email,
                "RESET_PASSWORD_REQUEST_FAILED",
                f"Firebase reset request failed: {error_detail}",
            )
            print(f"[RESET_PASSWORD] Failed for {email}: {error_detail}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Gagal mengirim link reset password. Silakan coba lagi.",
                },
            )

        _log_security_event(
            db,
            request,
            email,
            "RESET_PASSWORD_REQUEST_SUCCESS",
            "Link reset password berhasil dikirim",
        )
        return {
            "success": True,
            "message": "Link reset password telah dikirim ke email Anda.",
        }
    except Exception as send_error:
        _log_security_event(
            db,
            request,
            email,
            "RESET_PASSWORD_REQUEST_FAILED",
            f"Exception saat kirim reset password: {send_error}",
        )
        print(f"[RESET_PASSWORD] Exception for {email}: {send_error}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Gagal mengirim link reset password. Silakan coba lagi.",
            },
        )


@router.post("/auth/login-google")
def login_google(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Login endpoint:
    1. Verify Firebase Token
    2. Check if first user -> king_admin
    3. Check whitelist
    4. Auto-register if whitelisted
    """
    user_data, reason = verify_firebase_token_with_reason(payload.token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data
    email = _normalize_email(email)

    # Check existing user
    existing_user = db.query(models.User).filter(models.User.id == uid).first()
    if existing_user:
        _log_security_event(
            db,
            request,
            existing_user.email or email,
            "LOGIN_SUCCESS",
            "Backend login-google success",
        )
        access_token = create_access_token(
            uid=existing_user.id,
            email=existing_user.email,
            role=existing_user.role,
        )
        return {
            "uid": existing_user.id,
            "email": existing_user.email,
            "role": existing_user.role,
            "name": existing_user.name,
            "photo_url": existing_user.photo_url,
            "status": "login_success",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    existing_user_by_email = db.query(models.User).filter(models.User.email == email).first()
    if existing_user_by_email and existing_user_by_email.id != uid:
        recovered_user = _recover_uid_mismatch_in_development(
            db=db,
            request=request,
            local_user=existing_user_by_email,
            incoming_uid=uid,
            email=email,
        )
        if recovered_user:
            _log_security_event(
                db,
                request,
                recovered_user.email or email,
                "LOGIN_SUCCESS",
                "Backend login success after development UID recovery",
            )
            access_token = create_access_token(
                uid=recovered_user.id,
                email=recovered_user.email,
                role=recovered_user.role,
            )
            return {
                "uid": recovered_user.id,
                "email": recovered_user.email,
                "role": recovered_user.role,
                "name": recovered_user.name,
                "photo_url": recovered_user.photo_url,
                "status": "login_success",
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            }

        _log_security_event(
            db,
            request,
            email,
            "LOGIN_UID_MISMATCH_BLOCKED",
            (
                "Google login blocked because Firebase UID does not match local user record. "
                f"local_uid={existing_user_by_email.id}, incoming_uid={uid}, role={existing_user_by_email.role}"
            ),
        )
        raise HTTPException(
            status_code=409,
            detail=(
                "Akun terdeteksi tidak sinkron antara Firebase Auth dan database lokal. "
                "Tidak ada akun yang dihapus. Hubungi admin untuk pemulihan UID atau sinkronisasi akun."
            ),
        )

    # Check if this is the very first user (King Admin)
    total_users = db.query(models.User).count()
    if total_users == 0:
        if not _is_bootstrap_admin_email(email):
            _handle_unauthorized_google_user(
                db=db,
                request=request,
                email=email,
                uid=uid,
                reason="First admin bootstrap blocked because email is not allowed",
            )
            raise HTTPException(
                status_code=403,
                detail="Email ini tidak diizinkan menjadi admin pertama. Hubungi admin.",
            )

        new_user = models.User(id=uid, email=email, role="king_admin")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        _log_security_event(
            db,
            request,
            new_user.email,
            "LOGIN_SUCCESS",
            "Backend login-google success (first user auto king_admin)",
        )
        access_token = create_access_token(
            uid=new_user.id,
            email=new_user.email,
            role=new_user.role,
        )
        return {
            "uid": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "status": "registered_as_king_admin",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    # Check whitelist
    whitelist_entry = db.query(models.WhitelistUser).filter(
        models.WhitelistUser.email == email
    ).first()
    if not whitelist_entry:
        _handle_unauthorized_google_user(
            db=db,
            request=request,
            email=email,
            uid=uid,
            reason="Google login blocked because email is not whitelisted",
        )
        raise HTTPException(
            status_code=403,
            detail="Email tidak terdaftar di whitelist. Hubungi admin."
        )

    # STOP AUTO REGISTRATION
    # Instead of registering, tell frontend to redirect to Registration Form
    # This prevents overwriting Name/Photo with Google data
    return {
        "status": "needs_registration",
        "email": email,
        "message": "Silakan selesaikan registrasi manual untuk mengatur Nama & Foto."
    }


@router.post("/auth/cleanup-phantom")
def cleanup_phantom_user(
    payload: CheckRegistrationRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Remove 'phantom' user from Firebase only for waiting whitelist entries
    that have not activated a local account yet.
    This fixes 'Email already in use' error during manual registration.
    """
    from utils import delete_firebase_user_by_email

    # 1. Verify Whitelist & Not Registered
    whitelist_entry = db.query(models.WhitelistUser).filter(
        models.WhitelistUser.email == payload.email
    ).first()
    existing_user = db.query(models.User).filter(
        models.User.email == payload.email
    ).first()

    if whitelist_entry and whitelist_entry.activated_at is None and not existing_user:
        _log_security_event(
            db,
            request,
            payload.email,
            "CLEANUP_PHANTOM_ATTEMPT",
            "Attempting phantom Firebase cleanup for waiting whitelist registration",
        )

        # 2. Delete from Firebase
        success = delete_firebase_user_by_email(payload.email)
        if success:
            _log_security_event(
                db,
                request,
                payload.email,
                "CLEANUP_PHANTOM_SUCCESS",
                "Phantom Firebase user deleted before manual registration retry",
            )
            return {"status": "cleaned", "message": "Phantom user cleaned"}
        else:
            # If failed (maybe user doesn't exist in Firebase), consider it cleaned enough to proceed
            _log_security_event(
                db,
                request,
                payload.email,
                "CLEANUP_PHANTOM_NOOP",
                "Phantom cleanup skipped because Firebase user was not found or delete failed",
            )
            return {"status": "cleaned", "message": "User not found in Firebase or error"}

    if whitelist_entry and whitelist_entry.activated_at is not None and not existing_user:
        _log_security_event(
            db,
            request,
            payload.email,
            "CLEANUP_PHANTOM_BLOCKED",
            "Cleanup blocked because whitelist entry is already activated",
        )
        return {"status": "ignored", "message": "Cleanup blocked for activated whitelist entry"}

    return {"status": "ignored", "message": "No cleanup needed"}


@router.post("/auth/register")
def register_manual(
    token: str = Form(...),
    name: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Manual registration endpoint.
    Creates User record in Postgres with role='pengurus' and provided name.
    """
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data

    # 1. Check if already exists
    if db.query(models.User).filter(models.User.id == uid).first():
        return {"status": "already_registered", "message": "User already registered"}

    # 2. Check Whitelist
    whitelist_entry = db.query(models.WhitelistUser).filter(
        models.WhitelistUser.email == email
    ).first()
    if not whitelist_entry:
        raise HTTPException(status_code=403, detail="Email not whitelisted")

    # 3. Create User
    new_user = models.User(id=uid, email=email, role="pengurus", name=name)
    db.add(new_user)

    # Mark first activation time (set once)
    if whitelist_entry and whitelist_entry.activated_at is None:
        whitelist_entry.activated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "uid": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    }


@router.delete("/profile/me")
def delete_my_account(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Delete own account (Pengurus only).
    King Admin cannot delete account directly (Must transfer first).
    """
    token = _extract_bearer_token(authorization)
    user_data, reason, _ = verify_auth_token_with_reason(token)
    if not user_data:
        raise HTTPException(status_code=401, detail=get_token_error_detail(reason))

    email, uid = user_data

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "king_admin":
        raise HTTPException(
            status_code=403,
            detail="King Admin tidak dapat menghapus akun. Harap alihkan jabatan King Admin ke pengurus lain terlebih dahulu."
        )

    _delete_account_with_firebase_sync(
        db=db,
        request=request,
        user=user,
        actor_email=email,
        origin="self_delete",
    )
    return {"message": "Akun berhasil dihapus permanen"}

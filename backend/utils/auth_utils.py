"""
Authentication utility functions
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

from config import settings
import firebase_admin
from firebase_admin import auth


# ======================================================
# INTERNAL HELPERS
# ======================================================

def _is_expired_error(error_msg: str) -> bool:
    msg = (error_msg or "").lower()
    return "expired" in msg or "token has expired" in msg or "expired token" in msg


def _log_expired_token(source: str, error_msg: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    print(f"[AUTH] {now} | Expired {source} token rejected: {error_msg}")


# ======================================================
# TOKEN CREATION
# ======================================================

def create_access_token(uid: str, email: str, role: str) -> str:
    """
    Buat session JWT internal backend.
    Claims wajib: exp, iat, role.
    """
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY is required to issue access token")
    now = datetime.now(timezone.utc)
    expire_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "uid": uid,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


# ======================================================
# TOKEN VERIFICATION
# ======================================================

def _verify_backend_access_token(token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Verifikasi session JWT internal backend.
    Returns: (claims, reason)
    reason in {"expired", "invalid"}.
    """
    if not token:
        return None, "invalid"
    if not settings.SECRET_KEY:
        return None, "invalid"
    try:
        claims = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "iat"]},
        )
        role = claims.get("role")
        uid = claims.get("uid")
        email = claims.get("email")
        token_type = claims.get("type")
        if token_type != "access" or not role or not uid or not email:
            return None, "invalid"
        return claims, None
    except ExpiredSignatureError as e:
        _log_expired_token("backend", str(e))
        return None, "expired"
    except InvalidTokenError:
        return None, "invalid"
    except Exception as e:
        print(f"Error verifying backend access token: {e}")
        return None, "invalid"


def _verify_firebase_token_claims(token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Verifikasi ID Token Firebase.
    Returns: (claims, reason)
    reason in {"expired", "invalid"}.

    clock_skew_seconds=60 memberikan toleransi ±60 detik untuk
    perbedaan jam antara server dan Google, mencegah error
    "Token used too early" tanpa memblokir thread.
    """
    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
        email = decoded_token.get("email")
        uid = decoded_token.get("uid")
        if not email or not uid:
            return None, "invalid"
        return {
            "uid": uid,
            "email": email,
            "role": decoded_token.get("role"),
            "iat": decoded_token.get("iat"),
            "exp": decoded_token.get("exp"),
            "type": "firebase",
        }, None
    except Exception as e:
        error_msg = str(e)
        if _is_expired_error(error_msg):
            _log_expired_token("firebase", error_msg)
            return None, "expired"
        print(f"Error verifying Firebase token: {e}")
        return None, "invalid"


def verify_auth_token(token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Verifikasi token backend terlebih dahulu, fallback ke Firebase token.
    Returns: (claims, reason).
    """
    claims, reason = _verify_backend_access_token(token)
    if claims:
        return claims, None
    if reason == "expired":
        return None, "expired"
    firebase_claims, firebase_reason = _verify_firebase_token_claims(token)
    if firebase_claims:
        return firebase_claims, None
    return None, firebase_reason or reason or "invalid"


def verify_firebase_token(token: str) -> Optional[Tuple[str, str]]:
    """
    Backward-compatible helper.
    """
    claims, _ = _verify_firebase_token_claims(token)
    if not claims:
        return None
    return claims["email"], claims["uid"]


def verify_firebase_token_with_reason(token: str) -> Tuple[Optional[Tuple[str, str]], Optional[str]]:
    claims, reason = _verify_firebase_token_claims(token)
    if not claims:
        return None, reason
    return (claims["email"], claims["uid"]), None


def verify_auth_token_with_reason(token: str) -> Tuple[Optional[Tuple[str, str]], Optional[str], Optional[str]]:
    claims, reason = verify_auth_token(token)
    if not claims:
        return None, reason, None
    return (claims["email"], claims["uid"]), None, claims.get("role")


def get_token_error_detail(reason: Optional[str]) -> str:
    if reason == "expired":
        return "Token expired"
    return "Invalid token"


# ======================================================
# FIREBASE USER MANAGEMENT
# ======================================================

def delete_firebase_user_by_email(email: str) -> bool:
    """
    Menghapus user dari Firebase Authentication berdasarkan email.
    Digunakan untuk membersihkan 'phantom' users.
    """
    try:
        user = auth.get_user_by_email(email)
        auth.delete_user(user.uid)
        print(f"🗑️ Deleted Firebase user: {email} ({user.uid})")
        return True
    except Exception as e:
        print(f"⚠️ Failed to delete Firebase user {email}: {e}")
        return False
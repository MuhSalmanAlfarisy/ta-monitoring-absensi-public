import os
from datetime import date
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional


# ======================================================
# ENVIRONMENT DETECTION
# ======================================================

BASE_DIR = Path(__file__).resolve().parent
ENV = os.getenv("ENV", "development").lower()


def _resolve_relative_path(raw_path: Optional[str]) -> Optional[str]:
    if not raw_path:
        return raw_path

    path = Path(raw_path)
    if path.is_absolute():
        return str(path)

    return str((BASE_DIR / path).resolve())


def _resolve_database_url(raw_url: Optional[str]) -> Optional[str]:
    if not raw_url or not raw_url.startswith("sqlite:///"):
        return raw_url

    db_path = raw_url[len("sqlite:///"):]
    if not db_path:
        return raw_url

    is_windows_absolute = len(db_path) > 1 and db_path[1] == ":"
    if db_path.startswith("/") or is_windows_absolute:
        return raw_url

    resolved = (BASE_DIR / db_path).resolve().as_posix()
    return f"sqlite:///{resolved}"


def _parse_csv(raw_value: Optional[str]) -> list[str]:
    if not raw_value:
        return []

    return [
        item.strip().lower()
        for item in raw_value.split(",")
        if item.strip()
    ]


def _parse_bool(raw_value: Optional[str], default: bool = False) -> bool:
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {"1", "true", "yes", "y", "on"}

dotenv_path = (
    BASE_DIR / ".env.production" if ENV == "production"
    else BASE_DIR / ".env.development"
)

if dotenv_path.exists():
    load_dotenv(dotenv_path)
    print(f"⚙️  CONFIG LOADED: {dotenv_path} (Mode: {ENV})")
else:
    load_dotenv()
    print("⚠️  Using system environment variables")


# ======================================================
# SETTINGS CLASS
# ======================================================

class Settings:

    # ======================
    # APP CONFIG
    # ======================
    ENV: str = os.getenv("ENV", "development").lower()
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    APP_NAME: str = os.getenv("APP_NAME", "Monitoring Absensi API")
    VERSION: str = os.getenv("VERSION", "1.0.0")

    # ======================
    # SERVER
    # ======================
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    SSL_VERIFY: bool = os.getenv("SSL_VERIFY", "true").lower() == "true"

    # ======================
    # DATABASE (WAJIB DISET)
    # ======================
    DATABASE_URL: Optional[str] = _resolve_database_url(os.getenv("DATABASE_URL"))

    # ======================
    # CORS
    # ======================
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []

    # ======================
    # MYQURAN API
    # ======================
    MYQURAN_API_URL: str = os.getenv(
        "MYQURAN_API_URL",
        "https://api.myquran.com/v3/sholat/jadwal"
    )
    MYQURAN_CITY_ID: Optional[str] = os.getenv("MYQURAN_CITY_ID")

    PRAYER_TIMES_CACHE_DURATION: int = int(
        os.getenv("PRAYER_CACHE_DURATION", "3600")
    )
    DEFAULT_PRAYER_LOCATION: str = os.getenv("DEFAULT_PRAYER_LOCATION", "")
    DEFAULT_PRAYER_TIMES: dict = {
        "subuh": os.getenv("DEFAULT_SUBUH", ""),
        "syuruq": os.getenv("DEFAULT_SYURUQ", ""),
        "dzuhur": os.getenv("DEFAULT_DZUHUR", ""),
        "ashar": os.getenv("DEFAULT_ASHAR", ""),
        "maghrib": os.getenv("DEFAULT_MAGHRIB", ""),
        "isya": os.getenv("DEFAULT_ISYA", ""),
    }

    # ======================
    # FINGERSPOT API
    # ======================
    FINGERSPOT_CLOUD_ID: Optional[str] = os.getenv("FINGERSPOT_CLOUD_ID")
    FINGERSPOT_API_KEY: Optional[str] = os.getenv("FINGERSPOT_API_KEY")
    FINGERSPOT_API_URL: str = os.getenv(
        "FINGERSPOT_API_URL",
        "https://api.fingerspot.io/api/v1"
    )

    # ======================
    # FIREBASE ADMIN SDK
    # ======================
    FIREBASE_CREDENTIALS_PATH: Optional[str] = _resolve_relative_path(
        os.getenv("FIREBASE_CREDENTIALS_PATH")
    )
    FIREBASE_PROJECT_ID: Optional[str] = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_WEB_API_KEY: Optional[str] = (
        os.getenv("FIREBASE_WEB_API_KEY")
        or os.getenv("VITE_FIREBASE_API_KEY")
    )

    # ======================
    # TIMEZONE
    # ======================
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Jakarta")

    # ======================
    # LOGGING
    # ======================
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")

    # ======================
    # SECURITY (WAJIB DISET)
    # ======================
    SECRET_KEY: Optional[str] = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "180")
    )
    BOOTSTRAP_ADMIN_EMAILS: list[str] = _parse_csv(
        os.getenv("BOOTSTRAP_ADMIN_EMAILS")
    )
    AUTO_DELETE_UNAUTHORIZED_FIREBASE_USER: bool = _parse_bool(
        os.getenv("AUTO_DELETE_UNAUTHORIZED_FIREBASE_USER"),
        default=ENV == "production",
    )

    # ==================================================
    # VALIDATION
    # ==================================================
    @classmethod
    def validate(cls) -> None:
        """
        Validate critical configuration.
        Production harus strict.
        """

        errors = []

        # DATABASE wajib
        if not cls.DATABASE_URL:
            errors.append("DATABASE_URL is required")

        # SECRET KEY wajib
        if not cls.SECRET_KEY:
            errors.append("SECRET_KEY is required")
        elif len(cls.SECRET_KEY) < 32:
            errors.append(
                f"SECRET_KEY terlalu pendek ({len(cls.SECRET_KEY)} karakter). "
                "Minimum 32 karakter untuk HMAC SHA256. "
                'Generate dengan: python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )

        # API config wajib production
        if cls.ENV == "production":
            if not cls.MYQURAN_CITY_ID:
                errors.append("MYQURAN_CITY_ID is required in production")

            if not cls.FINGERSPOT_CLOUD_ID:
                errors.append("FINGERSPOT_CLOUD_ID is required in production")

            if not cls.FINGERSPOT_API_KEY:
                errors.append("FINGERSPOT_API_KEY is required in production")

        if errors:
            raise ValueError(
                "Configuration errors:\n" +
                "\n".join(f"  • {err}" for err in errors)
            )

    # ==================================================
    # HELPER METHODS
    # ==================================================
    @classmethod
    def get_myquran_url(cls) -> str:
        return f"{cls.MYQURAN_API_URL}/{cls.MYQURAN_CITY_ID}/today"

    @classmethod
    def get_myquran_url_for_date(cls, d: date) -> str:
        """URL jadwal sholat untuk tanggal tertentu (untuk validasi window sesuai tanggal scan)."""
        return f"{cls.MYQURAN_API_URL}/{cls.MYQURAN_CITY_ID}/{d.strftime('%Y-%m-%d')}"

    @classmethod
    def is_development(cls) -> bool:
        return cls.ENV == "development"

    @classmethod
    def is_production(cls) -> bool:
        return cls.ENV == "production"

    @classmethod
    def print_summary(cls) -> None:
        print("\n" + "=" * 50)
        print(f"🚀 {cls.APP_NAME} v{cls.VERSION}")
        print("=" * 50)
        print(f"Environment : {cls.ENV.upper()}")
        print(f"Debug Mode  : {cls.DEBUG}")
        print(f"Server      : {cls.HOST}:{cls.PORT}")
        print(f"Timezone    : {cls.TIMEZONE}")
        print(f"CORS Origins: {len(cls.CORS_ORIGINS)} configured")
        print(f"Database    : {'Configured' if cls.DATABASE_URL else 'Missing'}")
        print(f"MyQuran     : {'Configured' if cls.MYQURAN_CITY_ID else 'Missing'}")
        print(f"Fingerspot  : {'Configured' if cls.FINGERSPOT_API_KEY else 'Missing'}")
        print(f"Firebase Project: {cls.FIREBASE_PROJECT_ID or 'Not configured'}")
        print(f"Bootstrap Admins: {len(cls.BOOTSTRAP_ADMIN_EMAILS)} configured")
        print(
            "Unauthorized Firebase Cleanup: "
            f"{'Enabled' if cls.AUTO_DELETE_UNAUTHORIZED_FIREBASE_USER else 'Disabled'}"
        )
        print("=" * 50 + "\n")


# ======================================================
# INITIALIZATION
# ======================================================

settings = Settings()

try:
    settings.validate()
    settings.print_summary()
except ValueError as e:
    print(f"❌ {e}")
    if settings.is_production():
        raise

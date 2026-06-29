from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from datetime import datetime
import json
from pathlib import Path

from database import engine, create_tables  # noqa: F811 (removed duplicate import)
from config import settings

# ======================
# DATABASE & MODELS
# ======================
import models  # noqa: F401 (needed for SQLAlchemy metadata)

# ======================
# FIREBASE INIT
# ======================
import firebase_admin
from firebase_admin import credentials

firebase_path = settings.FIREBASE_CREDENTIALS_PATH
BASE_DIR = Path(__file__).resolve().parent


def _read_firebase_service_account_project_id(path: str | None) -> str | None:
    if not path:
        return None

    try:
        with open(path, "r", encoding="utf-8") as credential_file:
            data = json.load(credential_file)
        return data.get("project_id")
    except Exception as error:
        print(f"[FIREBASE] Failed to read service account project_id: {error}")
        return None


firebase_credential_project_id = _read_firebase_service_account_project_id(firebase_path)

if (
    settings.FIREBASE_PROJECT_ID
    and firebase_credential_project_id
    and settings.FIREBASE_PROJECT_ID != firebase_credential_project_id
):
    raise RuntimeError(
        "Firebase project mismatch: "
        f"FIREBASE_PROJECT_ID={settings.FIREBASE_PROJECT_ID}, "
        f"credential_project_id={firebase_credential_project_id}"
    )

if firebase_path and not firebase_admin._apps:
    cred = credentials.Certificate(firebase_path)
    firebase_admin.initialize_app(cred)
    active_project_id = firebase_credential_project_id or settings.FIREBASE_PROJECT_ID
    print(f"[FIREBASE] Admin SDK initialized for project: {active_project_id or 'unknown'}")

# ======================
# FASTAPI APP
# ======================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Sistem Monitoring Absensi Masjid dengan Auto-Register Jamaah",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    debug=settings.DEBUG,
)

# ======================
# CORS MIDDLEWARE
# ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ======================
# STATIC FILES
# ======================
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# ======================
# REGISTER ROUTERS
# ======================
from routers import (
    # Webhook
    webhook,

    # Analytics & Dashboard
    analytics,
    dashboard,

    # Attendance
    attendance,
    attendance_stats,
    attendance_misc,

    # Events
    events,

    # Jamaah
    jamaah,
    jamaah_stats,

    # Profile & Ramadhan
    profile,
    ramadhan,

    # Statistics
    statistics,
    statistics_leaderboard,
    statistics_advanced,
    statistics_quick,

    # System
    system,
    system_auth,
    system_admin,
    system_logs,

    # Settings
    settings as settings_router,
)

# --- Webhook ---
app.include_router(webhook.router)

# --- Analytics & Dashboard ---
app.include_router(analytics.router)
app.include_router(dashboard.router)

# --- Attendance ---
app.include_router(attendance.router)
app.include_router(attendance_stats.router)
app.include_router(attendance_misc.router)

# --- Events ---
app.include_router(events.router)

# --- Jamaah ---
app.include_router(jamaah.router)
app.include_router(jamaah_stats.router)

# --- Profile & Ramadhan ---
app.include_router(profile.router)
app.include_router(ramadhan.router)

# --- Statistics ---
app.include_router(statistics.router)
app.include_router(statistics_leaderboard.router)
app.include_router(statistics_advanced.router)
app.include_router(statistics_quick.router)

# --- System ---
app.include_router(system.router)
app.include_router(system_auth.router)
app.include_router(system_admin.router)
app.include_router(system_logs.router)

# --- Settings ---
app.include_router(settings_router.router)


# ======================
# STARTUP & SHUTDOWN EVENTS
# ======================
@app.on_event("startup")
async def startup_event():
    """Run saat aplikasi startup"""

    # Create tables hanya di development
    if settings.ENV == "development":
        try:
            create_tables()
            print("✅ Database tables created/verified")
        except Exception as e:
            print(f"⚠️  Warning creating tables: {e}")
    else:
        print("✅ Production mode - assuming tables already exist")

    print("\n" + "=" * 50)
    print(f"🚀 {settings.APP_NAME} v{settings.VERSION}")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌍 Environment: {settings.ENV.upper()}")
    print(f"🔧 Debug Mode: {settings.DEBUG}")
    print(f"📍 Timezone: {settings.TIMEZONE}")
    print(f"🔗 CORS Origins: {len(settings.CORS_ORIGINS)} allowed")
    print("=" * 50)

    print("🌐 WEBHOOK ENDPOINTS:")
    print(f"   Legacy: POST {settings.HOST}:{settings.PORT}/api/webhook")
    print(f"   New:    POST {settings.HOST}:{settings.PORT}/api/webhook/attendance")
    print("=" * 50 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Run saat aplikasi shutdown"""
    print(f"\n⏹️  {settings.APP_NAME} shutting down...")
    print(f"📅 Stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


# ======================
# HEALTH & ROOT ENDPOINTS
# ======================
@app.get("/")
def root():
    return {
        "message": f"{settings.APP_NAME} is Running 🚀",
        "version": settings.VERSION,
        "environment": settings.ENV,
        "mode": "Unidirectional (Mesin -> Server)",
        "features": [
            "Auto-register jamaah via webhook",
            "Real-time prayer time integration",
            "Attendance analytics dashboard",
            "Face recognition compatible",
        ],
        "endpoints": {
            "documentation": "/docs" if settings.DEBUG else "Hidden in production",
            "health_check": "/health",
            "api_status": "/api/system/status",
            "prayer_times": "/api/analytics/prayer-times",
            "webhook_legacy": "/api/webhook",
            "webhook_new": "/api/webhook/attendance",
        },
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "timestamp": datetime.now().isoformat(),
        "environment": settings.ENV,
        "debug": settings.DEBUG,
        "timezone": settings.TIMEZONE,
        "database": "connected" if engine else "disconnected",
    }


# ======================
# GLOBAL ERROR HANDLER
# ======================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if settings.DEBUG else "Internal server error",
            "path": str(request.url.path),
            "timestamp": datetime.now().isoformat(),
        },
    )


# ======================
# DEVELOPMENT ENTRYPOINT
# ======================
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.ENV == "production" else "debug",
    )

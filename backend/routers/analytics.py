from datetime import datetime
from typing import Optional

import requests
import urllib3
from fastapi import APIRouter, HTTPException

from config import settings
from services.prayer_service import (
    prayer_cache,
    get_external_prayer_times,
    get_external_prayer_times_for_date,
    get_fallback_prayer_times,
)

router = APIRouter(
    prefix="/api",
    tags=["Analytics"]
)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


@router.get("/analytics/prayer-times")
def get_prayer_times(date_param: Optional[str] = None):
    """
    API untuk mendapatkan jadwal sholat.
    - Tanpa param: jadwal hari ini (cache), untuk dashboard/frontend.
    - ?date=YYYY-MM-DD: jadwal untuk tanggal tersebut, untuk validasi window absensi sesuai tanggal scan.
    """
    try:
        if date_param:
            from datetime import datetime as dt
            try:
                target = dt.strptime(date_param, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Format date harus YYYY-MM-DD")
            data = get_external_prayer_times_for_date(target)
        else:
            data = get_external_prayer_times()
        return data
    except Exception as e:
        # Jika semua gagal, return error yang informatif
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Gagal mendapatkan jadwal sholat",
                "error": str(e),
                "fallback_used": True,
                "fallback_data": get_fallback_prayer_times()
            }
        )


@router.get("/analytics/prayer-times/status")
def get_prayer_times_status():
    """
    API untuk check status prayer times service.
    Berguna untuk monitoring.
    """
    cache_status = {
        "has_cache": prayer_cache.data is not None,
        "last_updated": prayer_cache.last_updated.isoformat() if prayer_cache.last_updated else None,
        "cache_duration": settings.PRAYER_TIMES_CACHE_DURATION,
        "is_valid": prayer_cache.is_valid()
    }

    # Test koneksi ke MyQuran API
    try:
        test_response = requests.get(
            settings.get_myquran_url(),
            timeout=10,
            verify=False
        )
        api_status = {
            "myquran_api": "reachable" if test_response.status_code == 200 else "unreachable",
            "status_code": test_response.status_code
        }
    except requests.exceptions.RequestException as e:
        api_status = {"myquran_api": "unreachable", "error": str(e)}

    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "environment": settings.ENV,
        "cache": cache_status,
        "apis": api_status,
        "config": {
            "city_id": settings.MYQURAN_CITY_ID,
            "timezone": settings.TIMEZONE,
            "ssl_verify": settings.SSL_VERIFY
        }
    }


@router.post("/analytics/prayer-times/clear-cache")
def clear_prayer_cache():
    """
    API untuk clear cache jadwal sholat.
    Berguna untuk development/testing.
    """
    if settings.ENV == "production":
        raise HTTPException(
            status_code=403,
            detail="Clear cache tidak diizinkan di production"
        )

    prayer_cache.data = None
    prayer_cache.last_updated = None

    return {
        "message": "Cache cleared successfully",
        "timestamp": datetime.now().isoformat()
    }

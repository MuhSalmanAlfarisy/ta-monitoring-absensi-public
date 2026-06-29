from datetime import datetime, date
from typing import Dict, Any, Optional
import requests
import urllib3
from zoneinfo import ZoneInfo

from config import settings

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# =========================
# CACHE
# =========================

class PrayerCache:
    """Class untuk manage cache jadwal sholat"""

    def __init__(self):
        self.data = None
        self.last_updated = None
        self.cache_duration = settings.PRAYER_TIMES_CACHE_DURATION

    def is_valid(self) -> bool:
        """Cek apakah cache masih valid"""
        if not self.data or not self.last_updated:
            return False

        elapsed = (datetime.now() - self.last_updated).total_seconds()
        return elapsed < self.cache_duration

    def update(self, data: Dict[str, Any]):
        """Update cache dengan data baru"""
        self.data = data
        self.last_updated = datetime.now()

    def get(self) -> Dict[str, Any]:
        """Ambil data dari cache"""
        return self.data


# Inisialisasi cache (untuk "hari ini") + cache per tanggal (untuk validasi absensi)
prayer_cache = PrayerCache()
prayer_cache_by_date: Dict[str, Dict[str, Any]] = {}  # date_str -> data, untuk jadwal tanggal lain


# =========================
# HELPER / INTERNAL
# =========================

def _now_local() -> datetime:
    """Waktu sekarang berdasarkan timezone app (default Asia/Jakarta)."""
    try:
        return datetime.now(ZoneInfo(settings.TIMEZONE))
    except Exception:
        return datetime.now()


def _extract_jadwal_entry(payload: Dict[str, Any], preferred_date_key: Optional[str] = None):
    """
    Ambil 1 entry jadwal harian dari payload MyQuran.
    Mendukung 2 bentuk:
    1) jadwal = { "YYYY-MM-DD": {...} }
    2) jadwal = { "subuh": "...", "dzuhur": "...", ... }
    """
    data = payload.get("data") or {}
    jadwal_raw = data.get("jadwal")
    if not isinstance(jadwal_raw, dict) or not jadwal_raw:
        raise Exception("Format data jadwal tidak valid / kosong")

    # Bentuk map tanggal -> detail jadwal
    sample_val = next(iter(jadwal_raw.values()))
    if isinstance(sample_val, dict):
        if preferred_date_key and preferred_date_key in jadwal_raw:
            chosen_key = preferred_date_key
        else:
            local_key = _now_local().strftime("%Y-%m-%d")
            chosen_key = local_key if local_key in jadwal_raw else next(iter(jadwal_raw.keys()))
        return chosen_key, jadwal_raw[chosen_key], data

    # Bentuk detail jadwal langsung
    fallback_key = preferred_date_key or _now_local().strftime("%Y-%m-%d")
    return fallback_key, jadwal_raw, data


def _normalize_prayer_data(date_key: str, jadwal: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalisasi field jadwal agar konsisten untuk frontend."""
    lokasi_parts = [p for p in [data.get("kabko"), data.get("prov")] if p]
    lokasi = ", ".join(lokasi_parts)
    now_iso = _now_local().isoformat()

    return {
        "subuh": jadwal.get("subuh", ""),
        "syuruq": jadwal.get("terbit") or jadwal.get("syuruq", ""),
        "dzuhur": jadwal.get("dzuhur", ""),
        "ashar": jadwal.get("ashar", ""),
        "maghrib": jadwal.get("maghrib", ""),
        "isya": jadwal.get("isya", ""),
        "date": jadwal.get("tanggal", date_key),
        "lokasi": lokasi,
        "source": "myquran_api",
        "cached_at": now_iso,
        "cache_duration": settings.PRAYER_TIMES_CACHE_DURATION
    }


# =========================
# PUBLIC FUNCTIONS
# =========================

def get_external_prayer_times():
    """
    Fetch jadwal sholat dari MyQuran API
    - Menggunakan config dari settings
    - Cache berdasarkan duration dari config
    - Fallback ke default jika gagal
    """

    # CEK CACHE DULU
    if prayer_cache.is_valid():
        print(f"✅ Menggunakan cache jadwal sholat (valid untuk {settings.PRAYER_TIMES_CACHE_DURATION}s)")
        return prayer_cache.get()

    try:
        print(f"🌙 Fetching jadwal sholat dari MyQuran API...")

        url = settings.get_myquran_url()

        response = requests.get(
            url,
            timeout=10,
            verify=False
        )
        response.raise_for_status()

        payload = response.json()

        if not payload.get("status", False):
            raise Exception("API MyQuran mengembalikan status false")

        today_key = _now_local().strftime("%Y-%m-%d")
        selected_key, jadwal, data = _extract_jadwal_entry(payload, preferred_date_key=today_key)
        clean_data = _normalize_prayer_data(selected_key, jadwal, data)

        # UPDATE CACHE
        prayer_cache.update(clean_data)
        print(f"✅ Jadwal sholat berhasil di-fetch dan di-cache")

        return clean_data

    except requests.exceptions.Timeout:
        print("⏰ Timeout saat fetching jadwal sholat")
        return get_fallback_prayer_times()

    except requests.exceptions.ConnectionError:
        print("🌐 Connection error saat fetching jadwal sholat")
        return get_fallback_prayer_times()

    except Exception as e:
        print(f"❌ Error fetching jadwal sholat: {str(e)}")
        return get_fallback_prayer_times()


def get_external_prayer_times_for_date(target_date: date) -> Dict[str, Any]:
    """
    Ambil jadwal sholat untuk tanggal tertentu (untuk validasi window absensi sesuai tanggal scan).
    Menggunakan cache per tanggal agar tidak memukul API berulang untuk tanggal yang sama.
    Untuk "hari ini" memakai cache utama get_external_prayer_times() agar konsisten.
    """
    if target_date == _now_local().date():
        return get_external_prayer_times()

    date_key = target_date.strftime("%Y-%m-%d")

    if date_key in prayer_cache_by_date:
        return prayer_cache_by_date[date_key]

    try:
        url = settings.get_myquran_url_for_date(target_date)
        response = requests.get(
            url,
            timeout=10,
            verify=False
        )
        response.raise_for_status()
        payload = response.json()

        if not payload.get("status", False):
            raise Exception("API MyQuran mengembalikan status false")

        selected_key, jadwal, data = _extract_jadwal_entry(payload, preferred_date_key=date_key)
        clean_data = _normalize_prayer_data(selected_key, jadwal, data)
        prayer_cache_by_date[date_key] = clean_data
        return clean_data

    except requests.exceptions.Timeout as e:
        print(f"⏰ Jadwal untuk {date_key} timeout: {e}, pakai fallback")
        fallback = get_fallback_prayer_times_for_date(target_date)
        prayer_cache_by_date[date_key] = fallback
        return fallback
    except requests.exceptions.ConnectionError as e:
        print(f"🌐 Jadwal untuk {date_key} connection error: {e}, pakai fallback")
        fallback = get_fallback_prayer_times_for_date(target_date)
        prayer_cache_by_date[date_key] = fallback
        return fallback
    except requests.exceptions.RequestException as e:
        print(f"❌ Jadwal untuk {date_key} request error: {e}, pakai fallback")
        fallback = get_fallback_prayer_times_for_date(target_date)
        prayer_cache_by_date[date_key] = fallback
        return fallback
    except Exception as e:
        print(f"❌ Jadwal untuk {date_key}: {e}, pakai fallback")
        fallback = get_fallback_prayer_times_for_date(target_date)
        prayer_cache_by_date[date_key] = fallback
        return fallback


def get_fallback_prayer_times() -> Dict[str, Any]:
    """
    Return fallback prayer times dari config.
    Digunakan jika API MyQuran gagal.
    """
    print(f"⚠️  Menggunakan fallback jadwal sholat dari config")

    fallback_data = {
        "subuh": settings.DEFAULT_PRAYER_TIMES["subuh"],
        "syuruq": settings.DEFAULT_PRAYER_TIMES["syuruq"],
        "dzuhur": settings.DEFAULT_PRAYER_TIMES["dzuhur"],
        "ashar": settings.DEFAULT_PRAYER_TIMES["ashar"],
        "maghrib": settings.DEFAULT_PRAYER_TIMES["maghrib"],
        "isya": settings.DEFAULT_PRAYER_TIMES["isya"],
        "date": _now_local().strftime("%Y-%m-%d"),
        "lokasi": settings.DEFAULT_PRAYER_LOCATION,
        "source": "fallback_config",
        "cached_at": _now_local().isoformat(),
        "cache_duration": 300  # Cache pendek untuk fallback (5 menit)
    }

    # CACHE JUGA FALLBACK DATA
    prayer_cache.update(fallback_data)

    return fallback_data


def get_fallback_prayer_times_for_date(target_date: date) -> Dict[str, Any]:
    """Fallback jadwal untuk tanggal tertentu (nilai default config)."""
    return {
        **settings.DEFAULT_PRAYER_TIMES,
        "syuruq": settings.DEFAULT_PRAYER_TIMES.get("syuruq", settings.DEFAULT_PRAYER_TIMES["subuh"]),
        "date": target_date.strftime("%Y-%m-%d"),
        "lokasi": settings.DEFAULT_PRAYER_LOCATION,
        "source": "fallback_config",
        "cached_at": _now_local().isoformat(),
        "cache_duration": 300,
    }

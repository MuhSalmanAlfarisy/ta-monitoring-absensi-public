"""
Prayer time utility functions
"""

from datetime import datetime, date
from typing import Optional, Tuple, Dict, Any, List, TYPE_CHECKING

from utils.date_utils import get_hari_indonesia

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


# ======================================================
# CONSTANTS
# ======================================================

# Isya override (permanent)
ISYA_OPEN_BEFORE_MINUTES = 20
ISYA_FIXED_CLOSE_MINUTES = 20 * 60  # 20:00
ISYA_LATE_WINDOW_MINUTES = 10

# Tarawih window (Ramadhan only)
TARAWIH_OPEN_MINUTES = 20 * 60 + 1    # 20:01
TARAWIH_CLOSE_MINUTES = 21 * 60 + 30  # 21:30

OUTSIDE_PRAYER_LABEL = "Di Luar Waktu Sholat"
OUTSIDE_ATTENDANCE_STATUS = "DI_LUAR_WAKTU_SHOLAT"
UNKNOWN_PRAYER_LABEL = "Tidak terdeteksi"
VALID_WAKTU_SHOLAT = {"Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya", "Tarawih"}

_ramadhan_table_ready = False


# ======================================================
# TIME CONVERSION HELPERS
# ======================================================

def time_to_minutes(time_str: str) -> int:
    if not time_str:
        return 0
    try:
        hours, minutes = map(int, time_str.split(":"))
        return hours * 60 + minutes
    except Exception:
        return 0


def minutes_to_time(minutes: int) -> str:
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"


# ======================================================
# PRAYER TIMES FETCH
# ======================================================

def get_today_prayer_times() -> Dict[str, str]:
    """
    Ambil jadwal sholat hari ini dari API resmi via endpoint analytics.
    Tidak ada dummy fallback.
    """
    return get_prayer_times_for_date(datetime.now().date())


def get_prayer_times_for_date(target_date: date) -> Dict[str, str]:
    """
    Ambil jadwal sholat untuk tanggal tertentu dari internal service analytics.
    Jangan call HTTP ke app sendiri karena bisa deadlock/timeout pada worker tunggal.
    """
    try:
        # Import di dalam fungsi untuk menghindari import cycle saat startup.
        from services.prayer_service import get_external_prayer_times_for_date
        data = get_external_prayer_times_for_date(target_date)
    except Exception as e:
        raise RuntimeError(f"Gagal mengambil jadwal sholat dari service internal: {str(e)}")

    required_keys = ["subuh", "syuruq", "dzuhur", "ashar", "maghrib", "isya"]
    for key in required_keys:
        if key not in data:
            raise ValueError(f"Field prayer time '{key}' tidak ditemukan")
    return data


# ======================================================
# RAMADHAN HELPERS
# ======================================================

def _ensure_ramadhan_table(db: Optional["Session"]) -> None:
    global _ramadhan_table_ready
    if _ramadhan_table_ready or db is None:
        return

    try:
        import models
        models.RamadhanSettings.__table__.create(bind=db.get_bind(), checkfirst=True)
        _ramadhan_table_ready = True
    except Exception as e:
        print(f"Warning ensure RamadhanSettings table failed: {e}")


def get_ramadhan_status(
    target_date: date,
    db: Optional["Session"] = None,
) -> Dict[str, Any]:
    status = {
        "mode": False,
        "start_date": None,
        "end_date": None,
        "is_active_today": False,
    }
    if db is None:
        return status

    _ensure_ramadhan_table(db)

    try:
        import models
        row = db.query(models.RamadhanSettings).order_by(models.RamadhanSettings.id.asc()).first()
        if not row:
            return status

        mode = bool(row.ramadhan_mode)
        start_date = row.ramadhan_start_date
        end_date = row.ramadhan_end_date
        is_active_today = bool(
            mode and start_date and end_date and start_date <= target_date <= end_date
        )
        return {
            "mode": mode,
            "start_date": start_date,
            "end_date": end_date,
            "is_active_today": is_active_today,
        }
    except Exception as e:
        print(f"Warning read RamadhanSettings failed: {e}")
        return status


def is_ramadhan_active_for_date(
    target_date: date,
    db: Optional["Session"] = None,
) -> bool:
    return bool(get_ramadhan_status(target_date=target_date, db=db)["is_active_today"])


def get_sholat_order(
    db: Optional["Session"] = None,
    target_date: Optional[date] = None,
    include_syuruq: bool = True,
) -> List[str]:
    base_order = (
        ["Subuh", "Syuruq", "Dzuhur", "Ashar", "Maghrib", "Isya"]
        if include_syuruq
        else ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"]
    )
    check_date = target_date or datetime.now().date()
    if is_ramadhan_active_for_date(check_date, db):
        return [*base_order, "Tarawih"]
    return base_order


# ======================================================
# PRAYER WINDOW HELPERS
# ======================================================

def _normalize_waktu_sholat_label(waktu_sholat: Optional[str]) -> str:
    if not waktu_sholat:
        return ""
    return " ".join(waktu_sholat.strip().split())


def _is_outside_prayer_label(waktu_sholat: str) -> bool:
    normalized = waktu_sholat.replace("_", " ").strip().lower()
    return normalized == OUTSIDE_PRAYER_LABEL.lower()


def _get_isya_window(prayer_times: Dict[str, str]) -> Optional[Tuple[int, int, int]]:
    isya_raw = prayer_times.get("isya")
    if not isya_raw:
        return None

    isya_start_min = time_to_minutes(isya_raw)
    open_time = isya_start_min - ISYA_OPEN_BEFORE_MINUTES
    close_time = ISYA_FIXED_CLOSE_MINUTES
    late_start_time = close_time - ISYA_LATE_WINDOW_MINUTES
    return open_time, late_start_time, close_time


def _get_prayer_window(
    waktu_sholat: str,
    prayer_times: Dict[str, str],
    is_jumat: bool
) -> Optional[Tuple[int, int, int]]:
    """
    Return (open_minutes, close_minutes, late_start_minutes)
    Berdasarkan aturan aktual di kode (utils.py):

    Subuh:
      - Open: 60 menit sebelum Subuh
      - Close: Waktu Syuruq
      - Late: 10 menit sebelum Syuruq

    Jumat:
      - Open: 60 menit sebelum Dzuhur
      - Close: 13:00 (Fixed)
      - Late: 12:50 - 13:00 (10 menit terakhir)

    Dzuhur (Normal):
      - Open: 60 menit sebelum Dzuhur
      - Close: 13:00 (Fixed)
      - Late: 12:50 - 13:00

    Ashar:
      - Open: 30 menit sebelum Ashar
      - Close: 16:00 (Fixed)
      - Late: 15:50 - 16:00

    Maghrib:
      - Open: 60 menit sebelum Maghrib
      - Close: 40 menit setelah Maghrib
      - Late: 10 menit sebelum close (Maghrib + 30 sd Maghrib + 40)

    Isya:
      - Open: 20 menit sebelum Isya
      - Close: 20:00 (Fixed)
      - Late: 19:50 - 20:00

    Tarawih (Ramadhan):
      - Open: 20:15 (Fixed)
      - Close: 21:30 (Fixed)
      - Late: Sesuai konfigurasi
    """
    sholat_key = waktu_sholat.lower()

    # 1. Isya (Existing Override)
    if waktu_sholat == "Isya":
        isya_window = _get_isya_window(prayer_times)
        if not isya_window:
            return None
        # _get_isya_window returns (open, late_start, close)
        open_t, late_start_t, close_t = isya_window
        return open_t, close_t, late_start_t

    # 2. Basic Check
    if sholat_key not in prayer_times:
        return None

    start_minutes = time_to_minutes(prayer_times[sholat_key])

    # 3. Rules per Prayer
    if waktu_sholat == "Subuh":
        # Open 60 min before
        open_time = start_minutes - 60

        # Close at Syuruq
        syuruq_str = prayer_times.get("syuruq")
        if not syuruq_str:
            return None

        close_time = time_to_minutes(syuruq_str)
        # Late: 10 mins before Syuruq
        late_start = close_time - 10

    elif waktu_sholat == "Dzuhur":
        if is_jumat:
            # Jumat: Open 60 min before
            open_time = start_minutes - 60
        else:
            # Normal: Open 60 min before
            open_time = start_minutes - 60

        # Close Fixed 13:00
        close_time = 13 * 60
        # Late: 12:50 - 13:00
        late_start = close_time - 10

    elif waktu_sholat == "Ashar":
        # Open 30 min before
        open_time = start_minutes - 30
        # Close Fixed 16:00
        close_time = 16 * 60
        # Late: 15:50 - 16:00
        late_start = close_time - 10

    elif waktu_sholat == "Maghrib":
        # Open 60 min before
        open_time = start_minutes - 60
        # Close 40 min after
        close_time = start_minutes + 40
        # Late: 10 mins before close
        late_start = close_time - 10

    else:
        return None

    return open_time, close_time, late_start


# ======================================================
# CORE DETERMINATION FUNCTIONS
# ======================================================

def determine_sholat_time(scan_time: datetime, db: Optional["Session"] = None) -> str:
    try:
        prayer_times = get_prayer_times_for_date(scan_time.date())
        scan_minutes = scan_time.hour * 60 + scan_time.minute

        # Resolver malam (prioritas):
        # 1) Isya override
        # 2) Tarawih (jika Ramadhan aktif)
        isya_window = _get_isya_window(prayer_times)
        if isya_window:
            isya_open, _, isya_close = isya_window
            if isya_open <= scan_minutes <= isya_close:
                return "Isya"

        if is_ramadhan_active_for_date(scan_time.date(), db):
            if TARAWIH_OPEN_MINUTES <= scan_minutes <= TARAWIH_CLOSE_MINUTES:
                return "Tarawih"

        is_jumat = get_hari_indonesia(scan_time) == "Jumat"
        # Kita hapus Syuruq dari scan order karena fungsinya sekarang hanya penutup Subuh
        sholat_order = ["Subuh", "Dzuhur", "Ashar", "Maghrib"]

        # Source of truth: pemetaan sholat mengikuti window absensi aktif.
        for sholat in sholat_order:
            window = _get_prayer_window(sholat, prayer_times, is_jumat)
            if not window:
                continue

            open_time, close_time, _ = window

            if open_time <= scan_minutes <= close_time:
                return sholat

        return OUTSIDE_PRAYER_LABEL

    except Exception as e:
        raise RuntimeError(f"Error determining sholat time: {str(e)}")


def determine_attendance_status(
    scan_time: datetime,
    waktu_sholat: str,
    db: Optional["Session"] = None,
) -> str:
    """
    Menentukan status kehadiran berdasarkan waktu scan dan waktu sholat.
    TIDAK PERNAH return None — semua edge case fallback ke DI_LUAR_WAKTU_SHOLAT.
    """
    normalized_waktu_sholat = _normalize_waktu_sholat_label(waktu_sholat)

    if not normalized_waktu_sholat or normalized_waktu_sholat == UNKNOWN_PRAYER_LABEL:
        return OUTSIDE_ATTENDANCE_STATUS
    if _is_outside_prayer_label(normalized_waktu_sholat):
        return OUTSIDE_ATTENDANCE_STATUS
    if normalized_waktu_sholat not in VALID_WAKTU_SHOLAT:
        return OUTSIDE_ATTENDANCE_STATUS

    scan_minutes = scan_time.hour * 60 + scan_time.minute
    prayer_times = get_prayer_times_for_date(scan_time.date())

    # Special handling for Tarawih (separate logic in utils)
    if normalized_waktu_sholat == "Tarawih":
        if not is_ramadhan_active_for_date(scan_time.date(), db):
            return OUTSIDE_ATTENDANCE_STATUS
        if scan_minutes < TARAWIH_OPEN_MINUTES:
            return OUTSIDE_ATTENDANCE_STATUS
        if scan_minutes <= TARAWIH_CLOSE_MINUTES:
            return "TEPAT_WAKTU"
        return OUTSIDE_ATTENDANCE_STATUS

    # General Logic for Subuh, Dzuhur, Ashar, Maghrib, Isya
    is_jumat = get_hari_indonesia(scan_time) == "Jumat"

    window = _get_prayer_window(normalized_waktu_sholat, prayer_times, is_jumat)
    if not window:
        return OUTSIDE_ATTENDANCE_STATUS

    open_time, close_time, late_start = window

    # 1. Check Window Boundary
    if scan_minutes < open_time or scan_minutes > close_time:
        return OUTSIDE_ATTENDANCE_STATUS

    # 2. Determine Status
    if scan_minutes >= late_start:
        return "TERLAMBAT"

    return "TEPAT_WAKTU"
"""
Date and time utility functions
"""

from datetime import datetime, time


# ======================================================
# DATE UTILITIES
# ======================================================

def get_hari_indonesia(date_obj: datetime) -> str:
    days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    return days[date_obj.weekday()]


def format_date_id(date: datetime) -> str:
    days_id = [
        "Senin", "Selasa", "Rabu",
        "Kamis", "Jumat", "Sabtu", "Minggu"
    ]
    months_id = [
        "Januari", "Februari", "Maret", "April",
        "Mei", "Juni", "Juli", "Agustus",
        "September", "Oktober", "November", "Desember",
    ]
    return f"{days_id[date.weekday()]}, {date.day} {months_id[date.month - 1]} {date.year}"


def format_time_id(time_obj: time) -> str:
    return f"{time_obj.hour:02d}:{time_obj.minute:02d} WIB"


def parse_scan_time(scan_str: str) -> datetime:
    """
    Parse string waktu scan menjadi datetime (naive).
    Asumsi: mesin absensi mengirim waktu dalam WIB agar hari (termasuk deteksi Jumat) terbaca benar.
    """
    try:
        return datetime.strptime(scan_str, "%Y-%m-%d %H:%M")
    except ValueError:
        return datetime.strptime(scan_str, "%Y-%m-%d %H:%M:%S")
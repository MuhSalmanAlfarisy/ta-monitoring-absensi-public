"""
utils package — re-export layer.

Semua import lama seperti `from utils import ...` tetap berfungsi
tanpa perubahan apapun di file lain.
"""

# AUTH
from utils.auth_utils import (
    create_access_token,
    verify_auth_token,
    verify_firebase_token,
    verify_firebase_token_with_reason,
    verify_auth_token_with_reason,
    get_token_error_detail,
    delete_firebase_user_by_email,
)

# PRAYER TIME
from utils.prayer_utils import (
    time_to_minutes,
    minutes_to_time,
    get_today_prayer_times,
    get_prayer_times_for_date,
    get_ramadhan_status,
    is_ramadhan_active_for_date,
    get_sholat_order,
    determine_sholat_time,
    determine_attendance_status,
    OUTSIDE_PRAYER_LABEL,
    OUTSIDE_ATTENDANCE_STATUS,
    VALID_WAKTU_SHOLAT,
)

# DATE
from utils.date_utils import (
    get_hari_indonesia,
    format_date_id,
    format_time_id,
    parse_scan_time,
)

# WEBHOOK
from utils.webhook_utils import (
    validate_webhook_payload,
    log_webhook_reception,
    log_processing_result,
)

# SYSTEM
from utils.system_utils import (
    get_system_resources,
    get_client_ip,
)

__all__ = [
    # auth
    "create_access_token",
    "verify_auth_token",
    "verify_firebase_token",
    "verify_firebase_token_with_reason",
    "verify_auth_token_with_reason",
    "get_token_error_detail",
    "delete_firebase_user_by_email",
    # prayer
    "time_to_minutes",
    "minutes_to_time",
    "get_today_prayer_times",
    "get_prayer_times_for_date",
    "get_ramadhan_status",
    "is_ramadhan_active_for_date",
    "get_sholat_order",
    "determine_sholat_time",
    "determine_attendance_status",
    "OUTSIDE_PRAYER_LABEL",
    "OUTSIDE_ATTENDANCE_STATUS",
    "VALID_WAKTU_SHOLAT",
    # date
    "get_hari_indonesia",
    "format_date_id",
    "format_time_id",
    "parse_scan_time",
    # webhook
    "validate_webhook_payload",
    "log_webhook_reception",
    "log_processing_result",
    # system
    "get_system_resources",
    "get_client_ip",
]
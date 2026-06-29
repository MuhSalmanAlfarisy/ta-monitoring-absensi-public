"""
Webhook utility functions
"""

from typing import Tuple


# ======================================================
# WEBHOOK UTILITIES
# ======================================================

def validate_webhook_payload(payload: dict) -> Tuple[bool, str, dict]:
    """
    Validasi payload webhook.
    Returns: (is_valid, error_message, valid_data)
    """
    if not payload.get("cloud_id"):
        return False, "Missing cloud_id", {}

    data = payload.get("data")
    if not data:
        return False, "Missing data object", {}

    if not data.get("pin"):
        return False, "Missing PIN in data", {}

    if not data.get("scan"):
        return False, "Missing scan time in data", {}

    return True, "", data


def log_webhook_reception(payload: dict, source_ip: str) -> None:
    """
    Log penerimaan webhook (formatted)
    """
    try:
        cloud_id = payload.get("cloud_id", "UNKNOWN")
        data = payload.get("data", {})
        pin = data.get("pin", "UNKNOWN")
        print(f"\n📨 WEBHOOK RECEIVED | IP: {source_ip}")
        print(f"   Device: {cloud_id} | PIN: {pin}")
    except Exception as e:
        print(f"Error logging webhook: {e}")


def log_processing_result(
    jamaah_id: str,
    is_new: bool,
    processing_time_ms: int,
    status: str
) -> None:
    """
    Log hasil processing webhook
    """
    status_icon = "✅" if status == "success" else "❌"
    jamaah_type = "New Jamaah" if is_new else "Existing Jamaah"

    print(f"   Result: {status_icon} {status.upper()} ({processing_time_ms}ms)")
    print(f"   User: {jamaah_id} ({jamaah_type})\n")
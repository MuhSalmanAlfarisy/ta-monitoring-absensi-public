"""
System utility functions
"""

from typing import Dict, Any
import psutil


# ======================================================
# SYSTEM UTILITIES
# ======================================================

from fastapi import Request

def get_client_ip(request: Request) -> str | None:
    """
    Get the real client IP address, handling proxies and load balancers.
    Checks X-Forwarded-For and X-Real-IP headers before falling back to request.client.host.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
        
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
        
    return request.client.host if request.client else None

def get_system_resources() -> Dict[str, Any]:
    """
    Get system resource usage (CPU, RAM, Disk)
    """
    try:
        cpu_usage = psutil.cpu_percent(interval=None)  # Interval None to be non-blocking
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu": {
                "percent": cpu_usage
            },
            "memory": {
                "total": memory.total,
                "used": memory.used,
                "free": memory.available,
                "percent": memory.percent
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            }
        }
    except Exception as e:
        print(f"Error getting system resources: {e}")
        return {
            "cpu": {"percent": 0},
            "memory": {"total": 0, "used": 0, "free": 0, "percent": 0},
            "disk": {"total": 0, "used": 0, "free": 0, "percent": 0}
        }
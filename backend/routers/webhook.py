import json
from datetime import datetime

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from utils import log_webhook_reception
from services.webhook_service import process_attendance_webhook

router = APIRouter(
    prefix="/api",
    tags=["Webhook - Mesin Absensi"]
)


@router.post("/webhook", response_model=schemas.WebhookResponse)
async def receive_attendance_webhook_legacy(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    🔄 ENDPOINT LEGACY - Untuk kompatibilitas dengan mesin yang sudah dikonfigurasi

    URL: POST https://api.masjidnurutaqwa.my.id/api/webhook

    ⚠️ INI UNTUK BACKWARD COMPATIBILITY SAJA
    Gunakan /api/webhook/attendance untuk implementasi baru
    """
    source_ip = request.client.host if request.client else "unknown"

    try:
        payload = await request.json()
        log_webhook_reception(payload, source_ip)

        print(f"⚠️  Using LEGACY webhook endpoint /api/webhook")

        # Process menggunakan function yang sama
        return await process_attendance_webhook(payload, source_ip, db)

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        db.rollback()
        print(f"❌ LEGACY WEBHOOK ERROR: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/webhook/attendance", response_model=schemas.WebhookResponse)
async def receive_attendance_webhook_new(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    🔄 ENDPOINT BARU - Lebih spesifik dan recommended

    URL: POST https://api.masjidnurutaqwa.my.id/api/webhook/attendance

    ✅ GUNAKAN INI UNTUK IMPLEMENTASI BARU
    """
    source_ip = request.client.host if request.client else "unknown"

    try:
        payload = await request.json()
        log_webhook_reception(payload, source_ip)

        print(f"✅ Using NEW webhook endpoint /api/webhook/attendance")

        # Process menggunakan function yang sama
        return await process_attendance_webhook(payload, source_ip, db)

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        db.rollback()
        print(f"❌ NEW WEBHOOK ERROR: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/webhook/test")
def test_webhook_endpoint():
    """
    Endpoint untuk testing webhook (development only)
    """
    test_payload = {
        "type": "attlog",
        "cloud_id": "S118000036",
        "data": {
            "pin": "Ahmad Fauzi",
            "scan": "2024-01-30 12:15",
            "verify": 1,
            "status_scan": 0,
            "work_code": "A1",
            "photo_url": "https://example.com/photo.jpg"
        }
    }

    return {
        "message": "Webhook endpoint is working",
        "available_endpoints": {
            "legacy": {
                "url": "/api/webhook",
                "method": "POST",
                "description": "Untuk kompatibilitas dengan mesin yang sudah di-set"
            },
            "new": {
                "url": "/api/webhook/attendance",
                "method": "POST",
                "description": "Recommended untuk implementasi baru"
            }
        },
        "test_payload": test_payload,
        "curl_examples": {
            "legacy": f"curl -X POST http://localhost:8000/api/webhook -H 'Content-Type: application/json' -d '{json.dumps(test_payload)}'",
            "new": f"curl -X POST http://localhost:8000/api/webhook/attendance -H 'Content-Type: application/json' -d '{json.dumps(test_payload)}'"
        }
    }


@router.get("/webhook/logs")
def get_webhook_logs(
    limit: int = 50,
    processed: bool = None,
    db: Session = Depends(get_db)
):
    """
    Get recent webhook logs (for monitoring/debugging)
    """
    query = db.query(models.WebhookLog)

    if processed is not None:
        query = query.filter(models.WebhookLog.processed == processed)

    logs = query.order_by(
        models.WebhookLog.created_at.desc()
    ).limit(limit).all()

    # Hitung statistik
    total_logs = db.query(models.WebhookLog).count()
    processed_logs = db.query(models.WebhookLog).filter(
        models.WebhookLog.processed == True
    ).count()
    error_logs = db.query(models.WebhookLog).filter(
        models.WebhookLog.error_message.isnot(None)
    ).count()
    new_jamaah_count = db.query(models.WebhookLog).filter(
        models.WebhookLog.jamaah_created == True
    ).count()

    return {
        "logs": logs,
        "statistics": {
            "total": total_logs,
            "processed": processed_logs,
            "with_errors": error_logs,
            "new_jamaah_created": new_jamaah_count,
            "success_rate": f"{round((processed_logs/total_logs*100), 1)}%" if total_logs > 0 else "0%"
        },
        "limit": limit,
        "filters": {
            "processed": processed
        }
    }


@router.delete("/webhook/logs")
def clear_webhook_logs(
    db: Session = Depends(get_db)
):
    """
    Clear all webhook logs (development only)
    """
    from config import settings

    if settings.ENV == "production":
        raise HTTPException(
            status_code=403,
            detail="Clear logs tidak diizinkan di production"
        )

    deleted_count = db.query(models.WebhookLog).delete()
    db.commit()

    return {
        "message": "Webhook logs cleared",
        "deleted_count": deleted_count,
        "timestamp": datetime.now().isoformat()
    }
from datetime import datetime, timedelta, date
from typing import List, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc, extract, case
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from config import settings
from utils import get_ramadhan_status

router = APIRouter(
    prefix="/api/statistics",
    tags=["Statistics"]
)

OUTSIDE_PRAYER_LABEL = "Di Luar Waktu Sholat"


def _now_local() -> datetime:
    tz_name = settings.TIMEZONE or "Asia/Jakarta"
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now()


# ======================================================
# LEADERBOARD
# ======================================================

@router.get("/leaderboard", response_model=List[schemas.LeaderboardResponse])
def get_leaderboard(
    period: str = Query("bulan-ini", description="Periode: hari-ini, pekan-ini, bulan-ini, tahun-ini, all-time, custom"),
    waktu_sholat: Optional[List[str]] = Query(None, description="Filter waktu sholat: Subuh, Dzuhur, Ashar, Maghrib, Isya, Tarawih"),
    limit: int = Query(50, ge=1, le=100, description="Jumlah ranking"),
    start_date: Optional[date] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Custom end date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    API Leaderboard jamaah dengan filter periode waktu.
    """
    now = _now_local()
    today = now.date()

    # Base query
    query = db.query(
        models.Jamaah.id,
        models.Jamaah.nama,
        models.Jamaah.foto_profil_url,
        func.count(models.AttendanceLog.id).label("total_hadir"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU", 1), else_=0)).label("tepat_waktu"),
        func.sum(case((models.AttendanceLog.status_kehadiran == "TERLAMBAT", 1), else_=0)).label("terlambat")
    ).join(
        models.AttendanceLog,
        models.Jamaah.id == models.AttendanceLog.jamaah_id
    ).filter(
        models.AttendanceLog.waktu_sholat != OUTSIDE_PRAYER_LABEL
    )

    # Apply period filter
    if period == "custom" and start_date and end_date:
        query = query.filter(
            func.date(models.AttendanceLog.scan_time) >= start_date,
            func.date(models.AttendanceLog.scan_time) <= end_date
        )
    elif period == "hari-ini":
        query = query.filter(func.date(models.AttendanceLog.scan_time) == today)
    elif period == "pekan-ini":
        start_week = today - timedelta(days=today.weekday())
        query = query.filter(models.AttendanceLog.scan_time >= start_week)
    elif period == "bulan-ini":
        query = query.filter(
            extract('month', models.AttendanceLog.scan_time) == now.month,
            extract('year', models.AttendanceLog.scan_time) == now.year
        )
    elif period == "tahun-ini":
        query = query.filter(extract('year', models.AttendanceLog.scan_time) == now.year)
    elif period == "ramadhan":
        ramadhan_cfg = get_ramadhan_status(target_date=today, db=db)
        start_ramadhan = ramadhan_cfg.get("start_date")
        end_ramadhan = ramadhan_cfg.get("end_date")
        if start_ramadhan and end_ramadhan:
            query = query.filter(
                func.date(models.AttendanceLog.scan_time) >= start_ramadhan,
                func.date(models.AttendanceLog.scan_time) <= end_ramadhan
            )
        else:
            query = query.filter(models.AttendanceLog.id == -1)
    # "all-time" tidak perlu filter tambahan

    # Apply waktu sholat filter (Multi-select)
    if waktu_sholat:
        filtered_waktu = [w for w in waktu_sholat if w and w.lower() not in ["all", "semua"]]
        if filtered_waktu:
            query = query.filter(models.AttendanceLog.waktu_sholat.in_(filtered_waktu))

    # Grouping & Sorting
    results = query.group_by(
        models.Jamaah.id,
        models.Jamaah.nama,
        models.Jamaah.foto_profil_url
    ).order_by(
        desc("total_hadir"),
        desc("tepat_waktu")
    ).limit(limit).all()

    # Format Response dengan ranking
    leaderboard = []
    for idx, row in enumerate(results):
        total = row.total_hadir or 0
        tepat_waktu = row.tepat_waktu or 0
        terlambat = row.terlambat or 0

        leaderboard.append({
            "rank": idx + 1,
            "id": row.id,
            "nama": row.nama,
            "foto_profil_url": row.foto_profil_url,
            "total_hadir": total,
            "tepat_waktu": tepat_waktu,
            "terlambat": terlambat,
            "persentase_tepat_waktu": round((tepat_waktu / total * 100), 1) if total > 0 else 0,
            "avg_per_hari": 0  # Bisa dihitung jika ada data first_seen
        })

    return leaderboard
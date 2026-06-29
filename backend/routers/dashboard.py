from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from config import settings
from services.prayer_service import get_external_prayer_times, _now_local

router = APIRouter(
    prefix="/api",
    tags=["Dashboard"]
)


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """API untuk 4 Kartu Statistik di Dashboard"""

    total_jamaah = db.query(models.Jamaah).count()

    today = datetime.now().date()
    total_today = db.query(models.AttendanceLog).filter(
        func.date(models.AttendanceLog.scan_time) == today,
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat",
        models.AttendanceLog.event_id.is_(None)
    ).count()

    # Hitung tepat waktu hari ini
    tepat_waktu = db.query(models.AttendanceLog).filter(
        func.date(models.AttendanceLog.scan_time) == today,
        models.AttendanceLog.status_kehadiran == "TEPAT_WAKTU",
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat",
        models.AttendanceLog.event_id.is_(None)
    ).count()

    # Hitung persentase tepat waktu
    tepat_waktu_persen = round((tepat_waktu / total_today * 100), 1) if total_today > 0 else 0

    # Hitung rata-rata kehadiran 7 hari terakhir
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)

    weekly_avg = db.query(
        func.avg(func.count(models.AttendanceLog.id))
    ).filter(
        func.date(models.AttendanceLog.scan_time).between(start_date, end_date),
        models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat",
        models.AttendanceLog.event_id.is_(None)
    ).group_by(func.date(models.AttendanceLog.scan_time)).scalar() or 0

    weekly_avg_persen = round((weekly_avg / total_jamaah * 100), 1) if total_jamaah > 0 else 0

    return {
        "total_jamaah": total_jamaah,
        "kehadiran_hari_ini": total_today,
        "tepat_waktu_hari_ini": f"{tepat_waktu_persen}%",
        "rata_rata_mingguan": f"{weekly_avg_persen}%",
    }


@router.get(
    "/dashboard/recent-logs",
    response_model=List[schemas.AttendanceLogResponse]
)
def get_recent_logs(limit: int = 10, db: Session = Depends(get_db)):
    """API untuk Tabel Absensi Terbaru"""

    logs = (
        db.query(
            models.AttendanceLog,
            models.Jamaah.nama.label("nama_jamaah")
        )
        .join(models.Jamaah, models.AttendanceLog.jamaah_id == models.Jamaah.id)
        .filter(
            models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat",
            models.AttendanceLog.event_id.is_(None)
        )
        .order_by(desc(models.AttendanceLog.scan_time))
        .limit(limit)
        .all()
    )

    results = []
    for log, nama in logs:
        log.nama_jamaah = nama
        results.append(log)

    return results


@router.get("/dashboard/chart-prayer")
def get_prayer_chart_data(db: Session = Depends(get_db)):
    """API Grafik Kehadiran per Sholat (Hari Ini)"""

    today = datetime.now().date()

    stats = (
        db.query(
            models.AttendanceLog.waktu_sholat,
            func.count(models.AttendanceLog.id)
        )
        .filter(
            func.date(models.AttendanceLog.scan_time) == today,
            models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat",
            models.AttendanceLog.event_id.is_(None)
        )
        .group_by(models.AttendanceLog.waktu_sholat)
        .all()
    )

    # Gunakan semua waktu sholat yang ada di DEFAULT_PRAYER_TIMES
    data_map = {k: 0 for k in settings.DEFAULT_PRAYER_TIMES.keys()}

    for sholat, count in stats:
        if sholat in data_map:
            data_map[sholat] = count

    # Format untuk chart
    return [{"waktu": k, "jamaah": v} for k, v in data_map.items()]


@router.get("/dashboard/chart-weekly")
def get_weekly_stats(db: Session = Depends(get_db)):
    """API Grafik 7 Hari Terakhir"""

    end_date = _now_local().date()

    first_data_raw = db.query(func.min(func.date(models.AttendanceLog.scan_time))).scalar()
    if isinstance(first_data_raw, str):
        try:
            first_data_date = datetime.strptime(first_data_raw[:10], "%Y-%m-%d").date()
        except ValueError:
            first_data_date = None
    elif isinstance(first_data_raw, datetime):
        first_data_date = first_data_raw.date()
    else:
        first_data_date = first_data_raw

    requested_start = end_date - timedelta(days=6)
    start_date = max(requested_start, first_data_date) if first_data_date else requested_start

    # Hitung total jamaah untuk persentase
    total_jamaah = db.query(models.Jamaah).count()

    stats = (
        db.query(
            func.date(models.AttendanceLog.scan_time).label("date"),
            func.count(func.distinct(models.AttendanceLog.jamaah_id)).label("count")
        )
        .filter(
            models.AttendanceLog.scan_time >= start_date,
            models.AttendanceLog.scan_time < (end_date + timedelta(days=1)),
            models.AttendanceLog.waktu_sholat != "Di Luar Waktu Sholat",
            models.AttendanceLog.event_id.is_(None)
        )
        .group_by("date")
        .all()
    )

    stats_dict = {str(r.date): r.count for r in stats}

    # Format hari dalam bahasa Indonesia
    hari_indonesia = {
        "Mon": "Sen", "Tue": "Sel", "Wed": "Rab",
        "Thu": "Kam", "Fri": "Jum", "Sat": "Sab",
        "Sun": "Min"
    }

    results = []
    current = start_date
    while current <= end_date:
        kehadiran = stats_dict.get(str(current), 0)
        persentase = round((kehadiran / total_jamaah * 100), 1) if total_jamaah > 0 else 0

        # Konversi hari ke Indonesia
        day_eng = current.strftime("%a")
        day_idn = hari_indonesia.get(day_eng, day_eng)

        results.append({
            "day": day_idn,
            "date": current.strftime("%Y-%m-%d"),
            "kehadiran": kehadiran,
            "persentase": persentase,
            "target": 80,  # Target 80% kehadiran
        })
        current += timedelta(days=1)

    return results
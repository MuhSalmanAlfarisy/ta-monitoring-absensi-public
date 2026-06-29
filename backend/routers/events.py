from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from database import get_db
import models
import schemas
from services.event_service import (
    _time_to_minutes,
    _get_event_history_status,
    check_participant_overlap,
)

router = APIRouter(
    prefix="/events",
    tags=["events"]
)


@router.post("/", response_model=schemas.EventResponse)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    db_event = models.Event(
        title=event.title,
        description=event.description,
        event_type=event.event_type.value,
        start_time=event.start_time,
        end_time=event.end_time,
        date=event.date,
        days=event.days,
        start_date=event.start_date,
        end_date=event.end_date,
        late_threshold=event.late_threshold,
        status=event.status,
        created_by=event.created_by
    )

    try:
        db.add(db_event)
        db.flush()  # Get ID without committing so validation failure can rollback everything

        if event.participants:
            for j_id in event.participants:
                check_participant_overlap(db, j_id, db_event)
                ep = models.EventParticipant(event_id=db_event.id, jamaah_id=j_id)
                db.add(ep)

        db.commit()
        db.refresh(db_event)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Event dengan nama ini mungkin sudah ada atau terjadi kesalahan integritas data/duplikat jamaah."
        )
    except HTTPException as http_exc:
        db.rollback()
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    # return simple response
    return db_event


@router.get("/", response_model=schemas.EventListResponse)
def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Event)
    if status:
        query = query.filter(models.Event.status == status)

    total = query.count()
    events = query.order_by(models.Event.created_at.desc()).offset(skip).limit(limit).all()

    # attach participant count (simple query)
    for e in events:
        e.participants_count = db.query(models.EventParticipant).filter(
            models.EventParticipant.event_id == e.id
        ).count()

    return {"data": events, "total": total, "skip": skip, "limit": limit}


@router.get("/{event_id}", response_model=schemas.EventDetailResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    participants = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id
    ).all()

    # enrich participant details
    part_resp = []
    for p in participants:
        jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == p.jamaah_id).first()
        part_resp.append({
            "id": p.id,
            "event_id": p.event_id,
            "jamaah_id": p.jamaah_id,
            "added_at": p.added_at,
            "nama_jamaah": jamaah.nama if jamaah else "Unknown",
            "foto_profil_url": jamaah.foto_profil_url if jamaah else None
        })

    # Get History
    attendance = db.query(models.AttendanceLog).filter(
        models.AttendanceLog.event_id == event_id
    ).order_by(models.AttendanceLog.scan_time.asc()).all()

    history_dict = {}
    for att in attendance:
        jamaah = db.query(models.Jamaah).filter(models.Jamaah.id == att.jamaah_id).first()
        dt_str = att.scan_time.date().isoformat()
        if dt_str not in history_dict:
            history_dict[dt_str] = []
        history_dict[dt_str].append({
            "id": att.jamaah_id,  # Can use jamaah_id as ref
            "name": jamaah.nama if jamaah else "Unknown",
            "status": _get_event_history_status(att.scan_time, db_event.start_time, db_event.late_threshold),
            "timestamp": att.scan_time.strftime("%H:%M:%S")
        })

    history = []
    for date_key, records in history_dict.items():
        history.append({
            "date": date_key,
            "records": records
        })

    # Needs dict to pass
    db_event_dict = {
        "id": db_event.id,
        "title": db_event.title,
        "description": db_event.description,
        "event_type": schemas.EventType(db_event.event_type),
        "start_time": db_event.start_time,
        "end_time": db_event.end_time,
        "date": db_event.date,
        "days": db_event.days,
        "start_date": db_event.start_date,
        "end_date": db_event.end_date,
        "late_threshold": db_event.late_threshold,
        "status": db_event.status,
        "created_by": db_event.created_by,
        "created_at": db_event.created_at,
        "updated_at": db_event.updated_at,
        "participants_count": len(participants),
        "participants": part_resp,
        "history": history
    }

    return db_event_dict


@router.put("/{event_id}", response_model=schemas.EventResponse)
def update_event(event_id: int, event_update: schemas.EventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_update.dict(exclude_unset=True)
    if 'event_type' in update_data and update_data['event_type']:
        update_data['event_type'] = update_data['event_type'].value

    # extract participants info if updating
    part_list = update_data.pop('participants', None)

    # Ensure resulting end_time is never earlier than resulting start_time
    final_start_time = update_data.get('start_time', db_event.start_time)
    final_end_time = update_data.get('end_time', db_event.end_time)
    if final_start_time and final_end_time and _time_to_minutes(final_end_time) < _time_to_minutes(final_start_time):
        raise HTTPException(status_code=422, detail="end_time tidak boleh lebih awal dari start_time")

    try:
        for key, value in update_data.items():
            setattr(db_event, key, value)

        db.flush()  # Update event but don't commit yet to maintain atomicity

        # If participants is provided, replace entire participations
        if part_list is not None:
            db.query(models.EventParticipant).filter(
                models.EventParticipant.event_id == event_id
            ).delete()
            for j_id in part_list:
                check_participant_overlap(db, j_id, db_event, ignore_event_id=db_event.id)
                ep = models.EventParticipant(event_id=db_event.id, jamaah_id=j_id)
                db.add(ep)

        db.commit()
        db.refresh(db_event)
    except HTTPException as http_exc:
        db.rollback()
        raise http_exc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return db_event


@router.post("/{event_id}/participants", response_model=schemas.SuccessResponse)
def add_participants(event_id: int, p_ids: List[str], db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    added_count = 0
    for j_id in p_ids:
        # Check if already in event
        exists = db.query(models.EventParticipant).filter(
            models.EventParticipant.event_id == event_id,
            models.EventParticipant.jamaah_id == j_id
        ).first()

        if not exists:
            check_participant_overlap(db, j_id, db_event, ignore_event_id=event_id)
            ep = models.EventParticipant(event_id=event_id, jamaah_id=j_id)
            db.add(ep)
            added_count += 1

    db.commit()
    return {"success": True, "message": f"Berhasil menambahkan {added_count} partisipan"}


@router.delete("/{event_id}", response_model=schemas.SuccessResponse)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Delete related participants first (if DB doesn't cascade automatically based on dialect)
    db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id
    ).delete()

    # Delete the main event
    db.delete(db_event)
    db.commit()

    return {"success": True, "message": "Event berhasil dihapus"}


@router.delete("/{event_id}/participants/{jamaah_id}", response_model=schemas.SuccessResponse)
def remove_participant(event_id: int, jamaah_id: str, db: Session = Depends(get_db)):
    ep = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.jamaah_id == jamaah_id
    ).first()

    if not ep:
        raise HTTPException(status_code=404, detail="Partisipan tidak ditemukan di event ini")

    db.delete(ep)
    db.commit()
    return {"success": True, "message": "Partisipan berhasil dihapus"}
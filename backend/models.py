from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Text,
    ForeignKey,
    Boolean,
    Index,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# ==========================================================
# ACTIVITY LOG (SECURITY TRACKING)
# ==========================================================
class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=True, index=True)
    action = Column(String(50), nullable=False) # LOGIN_ATTEMPT, CHECK_STATUS_ATTEMPT
    details = Column(Text, nullable=True) # JSON string or text details
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_activity_timestamp", "timestamp"),
        Index("idx_activity_email", "email"),
    )

    def __repr__(self):
        return f"<ActivityLog(action={self.action}, email={self.email})>"


# ==========================================================
# JAMAAH
# ==========================================================
class Jamaah(Base):
    __tablename__ = "jamaah"

    # PIN dari mesin (Primary Key)
    id = Column(String(100), primary_key=True)
    nama = Column(String(100), nullable=False, index=True)

    foto_profil_url = Column(String(500), nullable=True)

    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, onupdate=datetime.utcnow)

    total_kehadiran = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    attendance_logs = relationship(
        "AttendanceLog",
        back_populates="jamaah",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_jamaah_nama", "nama"),
    )

    def __repr__(self):
        return f"<Jamaah(id={self.id}, nama={self.nama})>"


# ==========================================================
# ATTENDANCE LOG
# ==========================================================
class AttendanceLog(Base):
    __tablename__ = "attendance_log"

    id = Column(Integer, primary_key=True, autoincrement=True)

    jamaah_id = Column(
        String(100),
        ForeignKey("jamaah.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Data dari mesin
    scan_time = Column(DateTime, nullable=False, index=True)
    verify_method = Column(Integer, nullable=True)
    status_scan = Column(Integer, nullable=True)
    work_code = Column(String(50), nullable=True)
    photo_url = Column(String(500), nullable=True)

    device_cloud_id = Column(String(100), nullable=True)

    # Data sistem internal
    waktu_sholat = Column(String(20), nullable=True)
    status_kehadiran = Column(String(20), nullable=True)
    
    event_id = Column(
        Integer,
        ForeignKey("events.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    raw_payload = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    jamaah = relationship("Jamaah", back_populates="attendance_logs")
    event = relationship("Event", back_populates="attendance_logs")

    __table_args__ = (
        Index("idx_attendance_scan_time", "scan_time"),
        Index("idx_attendance_jamaah_scan", "jamaah_id", "scan_time"),
        Index("idx_attendance_sholat_scan", "waktu_sholat", "scan_time"),
    )

    def __repr__(self):
        return (
            f"<AttendanceLog(jamaah={self.jamaah_id}, "
            f"sholat={self.waktu_sholat}, status={self.status_kehadiran})>"
        )

# ==========================================================
# CUSTOM EVENT
# ==========================================================
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    # Type: 'one-time', 'recurring', 'rentang'
    event_type = Column(String(50), nullable=False, index=True)
    
    # Time settings (HH:MM)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    
    # Date settings depending on type
    date = Column(Date, nullable=True) # For one-time
    days = Column(String(200), nullable=True) # Comma separated list of days for recurring e.g "Senin,Jumat"
    start_date = Column(Date, nullable=True) # For rentang
    end_date = Column(Date, nullable=True) # For rentang
    
    late_threshold = Column(Integer, default=15) # minutes
    status = Column(String(50), default="active", index=True)
    
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    participants = relationship(
        "EventParticipant",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    
    attendance_logs = relationship(
        "AttendanceLog",
        back_populates="event"
    )

    def __repr__(self):
        return f"<Event(id={self.id}, title={self.title}, type={self.event_type})>"


class EventParticipant(Base):
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    jamaah_id = Column(String(100), ForeignKey("jamaah.id", ondelete="CASCADE"), nullable=False, index=True)
    
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="participants")
    jamaah = relationship("Jamaah")

    __table_args__ = (
        # Ensure a jamaah cannot be added multiple times to the same event
        Index("idx_unique_event_jamaah", "event_id", "jamaah_id", unique=True),
    )

    def __repr__(self):
        return f"<EventParticipant(event_id={self.event_id}, jamaah_id={self.jamaah_id})>"


# ==========================================================
# WEBHOOK LOG (RAW AUDIT LOG)
# ==========================================================
class WebhookLog(Base):
    __tablename__ = "webhook_log"

    id = Column(Integer, primary_key=True, autoincrement=True)

    webhook_type = Column(String(50), nullable=False, index=True)
    cloud_id = Column(String(100), nullable=True, index=True)

    raw_payload = Column(Text, nullable=False)

    processed = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)

    processing_time_ms = Column(Integer, nullable=True)
    jamaah_created = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_webhook_created_at", "created_at"),
        Index("idx_webhook_processed_created", "processed", "created_at"),
    )

    def __repr__(self):
        return f"<WebhookLog(type={self.webhook_type}, processed={self.processed})>"


# ==========================================================
# PRAYER TIME CACHE
# ==========================================================
class PrayerTimeCache(Base):
    __tablename__ = "prayer_time_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)

    date = Column(String(10), nullable=False, unique=True, index=True)

    subuh = Column(String(5), nullable=False)
    syuruq = Column(String(5), nullable=False)
    dzuhur = Column(String(5), nullable=False)
    ashar = Column(String(5), nullable=False)
    maghrib = Column(String(5), nullable=False)
    isya = Column(String(5), nullable=False)

    lokasi = Column(String(100), nullable=False)
    source = Column(String(20), nullable=False)

    cached_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    def __repr__(self):
        return f"<PrayerTimeCache(date={self.date}, source={self.source})>"


# ==========================================================
# AUTHORIZATION MODELS
# ==========================================================
class WhitelistUser(Base):
    __tablename__ = "whitelist_users"

    email = Column(String(100), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    # phone_number removed as per requirement

    def __repr__(self):
        return f"<WhitelistUser(email={self.email})>"


class User(Base):
    __tablename__ = "users"

    id = Column(String(100), primary_key=True)  # Firebase UID
    email = Column(String(100), nullable=True)
    role = Column(String(20), nullable=False)  # king_admin / pengurus
    name = Column(String(100), nullable=True)
    photo_url = Column(String(500), nullable=True)
    last_password_change = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, role={self.role})>"


class RamadhanSettings(Base):
    __tablename__ = "ramadhan_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ramadhan_mode = Column(Boolean, nullable=False, default=False)
    ramadhan_start_date = Column(Date, nullable=True)
    ramadhan_end_date = Column(Date, nullable=True)
    ramadhan_activated_at = Column(DateTime(timezone=True), nullable=True)
    updated_by_user_id = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return (
            f"<RamadhanSettings(mode={self.ramadhan_mode}, "
            f"start={self.ramadhan_start_date}, end={self.ramadhan_end_date})>"
        )

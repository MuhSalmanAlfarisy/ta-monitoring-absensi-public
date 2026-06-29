from pydantic import BaseModel, Field, validator, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date as date_type
from enum import Enum
import re

# ======================
# ENUMS (Untuk pilihan tetap)
# ======================
class VerifyMethod(str, Enum):
    FINGERPRINT = "1"
    PASSWORD = "2"
    CARD = "3"
    FACE = "4"
    VEIN = "6"
    QRCODE = "7"

class ScanStatus(str, Enum):
    SCAN_IN = "0"
    SCAN_OUT = "1"
    BREAK_IN = "2"
    BREAK_OUT = "3"
    OVERTIME_IN = "4"
    OVERTIME_OUT = "5"
    MEETING_IN = "6"
    MEETING_OUT = "7"
    CUSTOM_1 = "8"
    CUSTOM_2 = "9"

class WaktuSholat(str, Enum):
    SUBUH = "Subuh"
    SYURUQ = "Syuruq"
    DZUHUR = "Dzuhur"
    ASHAR = "Ashar"
    MAGHRIB = "Maghrib"
    ISYA = "Isya"
    TARAWIH = "Tarawih"
    DI_LUAR_WAKTU = "Di Luar Waktu Sholat"

class StatusKehadiran(str, Enum):
    TEPAT_WAKTU = "TEPAT_WAKTU"
    TERLAMBAT = "TERLAMBAT"
    DI_LUAR_WAKTU_SHOLAT = "DI_LUAR_WAKTU_SHOLAT"

class PeriodFilter(str, Enum):
    HARI_INI = "hari-ini"
    PEKAN_INI = "pekan-ini"
    BULAN_INI = "bulan-ini"
    TAHUN_INI = "tahun-ini"
    ALL_TIME = "all-time"
    RAMADHAN = "ramadhan"

class EventType(str, Enum):
    ONE_TIME = "one-time"
    RECURRING = "recurring"
    RENTANG = "rentang"

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


# ======================
# SECURITY & LOGGING SCHEMAS
# ======================
class ActivityLogCreate(BaseModel):
    email: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ActivityLogResponse(BaseModel):
    id: int
    email: Optional[str]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class WhitelistHistoryResponse(BaseModel):
    email: str
    status: str
    uid: Optional[str] = None
    created_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ======================
# WEBHOOK SCHEMAS
# ======================
class AttlogData(BaseModel):
    """Data attlog dari mesin fingerprint"""
    pin: str = Field(..., description="Nama jamaah (PIN dari mesin)")
    scan: str = Field(..., description="Waktu scan format: YYYY-MM-DD HH:MM")
    verify: Optional[int] = Field(None, description="Metode verifikasi: 1=Fingerprint, 2=Password, dll")
    status_scan: Optional[int] = Field(None, description="Status scan: 0=Scan In, 1=Scan Out, dll")
    work_code: Optional[str] = Field(None, description="Kode kerja (jika ada)")
    photo_url: Optional[str] = Field(None, description="URL foto bukti absensi")

    @validator('scan')
    def validate_scan_format(cls, v):
        """Validasi format waktu scan"""
        try:
            datetime.strptime(v, "%Y-%m-%d %H:%M")
            return v
        except ValueError:
            raise ValueError("Format scan harus 'YYYY-MM-DD HH:MM'")

class WebhookPayload(BaseModel):
    """Payload webhook dari mesin absensi"""
    type: str = Field(..., description="Tipe webhook: 'attlog'")
    cloud_id: str = Field(..., description="Cloud ID mesin")
    data: AttlogData

    @validator('type')
    def validate_type(cls, v):
        if v != "attlog":
            raise ValueError("Type harus 'attlog'")
        return v

class WebhookResponse(BaseModel):
    """Response untuk webhook"""
    status: str
    message: str
    jamaah_status: str  # "new" atau "existing"
    data: Dict[str, Any]


# ======================
# JAMAAH SCHEMAS
# ======================
class JamaahBase(BaseModel):
    """Base schema untuk Jamaah"""
    id: str = Field(..., description="PIN/Nama jamaah (primary key)")
    nama: str = Field(..., description="Nama lengkap jamaah")
    foto_profil_url: Optional[str] = Field(None, description="URL foto profil")

class JamaahCreate(JamaahBase):
    """Schema untuk create jamaah (otomatis via webhook)"""
    pass

class JamaahResponse(JamaahBase):
    """Response schema untuk Jamaah"""
    total_kehadiran: int
    first_seen_at: Optional[datetime]
    last_seen_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class JamaahDetailResponse(JamaahResponse):
    """Detail response dengan statistik"""
    statistics: Dict[str, Any]
    recent_attendance: List[Dict[str, Any]]

class JamaahListResponse(BaseModel):
    """Response untuk list jamaah dengan pagination"""
    data: List[JamaahResponse]
    total: int
    skip: int
    limit: int
    has_more: Optional[bool] = False

class JamaahDeleteResponse(BaseModel):
    """Response setelah delete jamaah"""
    success: bool
    message: str
    warning: Optional[str]
    note: Optional[str]
    deleted_data: Optional[Dict[str, Any]]


# ======================
# ATTENDANCE SCHEMAS
# ======================
class AttendanceLogBase(BaseModel):
    """Base schema untuk AttendanceLog"""
    jamaah_id: str = Field(..., description="ID jamaah (PIN)")
    scan_time: datetime = Field(..., description="Waktu scan")
    waktu_sholat: Optional[WaktuSholat]
    status_kehadiran: Optional[StatusKehadiran]
    event_id: Optional[int] = None
    photo_url: Optional[str]

class AttendanceLogResponse(AttendanceLogBase):
    """Response schema untuk AttendanceLog"""
    id: int
    verify_method: Optional[int]
    status_scan: Optional[int]
    work_code: Optional[str]
    device_cloud_id: Optional[str]
    created_at: datetime
    nama_jamaah: Optional[str] = None
    foto_profil_jamaah: Optional[str] = None
    hari: Optional[str] = None
    waktu: Optional[str] = None
    tanggal_format: Optional[str] = None
    event_title: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceLogListResponse(BaseModel):
    """Response untuk list attendance logs dengan pagination"""
    data: List[AttendanceLogResponse]
    pagination: Dict[str, Any]
    filters: Dict[str, Any]

class AttendanceStatsResponse(BaseModel):
    """Response untuk statistik absensi"""
    total_absensi: int
    tepat_waktu: int
    terlambat: int
    per_sholat: Dict[str, int]
    per_hari: Dict[str, int]
    per_jam: Dict[str, int]
    persentase_tepat_waktu: Optional[float]
    persentase_terlambat: Optional[float]


# ======================
# PRAYER TIMES SCHEMAS
# ======================
class PrayerTimeResponse(BaseModel):
    """Response untuk jadwal sholat"""
    subuh: str
    syuruq: str
    dzuhur: str
    ashar: str
    maghrib: str
    isya: str
    date: str
    lokasi: str
    source: Optional[str] = "myquran"
    cached_at: Optional[str]
    cache_duration: Optional[int]

class PrayerTimeStatusResponse(BaseModel):
    """Response untuk status service prayer times"""
    status: str
    timestamp: str
    environment: str
    cache: Dict[str, Any]
    apis: Dict[str, Any]
    config: Dict[str, Any]


# ======================
# DASHBOARD & ANALYTICS
# ======================
class DashboardStatsResponse(BaseModel):
    """Response untuk dashboard stats"""
    total_jamaah: int
    kehadiran_hari_ini: int
    tepat_waktu_hari_ini: str  # Persentase
    rata_rata_mingguan: str    # Persentase

class ChartDataResponse(BaseModel):
    """Response untuk chart data"""
    waktu: str
    jamaah: int

class WeeklyStatsResponse(BaseModel):
    """Response untuk weekly stats"""
    day: str
    date: str
    kehadiran: int
    persentase: float
    target: int


# Shared helpers for time validation (24-hour HH:MM)
TIME_HHMM_PATTERN = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")

def _time_to_minutes(value: str) -> int:
    hours, minutes = map(int, value.split(":"))
    return (hours * 60) + minutes


# ======================
# EVENT SCHEMAS
# ======================
class EventParticipantCreate(BaseModel):
    jamaah_id: str = Field(..., description="ID jamaah (PIN)")

class EventParticipantResponse(BaseModel):
    id: int
    event_id: int
    jamaah_id: str
    added_at: datetime
    nama_jamaah: Optional[str] = None
    foto_profil_url: Optional[str] = None

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    event_type: EventType
    start_time: str = Field(..., description="Waktu mulai (HH:MM)")
    end_time: str = Field(..., description="Waktu selesai (HH:MM)")
    date: Optional[date_type] = None
    days: Optional[str] = None  # Comma separated. "Senin,Sabtu"
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    late_threshold: int = Field(15, description="Batas toleransi terlambat (menit)")
    status: str = Field("active", description="Status event (active, inactive, completed)")

    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        if not isinstance(v, str) or not TIME_HHMM_PATTERN.fullmatch(v):
            raise ValueError("Format waktu harus HH:MM dengan menit 00-59")
        return v

    @field_validator('date', 'start_date', 'end_date', mode='before')
    @classmethod
    def empty_date_to_none(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ''):
            return None
        return v

    @field_validator('days', 'description', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if isinstance(v, str) and v.strip() == '':
            return None
        return v

    @model_validator(mode='after')
    def validate_time_order(self):
        if _time_to_minutes(self.end_time) < _time_to_minutes(self.start_time):
            raise ValueError("end_time tidak boleh lebih awal dari start_time")
        return self

class EventCreate(EventBase):
    created_by: Optional[str] = None
    participants: Optional[List[str]] = Field(default_factory=list, description="Daftar jamaah_id")

    @field_validator('created_by', mode='before')
    @classmethod
    def empty_created_by_to_none(cls, v):
        if isinstance(v, str) and v.strip() == '':
            return None
        return v

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    date: Optional[date_type] = None
    days: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    late_threshold: Optional[int] = None
    status: Optional[str] = None
    participants: Optional[List[str]] = None

    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_optional_time_format(cls, v):
        if v is None:
            return v
        if not isinstance(v, str) or not TIME_HHMM_PATTERN.fullmatch(v):
            raise ValueError("Format waktu harus HH:MM dengan menit 00-59")
        return v

    @model_validator(mode='after')
    def validate_optional_time_order(self):
        if self.start_time is not None and self.end_time is not None:
            if _time_to_minutes(self.end_time) < _time_to_minutes(self.start_time):
                raise ValueError("end_time tidak boleh lebih awal dari start_time")
        return self

class EventResponse(EventBase):
    id: int
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    participants_count: Optional[int] = 0

    class Config:
        from_attributes = True

class EventDetailResponse(EventResponse):
    participants: List[EventParticipantResponse] = Field(default_factory=list)
    history: Optional[List[Dict[str, Any]]] = None

class EventListResponse(BaseModel):
    data: List[EventResponse]
    total: int
    skip: int
    limit: int


# ======================
# STATISTICS SCHEMAS
# ======================
class TopJamaahResponse(BaseModel):
    """Response untuk top jamaah"""
    id: str
    nama: str
    kehadiran: int
    persentase: float

class SholatDistributionResponse(BaseModel):
    """Response untuk distribusi sholat"""
    kategori: str
    nilai: int
    color: str
    persentase: float

class MonthlyTrendResponse(BaseModel):
    """Response untuk monthly trend"""
    bulan: str
    tahun: int
    bulan_angka: int
    kehadiran: int
    unique_jamaah: int
    avg_per_jamaah: float
    target: int

class PeakHoursResponse(BaseModel):
    """Response untuk peak hours"""
    jam: str
    jam_angka: int
    jamaah: int
    persentase_dari_total: float

class StatusKehadiranResponse(BaseModel):
    """Response untuk status kehadiran"""
    status: str
    count: int
    persentase: float

class SholatTrendResponse(BaseModel):
    """Response untuk sholat trend"""
    waktu: str
    minggu1: int
    minggu2: int
    minggu3: int
    minggu4: int
    total: int
    rata_rata: float

class StatisticsSummaryResponse(BaseModel):
    """Response untuk statistics summary"""
    overall_stats: Dict[str, Any]
    top_jamaah: List[TopJamaahResponse]
    distribusi_sholat: List[SholatDistributionResponse]
    monthly_trend: List[MonthlyTrendResponse]
    peak_hours: List[PeakHoursResponse]
    status_kehadiran: List[StatusKehadiranResponse]
    sholat_trend: List[SholatTrendResponse]
    period_info: Dict[str, Any]

class LeaderboardResponse(BaseModel):
    """Response untuk leaderboard"""
    rank: int
    id: str
    nama: str
    foto_profil_url: Optional[str]
    total_hadir: int
    tepat_waktu: int
    terlambat: int
    persentase_tepat_waktu: float
    avg_per_hari: float

class AttendanceTrendResponse(BaseModel):
    """Response untuk attendance trend"""
    period: str
    period_date: str
    total: int
    unique_jamaah: int
    tepat_waktu: int
    terlambat: int
    persentase_tepat_waktu: float

class PunctualityAnalysisResponse(BaseModel):
    """Response untuk punctuality analysis"""
    waktu_sholat: str
    total: int
    tepat_waktu: int
    terlambat: int
    persentase_tepat_waktu: float
    persentase_terlambat: float
    rata_rata_waktu_scan: str
    rata_rata_menit: int

class QuickStatsResponse(BaseModel):
    """Response untuk quick stats"""
    today: Dict[str, Any]
    this_week: Dict[str, Any]
    this_month: Dict[str, Any]
    all_time: Dict[str, Any]
    updated_at: str


# ======================
# SYSTEM & MONITORING SCHEMAS
# ======================
class HealthCheckResponse(BaseModel):
    """Response untuk health check"""
    status: str
    service: str
    timestamp: str
    environment: str
    debug: bool
    timezone: str
    database: str

class DatabaseStatusResponse(BaseModel):
    """Response untuk database status"""
    status: str
    version: str
    error: Optional[str]
    connection: str

class CacheStatusResponse(BaseModel):
    """Response untuk cache status"""
    status: str
    type: str

class ActivityStatusResponse(BaseModel):
    """Response untuk activity status"""
    last_activity: Optional[str]
    is_online: bool
    last_log_id: Optional[int]
    last_webhook_id: Optional[int]

class SystemResourcesResponse(BaseModel):
    """Response untuk system resources"""
    cpu: Dict[str, Any]
    memory: Dict[str, Any]
    disk: Dict[str, Any]
    process: Dict[str, Any]
    timestamp: str

class SystemStatusResponse(BaseModel):
    """Response untuk system status"""
    status: str
    version: str
    environment: str
    uptime_seconds: float
    database: DatabaseStatusResponse
    cache: CacheStatusResponse
    activity: ActivityStatusResponse
    resources: SystemResourcesResponse
    statistics: Dict[str, Any]
    timestamp: str
    response_time_ms: int

class WebhookMetricsResponse(BaseModel):
    """Response untuk webhook metrics"""
    timestamp: str
    total_requests: int
    successful: int
    errors: int
    success_rate: float
    new_jamaah_created: int

class AttendanceMetricsResponse(BaseModel):
    """Response untuk attendance metrics"""
    timestamp: str
    total_attendance: int
    unique_jamaah: int
    avg_per_jamaah: float
    avg_processing_delay_seconds: float

class ErrorMetricsResponse(BaseModel):
    """Response untuk error metrics"""
    error: str
    count: int
    last_occurrence: Optional[str]

class SystemMetricsResponse(BaseModel):
    """Response untuk system metrics"""
    time_range: Dict[str, Any]
    webhook_metrics: List[WebhookMetricsResponse]
    attendance_metrics: List[AttendanceMetricsResponse]
    error_metrics: Dict[str, Any]
    current_resources: SystemResourcesResponse
    summary: Dict[str, Any]

# --- Settings / Device monitoring schemas (merged from settings_schemas.py) ---

class DeviceStatusResponse(BaseModel):
    """Response untuk device status"""
    device_id: Optional[str]
    device_name: str
    is_online: bool
    last_heartbeat: Optional[datetime]
    firmware: str

class SystemLogItem(BaseModel):
    """Item log sistem per webhook event"""
    id: int
    timestamp: datetime
    status: str
    records: int
    type: str

class DailyLogSummary(BaseModel):
    """Ringkasan log harian dikelompokkan per waktu sholat"""
    date: str
    total: int
    successful: int
    failed: int
    outside_prayer_count: int
    latest_timestamp: Optional[datetime]
    prayer_counts: Dict[str, int]

class SystemLogsResponse(BaseModel):
    """Response untuk GET /api/settings/logs"""
    logs: List[SystemLogItem]
    daily_summaries: List[DailyLogSummary]

class OutsideWindowLogItem(BaseModel):
    """Item log absensi di luar waktu sholat"""
    id: int
    nama_jamaah: str
    scan_time: Optional[datetime]
    photo_url: Optional[str]

class OutsideWindowLogListResponse(BaseModel):
    """Response untuk GET /api/settings/outside-window-logs"""
    data: List[OutsideWindowLogItem]
    pagination: Dict[str, object]

class MaintenanceResponse(BaseModel):
    """Response untuk maintenance operations"""
    success: bool
    message: str
    timestamp: str
    deleted_webhook_logs: Optional[int] = None
    cutoff_date: Optional[str] = None

class SystemInfoResponse(BaseModel):
    """Response untuk system info"""
    application: Dict[str, Any]
    server: Dict[str, Any]
    database: Dict[str, Any]
    apis: Dict[str, Any]
    system: SystemResourcesResponse
    timestamp: str


# ======================
# QUERY PARAMETERS
# ======================
class PaginationParams(BaseModel):
    """Parameters untuk pagination"""
    skip: int = Field(0, ge=0, description="Jumlah data yang akan dilewati")
    limit: int = Field(100, ge=1, le=500, description="Jumlah data per halaman")

class DateRangeParams(BaseModel):
    """Parameters untuk filter tanggal"""
    start_date: Optional[date_type] = Field(None, description="Tanggal mulai (YYYY-MM-DD)")
    end_date: Optional[date_type] = Field(None, description="Tanggal akhir (YYYY-MM-DD)")

    @validator('end_date')
    def validate_date_range(cls, v, values):
        if v and values.get('start_date') and v < values['start_date']:
            raise ValueError("end_date harus setelah start_date")
        return v

class JamaahFilterParams(PaginationParams):
    """Filter untuk jamaah"""
    search: Optional[str] = Field(None, description="Search by nama")
    sort_by: str = Field("last_seen", description="Sort by: 'name', 'last_seen', 'total_attendance'")
    sort_order: SortOrder = Field(SortOrder.DESC, description="Sort order: 'asc' or 'desc'")

class AttendanceFilterParams(PaginationParams, DateRangeParams):
    """Filter untuk attendance logs"""
    jamaah_id: Optional[str] = Field(None, description="Filter by jamaah ID")
    waktu_sholat: Optional[WaktuSholat] = Field(None, description="Filter by waktu sholat")
    status_kehadiran: Optional[StatusKehadiran] = Field(None, description="Filter by status")
    search: Optional[str] = Field(None, description="Search by nama jamaah")
    sort_by: str = Field("scan_time", description="Sort by: 'scan_time', 'jamaah_name', 'waktu_sholat'")
    sort_order: SortOrder = Field(SortOrder.DESC, description="Sort order: 'asc' or 'desc'")

class StatisticsFilterParams(BaseModel):
    """Filter untuk statistics"""
    period: PeriodFilter = Field(PeriodFilter.BULAN_INI, description="Periode filter")
    limit: int = Field(50, ge=1, le=100, description="Limit untuk leaderboard")

class MetricsFilterParams(BaseModel):
    """Filter untuk metrics"""
    time_range: str = Field("1h", description="Time range: '1h', '24h', '7d'")
    log_type: str = Field("all", description="Log type: 'all', 'error', 'webhook', 'processed', 'unprocessed'")


# ======================
# MISC RESPONSES
# ======================
class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class ErrorResponse(BaseModel):
    """Generic error response"""
    error: str
    detail: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class TestWebhookResponse(BaseModel):
    """Response untuk test webhook"""
    message: str
    endpoints: Dict[str, str]
    test_payload: Dict[str, Any]
    timestamp: str
/**
 * DATA TYPES
 * Based on Fingerspot payload contract
 */

// Raw payload from Fingerspot device
export interface FingerspotPayload {
  type: 'attlog';
  cloud_id: string;
  data: {
    pin: string;        // Nama jamaah (NOT ID!)
    scan: string;       // Format: YYYY-MM-DD HH:MM
    verify: string;     // Ignored
    status_scan: string; // Ignored
  };
}

// Waktu sholat type
export type WaktuSholatName = 'Subuh' | 'Syuruq' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya' | 'Tarawih';

export interface WaktuSholat {
  name: WaktuSholatName;
  time: string; // Format: HH:MM
}

// Filter options
export interface FilterOptions {
  tanggal?: string;       // Single date (YYYY-MM-DD)
  tanggalMulai?: string;  // Date range start
  tanggalAkhir?: string;  // Date range end
  waktuSholat?: WaktuSholatName | 'semua';
  status?: 'tepat-waktu' | 'terlambat' | 'semua';
}

// Statistics summary
export interface StatistikSummary {
  totalJamaah: number;
  totalKehadiran: number;
  totalTepatWaktu: number;
  totalTerlambat: number;
  persentaseTepatWaktu: number;
  jamaahAktifHariIni: number;
}

// Navigation
export type PageType =
  | 'dashboard'
  | 'jamaah'
  | 'leaderboard'
  | 'riwayat'
  | 'laporan'
  | 'profil'
  | 'profil'
  | 'admin'
  | 'pengaturan'
  | 'custom';

// ======================
// API RESPONSE TYPES
// ======================

export interface PaginationMeta {
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface AttendanceLogResponse {
  jamaah_id: string;
  scan_time: string; // ISO String
  waktu_sholat: WaktuSholatName | null;
  status_kehadiran: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'DI_LUAR_WAKTU_SHOLAT' | null;
  photo_url: string | null;
  id: number;
  verify_method: number | null;
  status_scan: number | null;
  work_code: string | null;
  device_cloud_id: string | null;
  created_at: string;
  nama_jamaah?: string;
  foto_profil_jamaah?: string;
  hari?: string;
  waktu?: string;
  tanggal_format?: string;
  event_title?: string;
}

export interface AttendanceListResponse {
  data: AttendanceLogResponse[];
  pagination: PaginationMeta;
  filters: {
    start_date: string | null;
    end_date: string | null;
    waktu_sholat: string | null;
    status_kehadiran: string | null;
    sort_by: string;
    sort_order: string;
  };
}

export interface JamaahStatistics {
  total_absensi: number;
  bulan_ini: number;
  minggu_ini: number;
  tepat_waktu: number;
  terlambat: number;
  per_sholat: Record<string, number>;
  persentase_tepat_waktu: number;
  rata_per_hari: number;
}

export interface JamaahDetailResponse {
  id: string;
  nama: string;
  foto_profil_url: string | null;
  total_kehadiran: number;
  first_seen: string | null;
  last_seen: string | null;
  statistics: JamaahStatistics;
  recent_attendance: AttendanceLogResponse[];
}

export interface JamaahResponse {
  id: string;
  nama: string;
  foto_profil_url: string | null;
  total_kehadiran: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface JamaahListResponse {
  data: JamaahResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface JamaahDeleteResponse {
  success: boolean;
  message: string;
  warning?: string;
  note?: string;
  deleted_data?: {
    jamaah_id: string;
    nama: string;
    total_kehadiran: number;
    kehadiran_terakhir: string | null;
  };
}

export interface LeaderboardItem {
  rank: number;
  id: string;
  nama: string;
  foto_profil_url: string | null;
  total_hadir: number;
  tepat_waktu: number;
  terlambat: number;
  persentase_tepat_waktu: number;
  avg_per_hari: number;
}

export type LeaderboardListResponse = LeaderboardItem[];

// ======================
// DASHBOARD TYPES
// ======================

export interface QuickStatsResponse {
  today: {
    total: number;
    unique_jamaah: number;
    tepat_waktu: number;
    terlambat: number;
    daily_change: number;
    daily_change_percent: number;
    persentase_tepat_waktu: number;
  };
  this_week: {
    total: number;
    unique_jamaah: number;
    avg_per_day: number;
  };
  this_month: {
    total: number;
    unique_jamaah: number;
    avg_per_day: number;
  };
  all_time: {
    total_jamaah: number;
    total_attendance: number;
    total_with_photos: number;
  };
  updated_at: string;
}

export interface DayStat {
  date: string;
  day: string;
  total: number;
  unique_jamaah: number;
  tepat_waktu: number;
  terlambat: number;
  avg_per_jamaah: number;
}

export interface DailyStatsResponse {
  daily_stats: DayStat[];
  summary: {
    total_attendance: number;
    avg_attendance_per_day: number;
  };
}

export interface SholatStat {
  waktu_sholat: string;
  total: number;
  unique_jamaah: number;
  tepat_waktu: number;
  terlambat: number;
  persentase_tepat_waktu: number;
}

export interface SholatStatsResponse {
  sholat_stats: SholatStat[];
  summary: {
    total_attendance: number;
    most_attended: SholatStat | null;
    best_punctuality: SholatStat | null;
  };
}

// ======================
// STATISTICS SUMMARY
// ======================

export interface TopJamaahStat {
  id: string;
  nama: string;
  kehadiran: number;
  persentase: number;
}

export interface DistribusiSholatStat {
  kategori: string;
  nilai: number;
  color: string;
  persentase: number;
}

export interface MonthlyTrendStat {
  bulan: string;
  tahun: number;
  bulan_angka: number;
  kehadiran: number;
  unique_jamaah: number;
  avg_per_jamaah: number;
  target: number;
}

export interface PeakHourStat {
  jam: string;
  jam_angka: number;
  jamaah: number;
  persentase_dari_total: number;
}

export interface StatusKehadiranStat {
  status: string;
  count: number;
  persentase: number;
}

export interface SholatTrendStat {
  waktu: string;
  minggu1: number;
  minggu2: number;
  minggu3: number;
  minggu4: number;
  total: number;
  rata_rata: number;
}

export interface StatisticsSummaryResponse {
  overall_stats: {
    total_jamaah: number;
    total_attendance_all_time: number;
    period: string;
    period_filter_applied: boolean;
    attendance_in_period?: number;
    unique_jamaah_in_period?: number;
  };
  top_jamaah: TopJamaahStat[];
  distribusi_sholat: DistribusiSholatStat[];
  monthly_trend: MonthlyTrendStat[];
  peak_hours: PeakHourStat[];
  status_kehadiran: StatusKehadiranStat[];
  sholat_trend: SholatTrendStat[];
  period_info: {
    period: string;
    start_date: string | null;
    end_date: string;
    timestamp: string;
  };
}

// ======================
// SETTINGS
// ======================

export interface DeviceStatusResponse {
  device_id: string;
  device_name: string;
  is_online: boolean;
  last_heartbeat: string | null;
  firmware: string;
}

export interface SystemLogItem {
  id: number;
  timestamp: string;
  status: string;
  records: number;
  type: string;
}

export interface SystemDailyLogSummary {
  date: string;
  total: number;
  successful: number;
  failed: number;
  outside_prayer_count: number;
  latest_timestamp: string | null;
  prayer_counts: Record<string, number>;
}

export interface SystemLogsResponse {
  logs: SystemLogItem[];
  daily_summaries: SystemDailyLogSummary[];
}


export interface OutsideWindowLogItem {
  id: number;
  nama_jamaah: string;
  scan_time: string;
  photo_url: string | null;
}

export interface OutsideWindowLogListResponse {
  data: OutsideWindowLogItem[];
  pagination: PaginationMeta;
}

export interface RamadhanSettingsResponse {
  ramadhan_mode: boolean;
  ramadhan_start_date: string | null;
  ramadhan_end_date: string | null;
  ramadhan_activated_at?: string | null;
  updated_by?: string | null;
  is_ramadhan_active_today: boolean;
  has_tarawih_history?: boolean;
  available_prayers: string[];
}

// ======================
// ADMIN MANAGEMENT
// ======================

export interface WhitelistUser {
  id: string;
  email: string;
  status: 'waiting' | 'active';
  createdAt: string | null;
  activatedAt: string | null;
  uid?: string;
}

export type HistoryFilter = 'all' | 'waiting' | 'active';

// ======================
// CUSTOM EVENT
// ======================

export type CustomEventType = 'recurring' | 'one-time' | 'rentang';

export type CustomEventStatus = 'active' | 'inactive' | 'completed' | 'upcoming';

export interface Participant {
  id: string;
  name: string;
  status?: string;
  foto_profil_url?: string;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  status: 'hadir' | 'telat' | 'tidak hadir';
  timestamp?: string;
}

export interface EventHistory {
  date: string;
  records: ParticipantRecord[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: CustomEventType;
  days?: string[];
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
  status: CustomEventStatus;
  participantCount: number;
  participants: Participant[];
  history?: EventHistory[];
  createdAt: string;
  createdBy: string;
}

export interface EventFormData {
  title: string;
  description: string;
  type: CustomEventType;
  days: string[];
  date: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
  selectedParticipants: JamaahResponse[];
}

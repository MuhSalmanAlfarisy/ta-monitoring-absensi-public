import { AlertCircle, Clock, User } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';
import type { AttendanceLogResponse } from '../../../../lib/types';

type StatusView = {
  label: string;
  bg: string;
  color: string;
  borderColor: string;
  icon: 'tepat' | 'terlambat' | 'di_luar';
};

type AttendanceRecord = AttendanceLogResponse;

interface RiwayatTableRowProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  record: AttendanceRecord;
  index: number;
  page: number;
  limit: number;
  tab: 'sholat' | 'diluar' | 'event';
  canUseOutsideSelection: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  isDeletingSelected: boolean;
  onPressStart: (id: number) => void;
  onPressCancel: () => void;
  onRowClick: (id: number) => void;
  onPhotoClick: (url: string) => void;
  onToggleSelection: (id: number) => void;
  isMobile: boolean;
}

const getPhotoUrl = (url?: string | null): string | undefined => {
  if (url && url.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  return url || undefined;
};

const getStatusView = (
  status: string | null | undefined,
  theme: ReturnType<typeof getThemeColors>
): StatusView => {
  if (status === 'TEPAT_WAKTU') {
    return {
      label: 'Tepat Waktu',
      bg: `${colors.success}15`,
      color: colors.success,
      borderColor: `${colors.success}30`,
      icon: 'tepat',
    };
  }
  if (status === 'DI_LUAR_WAKTU_SHOLAT') {
    return {
      label: 'Di Luar',
      bg: `${theme.text.tertiary}15`,
      color: theme.text.secondary,
      borderColor: `${theme.text.tertiary}30`,
      icon: 'di_luar',
    };
  }
  return {
    label: 'Terlambat',
    bg: `${colors.warning}15`,
    color: colors.warning,
    borderColor: `${colors.warning}30`,
    icon: 'terlambat',
  };
};

const getPrayerBadgeStyle = (waktuSholat?: string | null) => {
  switch (waktuSholat) {
    case 'Subuh':
      return { bg: '#92400E15', border: '#92400E30', color: '#92400E' }; // Coklat
    case 'Dzuhur':
      return { bg: '#0D948815', border: '#0D948830', color: '#0D9488' }; // Tosca
    case 'Ashar':
      return { bg: '#64748B15', border: '#64748B30', color: '#64748B' }; // Silver
    case 'Maghrib':
      return { bg: '#D4AF3715', border: '#D4AF3730', color: '#D4AF37' }; // Emas
    case 'Isya':
      return { bg: '#DB277715', border: '#DB277730', color: '#DB2777' }; // Pink
    case 'Tarawih':
      return { bg: '#8B5CF615', border: '#8B5CF630', color: '#8B5CF6' }; // Ungu
    default:
      return { bg: '#6B728015', border: '#6B728030', color: '#6B7280' };
  }
};

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

const parseAttendanceDateTime = (value?: string | null): Date | null => {
  if (!value) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  const normalizedBase = value.includes(' ') ? value.replace(' ', 'T') : value;
  const normalized = hasTimezone ? normalizedBase : `${normalizedBase}+07:00`;
  const dateObj = new Date(normalized);
  if (Number.isNaN(dateObj.getTime())) return null;
  return dateObj;
};

export function RiwayatTableRow({
  theme,
  isDark,
  record,
  index,
  page,
  limit,
  tab,
  canUseOutsideSelection,
  selectionMode,
  isSelected,
  onPressStart,
  onPressCancel,
  onRowClick,
  onPhotoClick,
  onToggleSelection,
  isMobile,
}: RiwayatTableRowProps) {
  const statusView = getStatusView(record.status_kehadiran, theme);
  const prayerStyle = getPrayerBadgeStyle(record.waktu_sholat);
  const photoUrl = getPhotoUrl(record.photo_url);
  const scanDate = parseAttendanceDateTime(record.scan_time) || parseAttendanceDateTime(record.created_at);
  const displayTime = scanDate
    ? scanDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: JAKARTA_TIMEZONE,
    }).replace(':', '.')
    : (record.waktu ? record.waktu.replace(':', '.') : '-');
  const displayDate = scanDate
    ? scanDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: isMobile ? '2-digit' : 'numeric',
      timeZone: JAKARTA_TIMEZONE,
    })
    : '-';
  const rowBg = isSelected ? `${colors.success}10` : 'transparent';

  return (
    <tr
      onMouseDown={canUseOutsideSelection ? () => onPressStart(record.id) : undefined}
      onMouseUp={canUseOutsideSelection ? onPressCancel : undefined}
      onMouseLeave={canUseOutsideSelection ? onPressCancel : undefined}
      onTouchStart={canUseOutsideSelection ? () => onPressStart(record.id) : undefined}
      onTouchEnd={canUseOutsideSelection ? onPressCancel : undefined}
      onTouchCancel={canUseOutsideSelection ? onPressCancel : undefined}
      onTouchMove={canUseOutsideSelection ? onPressCancel : undefined}
      onContextMenu={canUseOutsideSelection ? (e) => e.preventDefault() : undefined}
      onClick={canUseOutsideSelection ? () => onRowClick(record.id) : undefined}
      className="riwayat-row"
      style={{
        borderBottom: `1px solid ${theme.border}30`,
        backgroundColor: rowBg,
        cursor: canUseOutsideSelection ? 'pointer' : 'default',
        userSelect: canUseOutsideSelection ? 'none' : 'auto',
        transition: 'background-color 0.2s',
      }}
    >
      <td
        style={{
          padding: isMobile ? '8px 6px' : `${spacing.lg} ${spacing.lg}`,
          color: theme.text.tertiary,
          fontSize: isMobile ? '0.7rem' : '0.875rem',
          whiteSpace: 'nowrap',
          textAlign: 'left',
        }}
      >
        {canUseOutsideSelection && selectionMode && isSelected && (
          <span style={{ marginRight: 6, color: colors.success, fontWeight: 700 }}>✓</span>
        )}
        <span style={{ fontFamily: 'monospace' }}>{(page - 1) * limit + index + 1}</span>
      </td>

      {/* Face Column */}
      <td style={{ padding: isMobile ? '8px 6px' : `${spacing.lg} ${spacing.lg}`, whiteSpace: 'nowrap', textAlign: 'left' }}>
        <div
          className="riwayat-avatar"
          style={{
            width: isMobile ? 32 : 44,
            height: isMobile ? 32 : 44,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${theme.border}40`,
            transition: 'all 0.3s',
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (canUseOutsideSelection && selectionMode) {
              onToggleSelection(record.id);
              return;
            }
            if (photoUrl) onPhotoClick(photoUrl);
          }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: isDark ? theme.surfaceHover : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={isMobile ? 14 : 18} color={theme.text.tertiary} />
            </div>
          )}
        </div>
      </td>

      {/* Nama Column */}
      <td style={{ padding: isMobile ? '8px 6px' : `${spacing.lg} ${spacing.lg}`, whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'left' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h4
            style={{
              fontWeight: 700,
              color: theme.text.primary,
              margin: 0,
              fontSize: isMobile ? '0.7rem' : '1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {record.nama_jamaah}
          </h4>
        </div>
      </td>

      <td style={{ padding: isMobile ? '8px 6px' : `${spacing.lg} ${spacing.lg}`, whiteSpace: 'nowrap', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? '3px' : spacing.sm }}>
          <span style={{ fontWeight: 700, color: theme.text.primary, fontFamily: 'monospace', fontSize: isMobile ? '0.65rem' : 'inherit' }}>
            {displayTime}
          </span>
          <span style={{ color: theme.text.tertiary, fontSize: isMobile ? '0.65rem' : 'inherit' }}>•</span>
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.875rem', color: theme.text.secondary }}>
            {displayDate}
          </span>
        </div>
      </td>

      {tab === 'sholat' && (
        <td style={{ padding: isMobile ? '8px 6px' : `${spacing.lg} ${spacing.lg}`, whiteSpace: 'nowrap', textAlign: 'left' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? '2px' : spacing.sm,
              padding: isMobile ? '2px 4px' : '6px 14px',
              background: prayerStyle.bg,
              border: `1px solid ${prayerStyle.border}`,
              borderRadius: borderRadius.md,
              fontSize: isMobile ? '0.6rem' : '0.875rem',
              fontWeight: 600,
              color: prayerStyle.color,
            }}
          >
            {record.waktu_sholat}
          </span>
        </td>
      )}

      <td style={{ padding: isMobile ? '8px 6px' : `${spacing.lg} ${spacing.lg}`, whiteSpace: 'nowrap', textAlign: 'left' }}>
        {tab === 'event' ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? '2px' : '0.375rem',
              padding: isMobile ? '2px 4px' : '0.5rem 1rem',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: borderRadius.md,
              fontSize: isMobile ? '0.6rem' : '0.875rem',
              fontWeight: 700,
              color: '#a78bfa',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {record.event_title || 'Event'}
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? '2px' : '0.375rem',
              padding: isMobile ? '2px 4px' : `${spacing.xs} ${spacing.md}`,
              background: statusView.bg,
              border: `1px solid ${statusView.borderColor}`,
              borderRadius: borderRadius.md,
              fontSize: isMobile ? '0.6rem' : '0.875rem',
              fontWeight: 700,
              color: statusView.color,
              whiteSpace: 'nowrap',
            }}
          >
            {statusView.icon === 'tepat' && (
              <span
                style={{
                  width: isMobile ? 4 : 6,
                  height: isMobile ? 4 : 6,
                  background: colors.success,
                  borderRadius: '50%',
                  animation: 'livePulse 2s infinite',
                }}
              />
            )}
            {statusView.icon === 'di_luar' && <Clock size={isMobile ? 10 : 12} />}
            {statusView.icon === 'terlambat' && <AlertCircle size={isMobile ? 10 : 12} />}
            {isMobile
              ? (statusView.icon === 'di_luar' ? 'Diluar' : statusView.label.split(' ')[0])
              : statusView.label}
          </span>
        )}
      </td>
    </tr>
  );
}

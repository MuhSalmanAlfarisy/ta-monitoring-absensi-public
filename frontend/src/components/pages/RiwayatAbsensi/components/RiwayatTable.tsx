import { RefreshCw } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';
import type { AttendanceLogResponse } from '../../../../lib/types';
import { RiwayatTableRow } from './RiwayatTableRow';

type TabType = 'sholat' | 'diluar' | 'event';
type AttendanceRecord = AttendanceLogResponse;

interface RiwayatTableProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  isMobile: boolean;
  data: AttendanceRecord[];
  loading: boolean;
  tab: TabType;
  page: number;
  limit: number;
  canUseOutsideSelection: boolean;
  selectionMode: boolean;
  selectedOutsideIds: number[];
  isDeletingSelected: boolean;
  onPressStart: (id: number) => void;
  onPressCancel: () => void;
  onRowClick: (id: number) => void;
  onPhotoClick: (url: string) => void;
  onToggleSelection: (id: number) => void;
}

const COLUMNS = {
  sholat: ['No', 'Face', 'Nama', 'Waktu', 'Sholat', 'Status'],
  event: ['No', 'Face', 'Nama', 'Waktu', 'Event'],
  diluar: ['No', 'Face', 'Nama', 'Waktu', 'Status'],
};

export function RiwayatTable({
  theme,
  isDark,
  isMobile,
  data,
  loading,
  tab,
  page,
  limit,
  canUseOutsideSelection,
  selectionMode,
  selectedOutsideIds,
  isDeletingSelected,
  onPressStart,
  onPressCancel,
  onRowClick,
  onPhotoClick,
  onToggleSelection,
}: RiwayatTableProps) {
  const columns = COLUMNS[tab];
  const minWidth = isMobile ? '100%' : tab === 'sholat' ? '900px' : '760px';

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s',
        boxShadow: isDark
          ? '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)'
          : '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
      }}
    >


      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `${theme.background}99`,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <RefreshCw className="animate-spin" size={28} color={colors.success} />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth,
            borderCollapse: 'collapse',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            tableLayout: isMobile ? 'fixed' : 'auto',
          }}
        >
          {isMobile && (
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: tab === 'sholat' ? '22%' : '30%' }} />
              <col style={{ width: '33%' }} />
              {tab === 'sholat' && <col style={{ width: '13%' }} />}
              <col style={{ width: tab === 'sholat' ? '13%' : '18%' }} />
            </colgroup>
          )}
          <thead>
            <tr
              style={{
                background: isDark
                  ? `linear-gradient(90deg, ${colors.primary.main}30 0%, ${colors.primary.main}18 100%)`
                  : `linear-gradient(90deg, ${colors.primary.main}12 0%, ${colors.primary.main}06 100%)`,
                borderBottom: `2px solid ${colors.primary.main}${isDark ? '50' : '30'}`,
              }}
            >
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left' as const,
                    padding: isMobile ? '8px 6px' : `${spacing.md} ${spacing.lg}`,
                    fontSize: isMobile ? '0.65rem' : '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    color: isDark ? colors.primary.light : colors.primary.main,
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: spacing.xl, textAlign: 'center', color: theme.text.secondary, fontSize: '0.95rem' }}
                >
                  {loading ? 'Memuat data...' : 'Tidak ada data'}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <RiwayatTableRow
                  key={record.id}
                  theme={theme}
                  isDark={isDark}
                  record={record}
                  index={index}
                  page={page}
                  limit={limit}
                  tab={tab}
                  canUseOutsideSelection={canUseOutsideSelection}
                  selectionMode={selectionMode}
                  isSelected={canUseOutsideSelection && selectedOutsideIds.includes(record.id)}
                  isDeletingSelected={isDeletingSelected}
                  onPressStart={onPressStart}
                  onPressCancel={onPressCancel}
                  onRowClick={onRowClick}
                  onPhotoClick={onPhotoClick}
                  onToggleSelection={onToggleSelection}
                  isMobile={isMobile}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .riwayat-row:hover { background: ${colors.success}10 !important; }
        .riwayat-row:hover .riwayat-avatar { border-color: ${colors.success} !important; transform: scale(1.1); }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

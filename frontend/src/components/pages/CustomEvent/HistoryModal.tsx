import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
  X, History, Calendar, Clock, ChevronDown, ChevronUp,
  List, LayoutGrid, Search, CheckCircle, AlertCircle, Download,
} from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions } from '../../../lib/theme';
import type { ThemeColors } from '../../../lib/theme';
import type { Event, ParticipantRecord } from '../../../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'grid';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function avatarBg(isHadir: boolean) {
  return isHadir ? colors.success : colors.warning;
}

// ─── RecordRow ────────────────────────────────────────────────────────────────

interface RecordRowProps {
  record: ParticipantRecord;
  theme: ThemeColors;
  variant?: 'default' | 'detailed';
  isDark?: boolean;
}

function RecordRow({ record, theme, variant = 'default', isDark = false }: RecordRowProps) {
  const isHadir = record.status === 'hadir';

  if (variant === 'detailed') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.md} ${spacing.lg}`,
          backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
          borderRadius: borderRadius.xl,
          borderLeft: `4px solid ${isHadir ? colors.success : colors.warning}`,
          gap: spacing.md,
          boxShadow: `0 1px 3px rgba(0,0,0,${isDark ? '0.2' : '0.05'})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          {/* Avatar */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarBg(isHadir)}, ${avatarBg(isHadir)}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#fff',
              boxShadow: `0 2px 8px ${avatarBg(isHadir)}44`,
            }}
          >
            {getInitial(record.name)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: theme.text.primary, fontSize: '1rem' }}>
              {record.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: 3 }}>
              <Clock size={12} color={theme.text.tertiary} />
              <span style={{ fontSize: '0.8125rem', color: theme.text.secondary }}>
                {record.timestamp ?? '-'} WIB
              </span>
            </div>
            {!isHadir && record.timestamp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
                <AlertCircle size={11} color={colors.warning} />
                <span style={{ fontSize: '0.75rem', color: colors.warning, fontWeight: 600 }}>
                  Terlambat
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Badge */}
        <div
          style={{
            padding: `6px ${spacing.md}`,
            borderRadius: borderRadius.full,
            fontSize: '0.8125rem',
            fontWeight: 700,
            background: isHadir
              ? `linear-gradient(135deg, ${colors.success}, ${colors.success}cc)`
              : `linear-gradient(135deg, ${colors.warning}, ${colors.warning}cc)`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexShrink: 0,
            boxShadow: `0 2px 8px ${isHadir ? colors.success : colors.warning}44`,
          }}
        >
          {isHadir
            ? <><CheckCircle size={13} /> Hadir Tepat Waktu</>
            : <><AlertCircle size={13} /> Terlambat</>
          }
        </div>
      </div>
    );
  }

  // Default variant (list view)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: isDark ? `${theme.surface}99` : theme.surface,
        borderRadius: borderRadius.lg,
        border: `1px solid ${theme.border}`,
        transition: transitions.fast,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {/* Avatar */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${avatarBg(isHadir)}, ${avatarBg(isHadir)}cc)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#fff',
            boxShadow: `0 2px 6px ${avatarBg(isHadir)}33`,
          }}
        >
          {getInitial(record.name)}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: theme.text.primary, fontSize: '0.875rem' }}>
            {record.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
            <Clock size={11} color={theme.text.tertiary} />
            <span style={{ fontSize: '0.75rem', color: theme.text.tertiary }}>
              {record.timestamp ?? '-'}
            </span>
          </div>
        </div>
      </div>
      {/* Inline badge */}
      <div
        style={{
          padding: `3px ${spacing.sm}`,
          borderRadius: borderRadius.full,
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: isHadir ? `${colors.success}18` : `${colors.warning}18`,
          color: isHadir ? colors.success : colors.warning,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          border: `1px solid ${isHadir ? colors.success + '30' : colors.warning + '30'}`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: isHadir ? colors.success : colors.warning,
            display: 'inline-block',
          }}
        />
        {isHadir ? 'Hadir' : 'Terlambat'}
      </div>
    </div>
  );
}

// ─── GridDayDetail Modal ──────────────────────────────────────────────────────

interface GridDayDetailProps {
  historyItem: { date: string; records: ParticipantRecord[] } | null;
  theme: ThemeColors;
  isDark: boolean;
  onClose: () => void;
}

function GridDayDetail({ historyItem, theme, isDark, onClose }: GridDayDetailProps) {
  return (
    <AnimatePresence>
      {historyItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: spacing.lg,
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.background,
              borderRadius: borderRadius['2xl'],
              width: '100%',
              maxWidth: 540,
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: shadows.xl,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header — gradient */}
            <div
              style={{
                background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark ?? colors.primary.main}cc)`,
                padding: `${spacing.xl} ${spacing.xl}`,
                color: '#fff',
                position: 'relative',
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: spacing.md,
                  right: spacing.md,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                {/* Date box */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: borderRadius.xl,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.875rem',
                    fontWeight: 800,
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {new Date(historyItem.date).getDate()}
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {new Date(historyItem.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: 4 }}>
                    {historyItem.records.length > 0
                      ? `${historyItem.records.length} peserta tercatat`
                      : 'Belum ada data peserta'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Records */}
            <div
              style={{
                padding: spacing.xl,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md,
                flex: 1,
              }}
            >
              {historyItem.records.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: `${spacing.xl} 0`,
                    color: theme.text.tertiary,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: isDark ? `${colors.primary.main}15` : `${colors.primary.main}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: `0 auto ${spacing.md} auto`,
                    }}
                  >
                    <Calendar size={24} color={theme.text.tertiary} />
                  </div>
                  <p style={{ fontWeight: 600, color: theme.text.secondary, margin: `0 0 ${spacing.xs} 0` }}>
                    Tidak ada data peserta
                  </p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    Belum ada riwayat absensi untuk tanggal ini
                  </p>
                </div>
              ) : (
                historyItem.records.map((record) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    theme={theme}
                    variant="detailed"
                    isDark={isDark}
                  />
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: `${spacing.md} ${spacing.xl}`,
                borderTop: `1px solid ${theme.border}`,
                backgroundColor: isDark ? `${theme.surface}80` : '#f9fafb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: spacing.sm,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: `${spacing.sm} ${spacing.xl}`,
                  borderRadius: borderRadius.xl,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: 'transparent',
                  color: theme.text.secondary,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Tutup
              </button>
              {historyItem.records.length > 0 && (
                <button
                  style={{
                    padding: `${spacing.sm} ${spacing.xl}`,
                    borderRadius: borderRadius.xl,
                    border: 'none',
                    background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark ?? colors.primary.main}cc)`,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: `0 4px 12px ${colors.primary.main}44`,
                    transition: transitions.fast,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Download size={14} />
                  Export Data
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── GridView ─────────────────────────────────────────────────────────────────

interface GridViewProps {
  event: Event;
  theme: ThemeColors;
  isDark: boolean;
}

const ZOOM_LABELS = ['Extra Kecil', 'Kecil', 'Sedang', 'Besar', 'Extra Besar'];
const ZOOM_COLS   = [7, 5, 4, 3, 2];

function GridView({ event, theme, isDark }: GridViewProps) {
  const [zoom, setZoom] = useState(3);
  const [selectedItem, setSelectedItem] = useState<{ date: string; records: ParticipantRecord[] } | null>(null);
  const [calendarOffset, setCalendarOffset] = useState(0);

  const historyMap = useMemo(() => {
    const map: Record<string, ParticipantRecord[]> = {};
    (event.history ?? []).forEach((h) => { map[h.date] = h.records; });
    return map;
  }, [event.history]);

  const baseDate = useMemo(() => {
    if (event.history && event.history.length > 0) return new Date(event.history[0].date);
    return new Date();
  }, [event.history]);

  const currentMonth = useMemo(() => {
    return new Date(baseDate.getFullYear(), baseDate.getMonth() + calendarOffset, 1);
  }, [baseDate, calendarOffset]);

  const daysInMonth   = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const cols          = ZOOM_COLS[zoom - 1];
  const cellMinHeight = [64, 84, 104, 136, 176][zoom - 1];
  const cellFontSize  = ['0.65rem', '0.75rem', '0.8125rem', '0.875rem', '1rem'][zoom - 1];

  return (
    <>
      {/* Zoom Slider */}
      <div
        style={{
          marginBottom: spacing.lg,
          backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
          borderRadius: borderRadius.xl,
          padding: `${spacing.md} ${spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          border: `1px solid ${theme.border}`,
        }}
      >
        <Search size={13} color={theme.text.tertiary} />
        <input
          type="range"
          min={1}
          max={5}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: colors.primary.main, cursor: 'pointer' }}
        />
        <Search size={17} color={theme.text.secondary} />
        <span
          style={{
            fontSize: '0.75rem',
            color: theme.text.secondary,
            fontWeight: 600,
            minWidth: 76,
            textAlign: 'right',
          }}
        >
          {ZOOM_LABELS[zoom - 1]}
        </span>
      </div>

      {/* Month Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <button
          onClick={() => setCalendarOffset((o) => o - 1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.lg,
            border: `1px solid ${theme.border}`,
            backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
            color: theme.text.secondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: 700,
            transition: transitions.fast,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.border; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? `${theme.surface}cc` : theme.surface; }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 700, color: theme.text.primary, fontSize: '1rem' }}>
          {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setCalendarOffset((o) => o + 1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.lg,
            border: `1px solid ${theme.border}`,
            backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
            color: theme.text.secondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            fontWeight: 700,
            transition: transitions.fast,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.border; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? `${theme.surface}cc` : theme.surface; }}
        >
          ›
        </button>
      </div>

      {/* Weekday headers — only for 7-col */}
      {cols === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: theme.text.tertiary,
                paddingBottom: 4,
                letterSpacing: '0.03em',
              }}
            >
              {d}
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
          transition: 'grid-template-columns 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Leading empty cells */}
        {cols === 7 &&
          Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                minHeight: cellMinHeight,
                borderRadius: borderRadius.lg,
                backgroundColor: isDark ? `${theme.surface}80` : '#f9fafb',
                border: `1px solid ${theme.border}`,
                opacity: 0.4,
              }}
            />
          ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const records      = historyMap[dateStr] ?? null;
          const hasData      = records !== null && records.length > 0;
          const hadirCount   = records?.filter((r) => r.status === 'hadir').length ?? 0;
          const terlambatCount = records?.filter((r) => r.status !== 'hadir').length ?? 0;

          return (
            <motion.div
              key={day}
              whileHover={{ y: -4, boxShadow: `0 12px 24px -8px rgba(0,0,0,0.15)` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedItem({ date: dateStr, records: records ?? [] })}
              style={{
                minHeight: cellMinHeight,
                borderRadius: borderRadius.xl,
                border: hasData
                  ? `2px solid ${colors.primary.main}60`
                  : `1px solid ${theme.border}`,
                backgroundColor: hasData
                  ? isDark ? `${colors.primary.main}15` : `${colors.primary.main}06`
                  : isDark ? `${theme.surface}cc` : theme.surface,
                padding: spacing.sm,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
            >
              {/* Decorative circle for data cells */}
              {hasData && (
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    right: -24,
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundColor: `${colors.primary.main}12`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Day number + dots */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 4,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: cellFontSize,
                    fontWeight: 700,
                    color: hasData ? colors.primary.main : theme.text.primary,
                  }}
                >
                  {day}
                </span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {hadirCount > 0 && (
                    <div
                      style={{
                        width: 7, height: 7,
                        borderRadius: '50%',
                        backgroundColor: colors.success,
                      }}
                    />
                  )}
                  {terlambatCount > 0 && (
                    <div
                      style={{
                        width: 7, height: 7,
                        borderRadius: '50%',
                        backgroundColor: colors.warning,
                      }}
                    />
                  )}
                  {!hasData && (
                    <div
                      style={{
                        width: 7, height: 7,
                        borderRadius: '50%',
                        backgroundColor: theme.border,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Mini participant list — zoom ≥ 3 */}
              {hasData && zoom >= 3 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {records!.slice(0, zoom >= 4 ? 4 : 2).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.65rem',
                        color: theme.text.secondary,
                      }}
                    >
                      <div
                        style={{
                          width: 14, height: 14,
                          borderRadius: '50%',
                          backgroundColor: r.status === 'hadir' ? colors.success : colors.warning,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {getInitial(r.name)}
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </span>
                    </div>
                  ))}
                  {records!.length > (zoom >= 4 ? 4 : 2) && (
                    <div style={{ fontSize: '0.6rem', color: theme.text.tertiary, paddingLeft: 18 }}>
                      +{records!.length - (zoom >= 4 ? 4 : 2)} lainnya
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Day detail modal */}
      <GridDayDetail
        historyItem={selectedItem}
        theme={theme}
        isDark={isDark}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}

// ─── ListView ─────────────────────────────────────────────────────────────────

interface ListViewProps {
  event: Event;
  theme: ThemeColors;
  isDark: boolean;
  expandedHistoryDate: string | null;
  onToggleDate: (date: string | null) => void;
}

function ListView({ event, theme, isDark, expandedHistoryDate, onToggleDate }: ListViewProps) {
  if (!event.history || event.history.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: `${spacing.xl} ${spacing.lg}`,
          color: theme.text.secondary,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: isDark
              ? `${colors.primary.main}18`
              : `${colors.primary.main}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: `0 auto ${spacing.md} auto`,
          }}
        >
          <History size={30} color={colors.primary.main} />
        </div>
        <p style={{ fontWeight: 700, margin: `0 0 ${spacing.xs} 0`, color: theme.text.primary, fontSize: '1rem' }}>
          Belum ada riwayat
        </p>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>
          Belum ada riwayat absensi untuk event ini
        </p>
      </div>
    );
  }

  const isOneTime = event.type === 'one-time';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {event.history.map((historyItem) => {
        const isExpanded    = isOneTime || expandedHistoryDate === historyItem.date;
        const hasRecords    = historyItem.records.length > 0;
        const hadirCount    = historyItem.records.filter((r) => r.status === 'hadir').length;

        return (
          <div
            key={historyItem.date}
            style={{
              border: `1.5px solid ${isExpanded ? colors.primary.main + '50' : theme.border}`,
              borderRadius: borderRadius.xl,
              overflow: 'hidden',
              backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
              boxShadow: isExpanded
                ? `0 4px 16px ${colors.primary.main}18`
                : `0 1px 3px rgba(0,0,0,${isDark ? '0.2' : '0.04'})`,
              transition: `border-color 0.2s, box-shadow 0.2s`,
            }}
          >
            {/* Date header */}
            <div
              onClick={() => !isOneTime && onToggleDate(isExpanded ? null : historyItem.date)}
              style={{
                padding: `${spacing.md} ${spacing.lg}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: isOneTime ? 'default' : 'pointer',
                backgroundColor: isExpanded
                  ? isDark ? `${colors.primary.main}18` : `${colors.primary.main}08`
                  : 'transparent',
                transition: transitions.fast,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                {/* Calendar icon box */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: borderRadius.lg,
                    backgroundColor: isExpanded
                      ? `${colors.primary.main}20`
                      : isDark ? `${theme.background}80` : theme.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${isExpanded ? colors.primary.main + '30' : theme.border}`,
                    transition: transitions.fast,
                  }}
                >
                  <Calendar
                    size={17}
                    color={isExpanded ? colors.primary.main : theme.text.secondary}
                  />
                </div>
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: isExpanded ? colors.primary.dark : theme.text.primary,
                      fontSize: '0.9375rem',
                      display: 'block',
                      lineHeight: 1.3,
                    }}
                  >
                    {new Date(historyItem.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: theme.text.tertiary, marginTop: 2, display: 'block' }}>
                    {hasRecords
                      ? `${historyItem.records.length} peserta`
                      : 'Belum ada data'}
                  </span>
                </div>
              </div>

              {/* Hadir count chips + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                {hasRecords && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {hadirCount > 0 && (
                      <div
                        style={{
                          padding: '2px 8px',
                          borderRadius: borderRadius.full,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: `${colors.success}18`,
                          color: colors.success,
                          border: `1px solid ${colors.success}30`,
                        }}
                      >
                        {hadirCount} hadir
                      </div>
                    )}
                    {historyItem.records.length - hadirCount > 0 && (
                      <div
                        style={{
                          padding: '2px 8px',
                          borderRadius: borderRadius.full,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: `${colors.warning}18`,
                          color: colors.warning,
                          border: `1px solid ${colors.warning}30`,
                        }}
                      >
                        {historyItem.records.length - hadirCount} terlambat
                      </div>
                    )}
                  </div>
                )}

                {!isOneTime && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: isExpanded
                        ? `${colors.primary.main}15`
                        : isDark ? `${theme.background}80` : theme.background,
                      border: `1px solid ${isExpanded ? colors.primary.main + '30' : theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: transitions.fast,
                    }}
                  >
                    {isExpanded
                      ? <ChevronUp size={15} color={colors.primary.main} />
                      : <ChevronDown size={15} color={theme.text.secondary} />}
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible records */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: `0 ${spacing.md} ${spacing.md} ${spacing.md}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.sm,
                    }}
                  >
                    <div style={{ borderTop: `1px solid ${theme.border}`, margin: `0 0 ${spacing.sm} 0` }} />
                    {historyItem.records.length === 0 ? (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: theme.text.tertiary,
                          textAlign: 'center',
                          padding: spacing.md,
                        }}
                      >
                        Tidak ada data partisipan untuk tanggal ini
                      </div>
                    ) : (
                      historyItem.records.map((record) => (
                        <RecordRow
                          key={record.id}
                          record={record}
                          theme={theme}
                          isDark={isDark}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── HistoryModal Props ───────────────────────────────────────────────────────

interface HistoryModalProps {
  show: boolean;
  event: Event | null;
  isDark: boolean;
  theme: ThemeColors;
  expandedHistoryDate: string | null;
  onClose: () => void;
  onToggleDate: (date: string | null) => void;
}

// ─── HistoryModal Component ───────────────────────────────────────────────────

export function HistoryModal({
  show,
  event,
  isDark,
  theme,
  expandedHistoryDate,
  onClose,
  onToggleDate,
}: HistoryModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  if (!event) return null;

  const eventTypeLabel =
    event.type === 'one-time'
      ? 'Event Sekali'
      : event.type === 'recurring'
      ? 'Event Berulang'
      : 'Event Rentang Tanggal';

  const showGridToggle = event.type !== 'one-time';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="event-detail-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <style>{`
            @media (min-width: 640px) {
              .event-detail-overlay {
                align-items: center !important;
                padding: 24px !important;
              }
              .event-detail-modal {
                border-radius: ${borderRadius['2xl']} !important;
              }
            }
            .event-detail-modal::-webkit-scrollbar { display: none; }
            .view-toggle-btn:hover { opacity: 0.85; }
          `}</style>

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="event-detail-modal"
            style={{
              backgroundColor: theme.background,
              borderRadius: `${borderRadius['2xl']} ${borderRadius['2xl']} 0 0`,
              width: '100%',
              maxWidth: 580,
              maxHeight: '92vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              boxShadow: shadows.xl,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Sticky Header ── */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: theme.background,
                padding: `${spacing.lg} ${spacing.xl}`,
                borderBottom: `1px solid ${theme.border}`,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: borderRadius.xl,
                    background: `linear-gradient(135deg, ${colors.primary.main}20, ${colors.primary.main}10)`,
                    border: `1px solid ${colors.primary.main}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <History size={20} color={colors.primary.main} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: theme.text.primary,
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    Riwayat: {event.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8125rem',
                      color: theme.text.secondary,
                      marginTop: 2,
                    }}
                  >
                    {eventTypeLabel}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                {/* View Mode Toggle */}
                {showGridToggle && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
                      borderRadius: borderRadius.lg,
                      padding: 3,
                      border: `1px solid ${theme.border}`,
                      gap: 2,
                    }}
                  >
                    <button
                      className="view-toggle-btn"
                      onClick={() => setViewMode('list')}
                      title="List View"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: borderRadius.md,
                        border: 'none',
                        backgroundColor: viewMode === 'list' ? theme.background : 'transparent',
                        color: viewMode === 'list' ? colors.primary.main : theme.text.tertiary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: viewMode === 'list' ? shadows.sm : 'none',
                        transition: transitions.fast,
                      }}
                    >
                      <List size={15} />
                    </button>
                    <button
                      className="view-toggle-btn"
                      onClick={() => setViewMode('grid')}
                      title="Grid/Calendar View"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: borderRadius.md,
                        border: 'none',
                        backgroundColor: viewMode === 'grid' ? theme.background : 'transparent',
                        color: viewMode === 'grid' ? colors.primary.main : theme.text.tertiary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: viewMode === 'grid' ? shadows.sm : 'none',
                        transition: transitions.fast,
                      }}
                    >
                      <LayoutGrid size={15} />
                    </button>
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: isDark ? `${theme.surface}cc` : theme.surface,
                    color: theme.text.secondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: transitions.fast,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.border; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? `${theme.surface}cc` : theme.surface; }}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: `${spacing.xl} ${spacing.xl}` }}>
              <AnimatePresence mode="wait">
                {viewMode === 'list' || !showGridToggle ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    <ListView
                      event={event}
                      theme={theme}
                      isDark={isDark}
                      expandedHistoryDate={expandedHistoryDate}
                      onToggleDate={onToggleDate}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                  >
                    <GridView event={event} theme={theme} isDark={isDark} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
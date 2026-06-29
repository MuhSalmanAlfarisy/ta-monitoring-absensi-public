import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  Trash2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions } from '../../../lib/theme';
import type { ThemeColors } from '../../../lib/theme';
import type { Event } from '../../../lib/types';
import {
  getScheduleLabel,
  getParticipantCount,
  formatCreatedAt,
} from '../../../lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventDetailModalProps {
  show: boolean;
  event: Event | null;
  selectedEventStatus: Event['status'] | null;
  theme: ThemeColors;
  canMarkRecurringAsCompleted: (event: Event) => boolean;
  onClose: () => void;
  onViewParticipants: () => void;
  onComplete: (event: Event) => void;
  onDelete: (eventId: number) => void;
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  theme,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  theme: ThemeColors;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: theme.background,
        borderRadius: borderRadius.lg,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: borderRadius.md,
          backgroundColor: `${colors.primary.main}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={colors.primary.main} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: theme.text.tertiary, fontWeight: 500 }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: theme.text.primary, fontWeight: 600 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventDetailModal({
  show,
  event,
  selectedEventStatus,
  theme,
  canMarkRecurringAsCompleted,
  onClose,
  onViewParticipants,
  onComplete,
  onDelete,
}: EventDetailModalProps) {
  if (!event) return null;

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
          {/* Responsive styles */}
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
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              boxShadow: shadows['xl'],
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Header ── */}
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
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, paddingRight: spacing.md }}>
                <h2
                  style={{
                    margin: 0,
                    color: theme.text.primary,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                  }}
                >
                  {event.title}
                </h2>
                {event.description && (
                  <p
                    style={{
                      margin: `${spacing.xs} 0 0 0`,
                      color: theme.text.secondary,
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {event.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: theme.surface,
                  color: theme.text.secondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.border; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.surface; }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Body ── */}
            <div
              style={{
                padding: `${spacing.xl} ${spacing.xl} 100px ${spacing.xl}`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}
            >
              <InfoRow icon={Calendar} label="Jadwal" value={getScheduleLabel(event)} theme={theme} />
              <InfoRow icon={Clock} label="Waktu" value={`${event.startTime} - ${event.endTime}`} theme={theme} />
              <InfoRow icon={AlertCircle} label="Batas Keterlambatan" value={`${event.lateThreshold} menit dari waktu mulai`} theme={theme} />
              <InfoRow icon={Users} label="Partisipan" value={`${getParticipantCount(event)} orang terdaftar`} theme={theme} />

              {/* Created meta */}
              <div
                style={{
                  marginTop: spacing.xs,
                  fontSize: 'clamp(0.5rem, 2.4vw, 0.75rem)',
                  color: theme.text.tertiary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  minWidth: 0,
                }}
              >
                <Clock size={12} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                >
                  Dibuat{' '}
                  <span style={{ fontWeight: 500, color: theme.text.secondary }}>
                    {formatCreatedAt(event.createdAt)}
                  </span>
                  {' '}oleh{' '}
                  <span style={{ fontWeight: 500, color: theme.text.secondary }}>
                    {event.createdBy}
                  </span>
                </span>
              </div>

              {/* View participants */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onViewParticipants}
                style={{
                  marginTop: spacing.sm,
                  width: '100%',
                  padding: `${spacing.md} ${spacing.lg}`,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: borderRadius.xl,
                  backgroundColor: 'transparent',
                  color: theme.text.primary,
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Users size={18} color={colors.primary.main} />
                  Lihat Daftar Partisipan
                </div>
                <ChevronRight size={18} color={theme.text.tertiary} />
              </motion.button>
            </div>

            {/* ── Sticky Footer ── */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: theme.background,
                padding: `${spacing.lg} ${spacing.xl}`,
                borderTop: `1px solid ${theme.border}`,
                display: 'flex',
                gap: spacing.sm,
              }}
            >
              {canMarkRecurringAsCompleted(event) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onComplete(event)}
                  style={{
                    flex: 1,
                    padding: `${spacing.md} ${spacing.lg}`,
                    border: 'none',
                    borderRadius: borderRadius.xl,
                    backgroundColor: `${colors.success}15`,
                    color: colors.success,
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    transition: transitions.fast,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.success;
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.success}15`;
                    e.currentTarget.style.color = colors.success;
                  }}
                >
                  <CheckCircle2 size={18} />
                  Tandai Selesai
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDelete(Number(event.id))}
                style={{
                  flex: canMarkRecurringAsCompleted(event) ? 'none' : 1,
                  padding: `${spacing.md} ${spacing.lg}`,
                  border: 'none',
                  borderRadius: borderRadius.xl,
                  backgroundColor: `${colors.error}15`,
                  color: colors.error,
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.error;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.error}15`;
                  e.currentTarget.style.color = colors.error;
                }}
              >
                <Trash2 size={18} />
                {selectedEventStatus === 'active' ? 'Hapus' : 'Hapus Event'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

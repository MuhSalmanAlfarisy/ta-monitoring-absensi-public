import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { spacing, borderRadius, shadows } from '../../../lib/theme';
import type { ThemeColors } from '../../../lib/theme';
import type { Event } from '../../../lib/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ParticipantModalProps {
  show: boolean;
  event: Event | null;
  theme: ThemeColors;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ParticipantModal({
  show,
  event,
  theme,
  onClose,
}: ParticipantModalProps) {
  if (!event) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              maxWidth: 500,
              width: '90%',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: shadows.xl,
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <h3 style={{ margin: 0, color: theme.text.primary }}>Daftar Partisipan</h3>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.text.secondary,
                  cursor: 'pointer',
                  padding: spacing.xs,
                  borderRadius: borderRadius.sm,
                }}
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* ── Participant List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {event.participants.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: spacing.lg,
                    color: theme.text.secondary,
                  }}
                >
                  Belum ada partisipan
                </div>
              ) : (
                event.participants.map((participant) => (
                  <div
                    key={participant.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: spacing.sm,
                      border: `1px solid ${theme.border}`,
                      borderRadius: borderRadius.md,
                      backgroundColor: theme.background,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: theme.text.primary }}>
                      {participant.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

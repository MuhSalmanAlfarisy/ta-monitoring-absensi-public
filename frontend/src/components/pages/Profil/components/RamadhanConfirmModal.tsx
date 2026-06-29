import { AlertCircle, Loader2 } from 'lucide-react';
import { colors, spacing, borderRadius, shadows, getThemeColors } from '../../../../lib/theme';

interface RamadhanConfirmModalProps {
  theme: ReturnType<typeof getThemeColors>;
  confirmType: 'activate' | 'deactivate';
  confirmMessage: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RamadhanConfirmModal({
  theme, confirmType, confirmMessage, isSaving, onCancel, onConfirm,
}: RamadhanConfirmModalProps) {
  const accentColor = confirmType === 'activate' ? colors.primary.main : colors.error;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: spacing.md,
      }}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          maxWidth: '450px', width: '100%',
          boxShadow: shadows.lg,
          border: `1px solid ${theme.border}`,
        }}
      >
        <h3
          style={{
            marginTop: 0, color: accentColor,
            display: 'flex', alignItems: 'center', gap: spacing.sm,
            fontSize: '1.125rem',
          }}
        >
          <AlertCircle size={24} />
          {confirmType === 'activate' ? 'Konfirmasi Aktivasi' : 'Konfirmasi Pembatalan'}
        </h3>
        <p style={{ color: theme.text.primary, lineHeight: 1.5, fontSize: '0.9375rem' }}>
          {confirmMessage}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.xl }}>
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: borderRadius.md,
              color: theme.text.primary,
              cursor: 'pointer', fontSize: '0.875rem',
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: accentColor,
              border: 'none',
              borderRadius: borderRadius.md,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: spacing.sm,
              fontSize: '0.875rem',
            }}
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            {confirmType === 'activate' ? 'Ya, Aktifkan' : 'Ya, Batalkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
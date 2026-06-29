import { AlertCircle } from 'lucide-react';
import { spacing, borderRadius, shadows, transitions, getThemeColors } from '../../../../lib/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransferModalProps {
  theme: ReturnType<typeof getThemeColors>;
  isOpen: boolean;
  step: 1 | 2;
  targetEmail: string;
  onClose: () => void;
  onNextStep: () => void;
  onConfirm: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TransferModal({
  theme,
  isOpen,
  step,
  targetEmail,
  onClose,
  onNextStep,
  onConfirm,
}: TransferModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          width: '100%',
          maxWidth: 400,
          padding: spacing.xl,
          boxShadow: shadows.md,
          border: `1px solid ${theme.border}`,
        }}
      >
        {step === 1 ? (
          /* ── Step 1: Konfirmasi ── */
          <>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: theme.text.primary,
                margin: 0,
                marginBottom: spacing.sm,
              }}
            >
              Konfirmasi Alih Jabatan
            </h3>
            <p
              style={{
                color: theme.text.secondary,
                marginBottom: spacing.xl,
                fontSize: '0.875rem',
                margin: `0 0 ${spacing.xl} 0`,
              }}
            >
              Jadikan pengurus{' '}
              <strong style={{ color: theme.text.primary }}>{targetEmail}</strong>{' '}
              sebagai King Admin?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
              <button
                onClick={onClose}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  color: theme.text.secondary,
                  backgroundColor: 'transparent',
                  borderRadius: borderRadius.md,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all ${transitions.fast}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surfaceHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Batal
              </button>
              <button
                onClick={onNextStep}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: '#2563EB',
                  color: '#ffffff',
                  borderRadius: borderRadius.md,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all ${transitions.fast}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
              >
                Oke
              </button>
            </div>
          </>
        ) : (
          /* ── Step 2: Peringatan ── */
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                color: '#EF4444',
                marginBottom: spacing.sm,
              }}
            >
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                Peringatan Penting!
              </h3>
            </div>
            <p
              style={{
                color: theme.text.secondary,
                lineHeight: 1.6,
                fontSize: '0.875rem',
                margin: `0 0 ${spacing.xl} 0`,
              }}
            >
              Setelah ini Anda{' '}
              <strong style={{ color: theme.text.primary }}>
                tidak akan bisa lagi mengakses bagian King Admin
              </strong>
              . Akun Anda akan menjadi Pengurus biasa. Tekan &apos;Iya&apos; jika setuju.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
              <button
                onClick={onClose}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  color: theme.text.secondary,
                  backgroundColor: 'transparent',
                  borderRadius: borderRadius.md,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all ${transitions.fast}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surfaceHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: '#EF4444',
                  color: '#ffffff',
                  borderRadius: borderRadius.md,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all ${transitions.fast}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; }}
              >
                Iya, Saya Setuju
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

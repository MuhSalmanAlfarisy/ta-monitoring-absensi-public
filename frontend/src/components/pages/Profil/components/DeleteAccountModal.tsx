import { AlertCircle, Loader2 } from 'lucide-react';
import { colors, spacing, borderRadius, shadows } from '../../../../lib/theme';

interface DeleteAccountModalProps {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({ isDeleting, onCancel, onConfirm }: DeleteAccountModalProps) {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: spacing.md,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          maxWidth: '400px', width: '100%',
          boxShadow: shadows.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, color: colors.error, marginBottom: spacing.md }}>
          <AlertCircle size={24} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Hapus Akun?</h3>
        </div>
        <p style={{ color: '#4B5563', marginBottom: spacing.lg, lineHeight: 1.5 }}>
          Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: borderRadius.md,
              border: '1px solid #D1D5DB',
              backgroundColor: 'white', color: '#374151',
              cursor: 'pointer', fontWeight: 500,
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '8px 16px', borderRadius: borderRadius.md,
              border: 'none',
              backgroundColor: colors.error, color: 'white',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
          </button>
        </div>
      </div>
    </div>
  );
}
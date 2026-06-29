import { LogOut } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';

interface ActionButtonsProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  role: string;
  onLogout: () => void;
  onDeleteClick: () => void;
}

export function ActionButtons({ theme, isMobile, role, onLogout, onDeleteClick }: ActionButtonsProps) {
  return (
    <>
      <div style={{ display: 'flex', gap: isMobile ? spacing.sm : spacing.md, flexWrap: 'wrap', marginTop: isMobile ? spacing.sm : '0' }}>
        <button
          onClick={onLogout}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: borderRadius.sm,
            border: `1px solid ${colors.error}`,
            backgroundColor: 'transparent',
            color: colors.error,
            fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: spacing.xs,
            transition: `all ${transitions.fast}`,
            flex: isMobile ? '1' : 'auto',
            minWidth: isMobile ? 'auto' : '120px',
          }}
        >
          <LogOut size={16} />
          <span style={{ whiteSpace: 'nowrap' }}>Logout</span>
        </button>
      </div>

      {role !== 'king_admin' && (
        <div style={{ marginTop: spacing.xl, paddingTop: spacing.lg, borderTop: `1px solid ${theme.border}` }}>
          <h4 style={{ color: colors.error, margin: `0 0 ${spacing.sm} 0`, fontSize: '1rem', fontWeight: 600 }}>
            Zona Berbahaya
          </h4>
          <p style={{ color: theme.text.secondary, fontSize: '0.875rem', marginBottom: spacing.md }}>
            Menghapus akun akan menghilangkan akses Anda sebagai pengurus secara permanen.
          </p>
          <button
            onClick={onDeleteClick}
            style={{
              padding: '8px 16px',
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.error}`,
              backgroundColor: '#bd35351a',
              color: colors.error,
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer',
              transition: `all ${transitions.fast}`,
            }}
          >
            Hapus Akun Saya
          </button>
        </div>
      )}
    </>
  );
}
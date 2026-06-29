import { Settings } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';

interface ProfilHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  isEditing: boolean;
  onEditClick: () => void;
}

export function ProfilHeader({ theme, isMobile, isEditing, onEditClick }: ProfilHeaderProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.lg,
        padding: isMobile ? spacing.md : spacing.lg,
        border: `1px solid ${theme.border}`,
        transition: `all ${transitions.base}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <div>
        <h2
          style={{
            fontSize: isMobile ? '1.25rem' : '1.875rem',
            fontWeight: 700, color: theme.text.primary,
            margin: 0, marginBottom: spacing.xs,
          }}
        >
          Profil Akun
        </h2>
        <p style={{ fontSize: isMobile ? '0.8125rem' : '0.9375rem', color: theme.text.secondary, margin: 0, lineHeight: 1.4 }}>
          Kelola informasi akun Anda
        </p>
      </div>

      {!isEditing && (
        <button
          onClick={onEditClick}
          style={{
            padding: isMobile ? `${spacing.xs} ${spacing.md}` : `${spacing.sm} ${spacing.lg}`,
            backgroundColor: colors.primary.main,
            color: '#fff', border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: spacing.xs,
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 600,
          }}
        >
          <Settings size={18} />
          {!isMobile && 'Edit Profil'}
        </button>
      )}
    </div>
  );
}
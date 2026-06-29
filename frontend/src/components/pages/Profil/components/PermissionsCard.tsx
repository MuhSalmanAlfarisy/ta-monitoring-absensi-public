import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface PermissionsCardProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  role: string;
}

export function PermissionsCard({ theme, isMobile, role }: PermissionsCardProps) {
  const permissions = ['Kelola Jamaah', 'Lihat Dashboard', role === 'king_admin' ? 'Kelola Pengurus' : '', 'Export Data'].filter(Boolean);

  return (
    <div
      style={{
        padding: isMobile ? spacing.md : spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: theme.surfaceHover,
        border: `1px solid ${theme.border}`,
        marginBottom: isMobile ? spacing.lg : spacing.xl,
      }}
    >
      <h4
        style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          fontWeight: 600, color: theme.text.primary,
          margin: 0, marginBottom: isMobile ? spacing.sm : spacing.md,
        }}
      >
        Hak Akses
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: isMobile ? spacing.xs : spacing.sm,
        }}
      >
        {permissions.map((p) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, minHeight: isMobile ? '28px' : 'auto' }}>
            <div
              style={{
                width: isMobile ? '5px' : '6px',
                height: isMobile ? '5px' : '6px',
                borderRadius: borderRadius.full,
                backgroundColor: colors.success,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: theme.text.secondary }}>
              {p}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
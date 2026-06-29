import { Calendar, Key } from 'lucide-react';
import { spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface AccountInfoGridProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  joinedAt: string;
  lastLogin: string;
}

export function AccountInfoGrid({ theme, isMobile, joinedAt, lastLogin }: AccountInfoGridProps) {
  const items = [
    { icon: Calendar, title: 'Bergabung Sejak', value: joinedAt },
    { icon: Key, title: 'Login Terakhir', value: lastLogin },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: isMobile ? spacing.md : spacing.lg,
        marginBottom: isMobile ? spacing.lg : spacing.xl,
      }}
    >
      {items.map((item) => (
        <div
          key={item.title}
          style={{
            padding: isMobile ? spacing.md : spacing.lg,
            borderRadius: borderRadius.md,
            backgroundColor: theme.surfaceHover,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <item.icon size={isMobile ? 16 : 18} color={theme.text.secondary} />
            <h4 style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', fontWeight: 600, color: theme.text.secondary, margin: 0 }}>
              {item.title}
            </h4>
          </div>
          <p style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
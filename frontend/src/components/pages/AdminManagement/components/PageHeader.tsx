import { Shield } from 'lucide-react';
import { colors, spacing, borderRadius } from '../../../../lib/theme';
import type { ThemeColors } from '../../../../lib/theme';

interface PageHeaderProps {
  isMobile: boolean;
  theme: ThemeColors;
}

export function PageHeader({ isMobile, theme }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: isMobile ? spacing.md : spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <div
          style={{
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            borderRadius: borderRadius.lg,
            background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Shield size={isMobile ? 20 : 24} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <h1
            style={{
              fontSize: isMobile ? '1.25rem' : '1.75rem',
              fontWeight: 700,
              color: theme.text.primary,
              margin: 0,
            }}
          >
            Manajemen Otorisasi Pengurus
          </h1>
          <p
            style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: theme.text.secondary,
              margin: 0,
              marginTop: 2,
            }}
          >
            Kelola whitelist pengurus yang diizinkan mendaftar
          </p>
        </div>
      </div>
    </div>
  );
}

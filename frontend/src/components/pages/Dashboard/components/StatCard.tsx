import { LucideIcon } from 'lucide-react';
import { spacing, borderRadius, transitions } from '../../../../lib/theme';
import type { ThemeColors } from '../../../../lib/theme';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  gradient: string;
  theme: ThemeColors;
  isDark: boolean;
}

export function StatCard({ title, value, change, icon: Icon, gradient, theme, isDark }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        border: `1px solid ${theme.border}`,
        transition: `all ${transitions.base}`,
        cursor: 'pointer',
        transform: 'scale(1)',
        boxShadow: isDark
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Text */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: '0.75rem',
              color: theme.text.secondary,
              margin: 0,
              marginBottom: spacing.xs,
              lineHeight: 1.3,
            }}
          >
            {title}
          </p>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: theme.text.primary,
              margin: 0,
              marginBottom: spacing.xs,
            }}
          >
            {value}
          </h3>
          <p
            style={{
              fontSize: '0.6875rem',
              color: theme.text.tertiary,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {change}
          </p>
        </div>

        {/* Icon */}
        <div
          style={{
            width: '44px',
            height: '44px',
            background: gradient,
            borderRadius: borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: spacing.sm,
          }}
        >
          <Icon size={20} color="#ffffff" />
        </div>
      </div>
    </div>
  );
}
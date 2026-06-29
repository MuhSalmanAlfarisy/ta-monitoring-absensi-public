import { Children, type ReactNode } from 'react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, color, theme, isMobile, onClick }: StatCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        padding: isMobile ? spacing.xs : spacing.md,
        borderRadius: borderRadius.md,
        border: `1px solid ${theme.border}`,
        backgroundColor: theme.surface,
        textAlign: 'center',
        minHeight: isMobile ? 88 : undefined,
        display: isMobile ? 'flex' : 'block',
        flexDirection: isMobile ? 'column' : undefined,
        justifyContent: isMobile ? 'center' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${transitions.fast}`,
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${color}15`;
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          fontSize: isMobile ? '1.25rem' : '2rem',
          fontWeight: 700,
          color,
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: theme.text.secondary,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── StatCardsWrapper ─────────────────────────────────────────────────────────

interface StatCardsWrapperProps {
  isMobile: boolean;
  children: ReactNode;
  gap?: string;
}

export function StatCardsWrapper({ isMobile, children, gap = spacing.sm }: StatCardsWrapperProps) {
  return (
    <div style={{ marginBottom: isMobile ? spacing.md : spacing.lg }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap,
          justifyItems: isMobile ? 'center' : undefined,
        }}
      >
        {Children.map(children, (child, index) => (
          <div
            key={index}
            style={isMobile ? { width: '100%', maxWidth: 158 } : undefined}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StatCards (composed) ─────────────────────────────────────────────────────

interface StatCardsProps {
  isMobile: boolean;
  theme: ReturnType<typeof getThemeColors>;
  totalCount: number;
  waitingCount: number;
  activeCount: number;
  onClickAll: () => void;
  onClickWaiting: () => void;
  onClickActive: () => void;
}

export function StatCards({
  isMobile,
  theme,
  totalCount,
  waitingCount,
  activeCount,
  onClickAll,
  onClickWaiting,
  onClickActive,
}: StatCardsProps) {
  return (
    <StatCardsWrapper isMobile={isMobile} gap={spacing.sm}>
      <StatCard
        label="Total Whitelist"
        value={totalCount}
        color={colors.primary.main}
        theme={theme}
        isMobile={isMobile}
        onClick={onClickAll}
      />
      <StatCard
        label="Menunggu"
        value={waitingCount}
        color="#F59E0B"
        theme={theme}
        isMobile={isMobile}
        onClick={onClickWaiting}
      />
      <StatCard
        label="Aktif"
        value={activeCount}
        color="#10B981"
        theme={theme}
        isMobile={isMobile}
        onClick={onClickActive}
      />
    </StatCardsWrapper>
  );
}

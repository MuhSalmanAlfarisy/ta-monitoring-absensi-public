import { Trophy, RefreshCw } from 'lucide-react';
import { spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface LeaderboardHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export function LeaderboardHeader({ theme, isMobile, loading, onRefresh }: LeaderboardHeaderProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.md,
        padding: isMobile ? spacing.sm : spacing.md,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Trophy size={isMobile ? 20 : 24} color={theme.primary} />
          <div>
            <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, margin: 0, color: theme.text.primary }}>
              Leaderboard
            </h1>
            <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', margin: 0, color: theme.text.secondary }}>
              Papan Peringkat Jamaah Paling Istiqamah
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            color: theme.text.secondary,
            backgroundColor: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.sm,
            padding: spacing.xs,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={isMobile ? 16 : 20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
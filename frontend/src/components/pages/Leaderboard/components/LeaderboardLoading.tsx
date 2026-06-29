import { RefreshCw } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface LeaderboardLoadingProps {
  theme: ReturnType<typeof getThemeColors>;
}

export function LeaderboardLoading({ theme }: LeaderboardLoadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: theme.surface,
        borderRadius: borderRadius.md,
        border: `1px solid ${theme.border}`,
      }}
    >
      <RefreshCw size={24} className="animate-spin" style={{ color: colors.primary.main }} />
    </div>
  );
}
import { spacing, borderRadius, getThemeColors } from '../../../../lib/theme';
import { LeaderboardItem, type LeaderboardEntry } from './LeaderboardItem';

interface LeaderboardListProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  data: LeaderboardEntry[];
}

export function LeaderboardList({ theme, isMobile, data }: LeaderboardListProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          textAlign: 'center',
          border: `1px solid ${theme.border}`,
          color: theme.text.secondary,
          fontSize: '0.875rem',
        }}
      >
        Tidak ada data untuk periode ini
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      {data.map((jamaah) => (
        <LeaderboardItem key={jamaah.id} theme={theme} isMobile={isMobile} jamaah={jamaah} />
      ))}
    </div>
  );
}
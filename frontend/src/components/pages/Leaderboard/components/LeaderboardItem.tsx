import { Trophy, Medal, Award, Target, CheckCircle, Percent } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

// ─── Rank Helpers ─────────────────────────────────────────────────────────────

export const getRankColor = (rank: number, tertiary: string) => {
  if (rank === 1) return colors.gold.main;
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return tertiary;
};

const getRankIcon = (rank: number, isMobile: boolean) => {
  const size = isMobile ? 16 : 20;
  if (rank === 1) return <Trophy size={size} color={colors.gold.main} />;
  if (rank === 2) return <Medal size={size} color="#C0C0C0" />;
  if (rank === 3) return <Award size={size} color="#CD7F32" />;
  return null;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: number | string;
  rank: number;
  nama: string;
  total_hadir: number;
  tepat_waktu: number;
  persentase_tepat_waktu: number;
}

interface LeaderboardItemProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  jamaah: LeaderboardEntry;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaderboardItem({ theme, isMobile, jamaah }: LeaderboardItemProps) {
  const { rank } = jamaah;
  const isTop3 = rank <= 3;
  const rankColor = getRankColor(rank, theme.text.tertiary);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: isMobile ? `${spacing.sm} ${spacing.md}` : spacing.md,
        backgroundColor: isTop3 ? `${rankColor}10` : theme.surface,
        borderRadius: borderRadius.md,
        border: `1px solid ${isTop3 ? rankColor : theme.border}`,
      }}
    >
      {/* Rank */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: isMobile ? '32px' : '40px', flexShrink: 0 }}>
        <div style={{ color: rankColor, fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: 700 }}>
          #{rank}
        </div>
        {getRankIcon(rank, isMobile)}
      </div>

      {/* Nama */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: isTop3 ? 700 : 600,
            color: theme.text.primary,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {jamaah.nama}
        </span>
      </div>

      {/* Stats - 3 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.xs, alignItems: 'center' }}>
        {/* Kehadiran */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
            <Target size={isMobile ? 12 : 14} color={colors.primary.main} />
            <span style={{ fontSize: '0.75rem', color: theme.text.tertiary }}>Kehadiran</span>
          </div>
          <span style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 700, color: colors.primary.main }}>
            {jamaah.total_hadir}x
          </span>
        </div>

        {/* Tepat Waktu */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
            <CheckCircle size={isMobile ? 12 : 14} color={colors.success} />
            <span style={{ fontSize: '0.75rem', color: theme.text.tertiary }}>Tepat Waktu</span>
          </div>
          <span style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 700, color: colors.success }}>
            {jamaah.tepat_waktu}x
          </span>
        </div>

        {/* WinRate */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
            <Percent size={isMobile ? 12 : 14} color={colors.gold.main} />
            <span style={{ fontSize: '0.75rem', color: theme.text.tertiary }}>WinRate</span>
          </div>
          <span style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 700, color: colors.gold.main }}>
            {jamaah.persentase_tepat_waktu.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
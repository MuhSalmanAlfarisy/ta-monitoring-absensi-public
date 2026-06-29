import { TrendingUp, Clock } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import { getPeriodLabel } from './PeriodSelector';
import type { StatisticsPeriod } from '../../../../hooks/useStatistics';
import '../../../../styles/laporan-statistik.css';

interface InsightCardsProps {
  theme: ReturnType<typeof getThemeColors>;
  peakPeriod: StatisticsPeriod;
  peakHour: { jam: string; jamaah: number } | null;
  trend: { text: string; isUp?: boolean };
}

export function InsightCards({ theme, peakPeriod, peakHour, trend }: InsightCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
        gap: spacing.lg,
      }}
    >
      {/* Peak Hour Card */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          border: `1px solid ${theme.border}`,
          transition: `all ${transitions.base}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p
              className="insight-card-label"
              style={{ color: theme.text.secondary, margin: 0, marginBottom: spacing.xs }}
            >
              Jam Kehadiran Tertinggi
            </p>
            <p style={{ color: theme.text.tertiary, margin: 0, marginBottom: spacing.xs, fontSize: '0.75rem' }}>
              {getPeriodLabel(peakPeriod)}
            </p>
            <h3
              className="insight-card-value"
              style={{ fontWeight: 700, color: theme.text.primary, margin: 0, marginBottom: spacing.xs }}
            >
              {peakHour ? peakHour.jam : '-'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <TrendingUp size={16} color={colors.success} />
              <span className="insight-card-subtitle" style={{ color: colors.success }}>
                {peakHour && peakHour.jamaah > 0 ? `${peakHour.jamaah} jamaah` : 'Belum ada data'}
              </span>
            </div>
          </div>
          <div
            className="insight-card-icon"
            style={{
              background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
              borderRadius: borderRadius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock className="insight-card-icon" color="#ffffff" />
          </div>
        </div>
      </div>

      {/* Trend Card */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          border: `1px solid ${theme.border}`,
          transition: `all ${transitions.base}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p
              className="insight-card-label"
              style={{ color: theme.text.secondary, margin: 0, marginBottom: spacing.xs }}
            >
              Tren Bulan Ini
            </p>
            <h3
              className="insight-card-value"
              style={{ fontWeight: 700, color: theme.text.primary, margin: 0, marginBottom: spacing.xs }}
            >
              {trend.text}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <TrendingUp
                size={16}
                color={trend.isUp ? colors.success : colors.error}
                style={{ transform: trend.isUp ? 'none' : 'scaleY(-1)' }}
              />
              <span
                className="insight-card-subtitle"
                style={{ color: trend.isUp ? colors.success : colors.error }}
              >
                {trend.isUp ? 'Naik dari bulan lalu' : 'Turun dari bulan lalu'}
              </span>
            </div>
          </div>
          <div
            className="insight-card-icon"
            style={{
              background: `linear-gradient(135deg, ${colors.primary.light}, ${colors.primary.main})`,
              borderRadius: borderRadius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp className="insight-card-icon" color="#ffffff" />
          </div>
        </div>
      </div>
    </div>
  );
}
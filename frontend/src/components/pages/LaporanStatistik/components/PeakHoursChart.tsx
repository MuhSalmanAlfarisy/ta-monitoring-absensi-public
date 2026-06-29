import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import { PeriodSelector } from './PeriodSelector';
import { Skeleton } from '../../../ui/skeleton';
import type { StatisticsPeriod } from '../../../../hooks/useStatistics';
import '../../../../styles/laporan-statistik.css';

interface PeakHourItem {
  jam: string;
  jamaah: number;
}

interface PeakHoursChartProps {
  theme: ReturnType<typeof getThemeColors>;
  data: PeakHourItem[];
  period: StatisticsPeriod;
  loading: boolean;
  error: string | null;
  onPeriodChange: (period: StatisticsPeriod) => void;
  onRetry: () => void;
}

export function PeakHoursChart({
  theme,
  data,
  period,
  loading,
  error,
  onPeriodChange,
  onRetry,
}: PeakHoursChartProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        border: `1px solid ${theme.border}`,
        transition: `all ${transitions.base}`,
      }}
    >
      <div
        style={{
          marginBottom: spacing.lg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: spacing.md,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3
            className="chart-title"
            style={{ fontWeight: 600, color: theme.text.primary, margin: 0, marginBottom: spacing.xs }}
          >
            Jam Puncak Kehadiran
          </h3>
          <p className="chart-subtitle" style={{ color: theme.text.secondary, margin: 0 }}>
            Distribusi jamaah berdasarkan waktu
          </p>
        </div>
        <PeriodSelector id="peak" theme={theme} value={period} onChange={onPeriodChange} />
      </div>

      <div className="chart-container-mobile">
        {loading ? (
          <Skeleton style={{ height: '100%', width: '100%' }} />
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, color: colors.error }}>
            <span>Gagal memuat jam puncak</span>
            <button
              onClick={onRetry}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.error}`,
                backgroundColor: 'transparent',
                color: colors.error,
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorJamaahPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary.light} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.primary.light} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="jam" stroke={theme.text.secondary} fontSize={12} />
              <YAxis stroke={theme.text.secondary} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: borderRadius.md,
                  color: theme.text.primary,
                  fontSize: '0.875rem',
                }}
              />
              <Area
                type="monotone"
                dataKey="jamaah"
                stroke={colors.primary.main}
                fillOpacity={1}
                fill="url(#colorJamaahPeak)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
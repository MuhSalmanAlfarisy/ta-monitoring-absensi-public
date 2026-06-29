import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import { PeriodSelector } from './PeriodSelector';
import { Skeleton } from '../../../ui/skeleton';
import type { StatisticsPeriod } from '../../../../hooks/useStatistics';
import '../../../../styles/laporan-statistik.css';

interface PrayerDistributionItem {
  kategori: string;
  nilai: number;
  color: string;
}

interface PrayerDistributionChartProps {
  theme: ReturnType<typeof getThemeColors>;
  data: PrayerDistributionItem[];
  period: StatisticsPeriod;
  loading: boolean;
  error: string | null;
  onPeriodChange: (period: StatisticsPeriod) => void;
  onRetry: () => void;
}

export function PrayerDistributionChart({
  theme,
  data,
  period,
  loading,
  error,
  onPeriodChange,
  onRetry,
}: PrayerDistributionChartProps) {
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
            Distribusi Kehadiran Per Waktu
          </h3>
          <p className="chart-subtitle" style={{ color: theme.text.secondary, margin: 0 }}>
            Proporsi jamaah berdasarkan waktu sholat
          </p>
        </div>
        <PeriodSelector id="distribution" theme={theme} value={period} onChange={onPeriodChange} />
      </div>

      <div className="chart-container-mobile">
        {loading ? (
          <Skeleton style={{ height: '100%', width: '100%' }} />
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, color: colors.error }}>
            <span>Gagal memuat distribusi</span>
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
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { x, y, textAnchor, kategori, nilai } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      fill={theme.text.primary}
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight={500}
                    >
                      {`${kategori}: ${nilai}`}
                    </text>
                  );
                }}
                outerRadius={80}
                dataKey="nilai"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: borderRadius.md,
                  color: theme.text.primary,
                  fontSize: '0.875rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
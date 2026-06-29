import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { colors, spacing, borderRadius, transitions } from '../../../../lib/theme';
import type { ThemeColors } from '../../../../lib/theme';

interface WeeklyDataPoint {
  day: string;
  kehadiran: number;
  target: number;
}

interface WeeklyChartProps {
  theme: ThemeColors;
  isDark: boolean;
  data: WeeklyDataPoint[];
  hasError: boolean;
}

export function WeeklyChart({ theme, isDark, data, hasError }: WeeklyChartProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        border: `1px solid ${theme.border}`,
        transition: `all ${transitions.base}`,
        boxShadow: isDark
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing.sm }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: theme.text.primary,
            margin: 0,
            marginBottom: spacing.xs,
          }}
        >
          Grafik Kehadiran Mingguan
        </h3>
        <p style={{ fontSize: '0.75rem', color: theme.text.secondary, margin: 0 }}>
          Perbandingan kehadiran jamaah 7 hari terakhir
        </p>
      </div>

      {/* Content */}
      {hasError ? (
        <div
          style={{
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.text.secondary,
            flexDirection: 'column',
            gap: spacing.sm,
          }}
        >
          <TrendingUp size={36} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: '0.875rem' }}>Data grafik tidak tersedia saat ini</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorKehadiran" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary.main} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="day" stroke={theme.text.secondary} fontSize={12} />
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
              dataKey="kehadiran"
              stroke={colors.primary.main}
              fillOpacity={1}
              fill="url(#colorKehadiran)"
              dot={{ r: 2, fill: colors.primary.main, stroke: colors.primary.main }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
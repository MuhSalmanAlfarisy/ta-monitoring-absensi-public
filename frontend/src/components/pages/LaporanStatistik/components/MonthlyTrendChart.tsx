import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import '../../../../styles/laporan-statistik.css';

interface MonthlyTrendItem {
  bulan: string;
  kehadiran: number;
  target: number;
}

interface MonthlyTrendChartProps {
  theme: ReturnType<typeof getThemeColors>;
  data: MonthlyTrendItem[];
}

export function MonthlyTrendChart({ theme, data }: MonthlyTrendChartProps) {
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
      <div style={{ marginBottom: spacing.lg }}>
        <h3
          className="chart-title"
          style={{ fontWeight: 600, color: theme.text.primary, margin: 0, marginBottom: spacing.xs }}
        >
          Tren Kehadiran Bulanan
        </h3>
        <p className="chart-subtitle" style={{ color: theme.text.secondary, margin: 0 }}>
          Perbandingan dengan target kehadiran
        </p>
      </div>

      <div className="chart-container-mobile">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="bulan" stroke={theme.text.secondary} fontSize={12} />
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
            <Legend 
              wrapperStyle={{ fontSize: '0.875rem' }} 
              formatter={(value) => <span style={{ color: theme.text.primary, fontWeight: 500 }}>{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="kehadiran"
              stroke={colors.primary.main}
              strokeWidth={2}
              name="Kehadiran Aktual"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke={colors.gold.main}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
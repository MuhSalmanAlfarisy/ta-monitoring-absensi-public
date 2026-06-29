import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import '../../../../styles/laporan-statistik.css';

interface SholatTrendItem {
  waktu: string;
  minggu1: number;
  minggu2: number;
  minggu3: number;
  minggu4: number;
}

interface WeeklyPrayerChartProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  data: SholatTrendItem[];
}

export function WeeklyPrayerChart({ theme, isDark, data }: WeeklyPrayerChartProps) {
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
          Tren Mingguan Per Waktu Sholat
        </h3>
        <p className="chart-subtitle" style={{ color: theme.text.secondary, margin: 0 }}>
          Perbandingan 4 minggu terakhir
        </p>
      </div>

      <div className="chart-container-mobile">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="waktu" stroke={theme.text.secondary} fontSize={12} />
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
              wrapperStyle={{ fontSize: '0.875rem', paddingTop: '10px' }} 
              formatter={(value) => <span style={{ color: theme.text.primary, fontWeight: 500 }}>{value}</span>}
            />
            <Bar dataKey="minggu1" fill={isDark ? '#4ade80' : '#059669'} name="Minggu 1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="minggu2" fill={colors.primary.light} name="Minggu 2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="minggu3" fill={colors.gold.main} name="Minggu 3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="minggu4" fill={isDark ? '#a8d5c3' : colors.primary.dark} name="Minggu 4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
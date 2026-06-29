import { Users } from 'lucide-react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { colors, spacing, borderRadius, transitions } from '../../../../lib/theme';
import type { ThemeColors } from '../../../../lib/theme';
import { useState } from 'react';

interface SholatDataPoint {
  waktu: string;
  jamaah: number;
}

interface SholatChartProps {
  theme: ThemeColors;
  isDark: boolean;
  data: SholatDataPoint[];
  hasError: boolean;
}

export function SholatChart({ theme, isDark, data, hasError }: SholatChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
          Kehadiran Per Waktu Sholat
        </h3>
        <p style={{ fontSize: '0.75rem', color: theme.text.secondary, margin: 0 }}>
          Distribusi jamaah hari ini
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
          <Users size={36} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: '0.875rem' }}>Data distribusi tidak tersedia</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            margin={{ left: -16, right: 8, bottom: 0 }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Gradient utama */}
              <linearGradient id="barGradientNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primary.light} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.primary.dark} stopOpacity={1} />
              </linearGradient>
              {/* Gradient hover */}
              <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                <stop offset="40%" stopColor={colors.primary.light} stopOpacity={1} />
                <stop offset="100%" stopColor={colors.primary.dark} stopOpacity={1} />
              </linearGradient>
              {/* Efek highlight sisi kiri (3D) */}
              <linearGradient id="barHighlight" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                <stop offset="30%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis
              dataKey="waktu"
              stroke={theme.text.secondary}
              fontSize={11}
              interval={0}
              tick={{ fontSize: 11, fill: theme.text.secondary }}
              tickLine={false}
              width={undefined}
            />
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

            {/* Bar utama dengan gradient */}
            <Bar
              dataKey="jamaah"
              radius={[6, 6, 0, 0]}
              maxBarSize={52}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoveredIndex === index ? 'url(#barGradientHover)' : 'url(#barGradientNormal)'}
                  onMouseEnter={() => setHoveredIndex(index)}
                  style={{
                    filter: hoveredIndex === index
                      ? 'drop-shadow(0 4px 8px rgba(12, 94, 60, 0.5))'
                      : 'drop-shadow(0 2px 4px rgba(12, 94, 60, 0.25))',
                    cursor: 'pointer',
                    transition: 'filter 0.2s ease',
                  }}
                />
              ))}
            </Bar>

            {/* Bar overlay untuk efek highlight 3D di sisi kiri */}
            <Bar
              dataKey="jamaah"
              radius={[6, 6, 0, 0]}
              maxBarSize={52}
              fill="url(#barHighlight)"
              isAnimationActive={false}
              style={{ pointerEvents: 'none' }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
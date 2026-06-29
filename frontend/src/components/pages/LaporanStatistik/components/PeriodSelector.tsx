import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import type { StatisticsPeriod } from '../../../../hooks/useStatistics';

export const PERIOD_OPTIONS: { value: StatisticsPeriod; label: string }[] = [
  { value: 'pekan-ini', label: 'Minggu Ini' },
  { value: 'bulan-ini', label: 'Bulan Ini' },
  { value: 'tahun-ini', label: 'Tahun Ini' },
  { value: 'all-time', label: 'Semua Waktu' },
];

export const getPeriodLabel = (period: StatisticsPeriod) =>
  PERIOD_OPTIONS.find((opt) => opt.value === period)?.label || 'Bulan Ini';

interface PeriodSelectorProps {
  id: string;
  theme: ReturnType<typeof getThemeColors>;
  value: StatisticsPeriod;
  onChange: (value: StatisticsPeriod) => void;
}

export function PeriodSelector({ id, theme, value, onChange }: PeriodSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StatisticsPeriod)}
      style={{
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: borderRadius.md,
        border: `1px solid ${theme.border}`,
        backgroundColor: theme.surface,
        color: theme.text.primary,
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
      }}
    >
      {PERIOD_OPTIONS.map((option) => (
        <option key={`${id}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
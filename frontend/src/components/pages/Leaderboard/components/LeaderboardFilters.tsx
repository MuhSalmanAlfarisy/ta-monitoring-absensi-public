import { Filter, Calendar } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import { MultiSelect } from '../../../ui/MultiSelect';
import type { LeaderboardPeriod } from '../../../../hooks/useLeaderboard';



const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'all-time', label: 'Semua' },
  { value: 'pekan-ini', label: 'Pekan' },
  { value: 'bulan-ini', label: 'bulan ini' },
  { value: 'tahun-ini', label: 'tahun ini' },
  { value: 'custom', label: 'Rentang' },
];

const getPeriodLabel = (p: LeaderboardPeriod) =>
  PERIOD_OPTIONS.find((opt) => opt.value === p)?.label ?? p;

interface LeaderboardFiltersProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  period: LeaderboardPeriod;
  waktuSholat: string[];
  startDate: string;
  endDate: string;
  isRamadhanActive: boolean;
  onPeriodChange: (p: LeaderboardPeriod) => void;
  onWaktuSholatChange: (v: string[]) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

export function LeaderboardFilters({
  theme,
  isMobile,
  period,
  waktuSholat,
  startDate,
  endDate,
  isRamadhanActive,
  onPeriodChange,
  onWaktuSholatChange,
  onStartDateChange,
  onEndDateChange,
}: LeaderboardFiltersProps) {
  const handlePeriodClick = (p: LeaderboardPeriod) => {
    if (period === p && p !== 'all-time') {
      onPeriodChange('all-time');
    } else {
      onPeriodChange(p);
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.md,
        padding: isMobile ? spacing.sm : spacing.md,
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Filter Header & Waktu Sholat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <Filter size={isMobile ? 14 : 16} color={theme.text.primary} />
          <span style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 600, color: theme.text.primary }}>
            Filter
          </span>
        </div>

        {/* Waktu Sholat MultiSelect */}
        <div style={{ flex: 1, minWidth: isMobile ? '160px' : '220px' }}>
          <MultiSelect
            options={[
              { value: 'Subuh', label: 'Subuh' },
              { value: 'Dzuhur', label: 'Dzuhur' },
              { value: 'Ashar', label: 'Ashar' },
              { value: 'Maghrib', label: 'Maghrib' },
              { value: 'Isya', label: 'Isya' },
              ...(isRamadhanActive ? [{ value: 'Tarawih', label: 'Tarawih' }] : []),
            ]}
            selectedValues={waktuSholat}
            onChange={onWaktuSholatChange}
            placeholder="Semua Waktu"
            theme={theme}
            style={{ backgroundColor: theme.surfaceHover }}
          />
        </div>
      </div>

      {/* Period Pills */}
      <div style={{ display: 'flex', gap: spacing.xs, overflowX: 'auto', paddingBottom: 2 }}>
        {(['all-time', 'pekan-ini', 'bulan-ini', 'tahun-ini', 'custom'] as LeaderboardPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodClick(p)}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: borderRadius.sm,
              border: `1px solid ${period === p ? colors.primary.main : theme.border}`,
              backgroundColor: period === p ? `${colors.primary.main}10` : 'transparent',
              color: period === p ? colors.primary.main : theme.text.secondary,
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              fontWeight: period === p ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: `all ${transitions.fast}`,
            }}
          >
            {getPeriodLabel(p)}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <div style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: spacing.sm, alignItems: isMobile ? 'stretch' : 'center' }}>
            {/* Dari */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: theme.text.tertiary, display: 'block', marginBottom: 2 }}>
                Dari
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: spacing.sm, top: '50%', transform: 'translateY(-50%)', color: theme.text.tertiary }} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${spacing.xs} ${spacing.sm}`,
                    paddingLeft: spacing.xl,
                    borderRadius: borderRadius.sm,
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.surfaceHover,
                    color: theme.text.primary,
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {!isMobile && (
              <span style={{ color: theme.text.tertiary, fontSize: '0.875rem', alignSelf: 'flex-end', marginBottom: spacing.xs }}>sampai</span>
            )}

            {/* Sampai */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: theme.text.tertiary, display: 'block', marginBottom: 2 }}>
                Sampai
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: spacing.sm, top: '50%', transform: 'translateY(-50%)', color: theme.text.tertiary }} />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  disabled={!startDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${spacing.xs} ${spacing.sm}`,
                    paddingLeft: spacing.xl,
                    borderRadius: borderRadius.sm,
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.surfaceHover,
                    color: theme.text.primary,
                    fontSize: '0.8125rem',
                    outline: 'none',
                    opacity: !startDate ? 0.6 : 1,
                    cursor: !startDate ? 'not-allowed' : 'text',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

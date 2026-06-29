import { spacing } from '../../../lib/theme';
import { getThemeColors } from '../../../lib/theme';
import { useStatistics, type StatisticsPeriod } from '../../../hooks/useStatistics';

import { LaporanHeader } from './components/LaporanHeader';
import { InsightCards } from './components/InsightCards';
import { MonthlyTrendChart } from './components/MonthlyTrendChart';
import { PrayerDistributionChart } from './components/PrayerDistributionChart';
import { WeeklyPrayerChart } from './components/WeeklyPrayerChart';
import { PeakHoursChart } from './components/PeakHoursChart';
import { LaporanSkeleton } from './components/LaporanSkeleton';
import '../../../styles/laporan-statistik.css';

interface LaporanStatistikProps {
  isDark: boolean;
}

export function LaporanStatistik({ isDark }: LaporanStatistikProps) {
  const theme = getThemeColors(isDark);

  // ─── Data Hooks ───────────────────────────────────────────────────────────

  const {
    data: baseData,
    loading: baseLoading,
    error: baseError,
    refetch: refetchBase,
  } = useStatistics('all-time');

  const {
    data: distributionData,
    loading: distributionLoading,
    error: distributionError,
    period: distributionPeriod,
    setPeriod: setDistributionPeriod,
    refetch: refetchDistribution,
  } = useStatistics('bulan-ini');

  const {
    data: peakData,
    loading: peakLoading,
    error: peakError,
    period: peakPeriod,
    setPeriod: setPeakPeriod,
    refetch: refetchPeak,
  } = useStatistics('bulan-ini');

  // ─── Derived State ────────────────────────────────────────────────────────

  const peakHour = (peakData?.peak_hours || []).reduce<{ jam: string; jamaah: number } | null>(
    (max, current) => (!max || current.jamaah > max.jamaah ? current : max),
    null
  );

  const calculateMonthTrend = () => {
    if (!baseData?.monthly_trend || baseData.monthly_trend.length < 2) {
      return { value: 0, text: 'Data belum cukup', isUp: false };
    }
    const current = baseData.monthly_trend[baseData.monthly_trend.length - 1];
    const previous = baseData.monthly_trend[baseData.monthly_trend.length - 2];
    if (!previous || previous.kehadiran === 0) {
      return { value: 0, text: 'Bulan lalu 0', isUp: false };
    }
    const diff = current.kehadiran - previous.kehadiran;
    const percent = ((diff / previous.kehadiran) * 100).toFixed(1);
    return {
      value: diff,
      text: `${parseFloat(percent) > 0 ? '+' : ''}${percent}%`,
      isUp: diff >= 0,
    };
  };

  const trend = calculateMonthTrend();

  const prayerDistribution = (distributionData?.distribusi_sholat || []).filter(
    (item) => item.kategori !== 'Di Luar Waktu Sholat'
  );

  // ─── Loading / Error States ───────────────────────────────────────────────

  if (baseLoading) {
    return <LaporanSkeleton isDark={isDark} />;
  }

  if (baseError || !baseData) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center', color: 'red' }}>
        <p>Error: {baseError || 'Gagal memuat data'}</p>
        <button onClick={() => refetchBase()}>Coba Lagi</button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <LaporanHeader theme={theme} />

      <InsightCards
        theme={theme}
        peakPeriod={peakPeriod}
        peakHour={peakHour}
        trend={trend}
      />

      {/* Charts Row 1 */}
      <div className="charts-grid-laporan">
        <MonthlyTrendChart
          theme={theme}
          data={baseData.monthly_trend || []}
        />
        <PrayerDistributionChart
          theme={theme}
          data={prayerDistribution}
          period={distributionPeriod}
          loading={distributionLoading}
          error={distributionError}
          onPeriodChange={(p: StatisticsPeriod) => setDistributionPeriod(p)}
          onRetry={refetchDistribution}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid-laporan">
        <WeeklyPrayerChart
          theme={theme}
          isDark={isDark}
          data={baseData.sholat_trend || []}
        />
        <PeakHoursChart
          theme={theme}
          data={peakData?.peak_hours || []}
          period={peakPeriod}
          loading={peakLoading}
          error={peakError}
          onPeriodChange={(p: StatisticsPeriod) => setPeakPeriod(p)}
          onRetry={refetchPeak}
        />
      </div>
    </div>
  );
}

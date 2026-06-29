import { useMemo } from 'react';
import { getThemeColors, spacing } from '../../../lib/theme';
import { usePrayerTimes } from '../../../hooks/usePrayerTimes';
import { useDashboard } from '../../../hooks/useDashboard';
import { useRamadhanSettings } from '../../../hooks/useRamadhanSettings';
import { WaktuSholatCard } from './components/WaktuSholatCard';
import { StatsCards } from './components/StatsCards';
import { WeeklyChart } from './components/WeeklyChart';
import { SholatChart } from './components/SholatChart';

interface DashboardMainProps {
  isDark: boolean;
}

export function DashboardMain({ isDark }: DashboardMainProps) {
  const theme = getThemeColors(isDark);

  // ─── Data Hooks ───────────────────────────────────────────────────────────
  const { prayerTimes, loading: prayerLoading, refetch } = usePrayerTimes();
  const { data: ramadhanSettings } = useRamadhanSettings();
  const isRamadhanActive = Boolean(ramadhanSettings?.is_ramadhan_active_today);
  const {
    quickStats, dailyStats, sholatStats,
    quickStatsError, dailyStatsError, sholatStatsError,
  } = useDashboard();

  // ─── Derived: Quick Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (quickStatsError) {
      return {
        totalJamaah: '-',
        todayAttendance: '-',
        todayTotal: '-',
        tepatWaktuPercentage: '-',
        attendancePercentage: '-',
      };
    }
    if (!quickStats) {
      return {
        totalJamaah: '0',
        todayAttendance: '0',
        todayTotal: '0',
        tepatWaktuPercentage: '0',
        attendancePercentage: '0',
      };
    }
    const attendancePercentage = quickStats.all_time.total_jamaah > 0
      ? ((quickStats.today.unique_jamaah / quickStats.all_time.total_jamaah) * 100).toFixed(0)
      : '0';

    return {
      totalJamaah: String(quickStats.all_time.total_jamaah),
      todayAttendance: String(quickStats.today.unique_jamaah),
      todayTotal: String(quickStats.today.total),
      tepatWaktuPercentage: String(quickStats.today.persentase_tepat_waktu),
      attendancePercentage,
    };
  }, [quickStats, quickStatsError]);

  // ─── Derived: Weekly Chart Data ───────────────────────────────────────────
  const weeklyData = useMemo(() => {
    if (!dailyStats) return [];
    return [...dailyStats.daily_stats]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(stat => ({
        day: stat.day.substring(0, 3),
        kehadiran: stat.total,
        target: 200,
      }));
  }, [dailyStats]);

  // ─── Derived: Sholat Chart Data ───────────────────────────────────────────
  const sholatData = useMemo(() => {
    if (!sholatStats) return [];

    const statsMap = new Map(sholatStats.sholat_stats.map(s => [s.waktu_sholat, s.total]));
    const isFriday = new Date().getDay() === 5;
    const order = [
      'Subuh',
      isFriday ? 'Jumat' : 'Dzuhur',
      'Ashar',
      'Maghrib',
      'Isya',
      ...(isRamadhanActive ? ['Tarawih'] : []),
    ];

    return order.map(waktu => ({
      waktu,
      jamaah: statsMap.get(waktu === 'Jumat' ? 'Dzuhur' : waktu) ?? 0,
    }));
  }, [sholatStats, isRamadhanActive]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>

      {/* Stats Cards */}
      <StatsCards
        theme={theme}
        isDark={isDark}
        totalJamaah={stats.totalJamaah}
        todayAttendance={stats.todayAttendance}
        todayTotal={stats.todayTotal}
        tepatWaktuPercentage={stats.tepatWaktuPercentage}
        attendancePercentage={stats.attendancePercentage}
      />

      {/* Waktu Sholat */}
      <WaktuSholatCard
        data={prayerTimes}
        loading={prayerLoading}
        isDark={isDark}
        onRetry={refetch}
      />

      {/* Charts */}
      <div className="charts-grid" style={{ display: 'grid', gap: spacing.md }}>
        <style>{`
          .charts-grid { grid-template-columns: 1fr; }
          @media (min-width: 1024px) {
            .charts-grid { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>

        <WeeklyChart
          theme={theme}
          isDark={isDark}
          data={weeklyData}
          hasError={Boolean(dailyStatsError)}
        />

        <SholatChart
          theme={theme}
          isDark={isDark}
          data={sholatData}
          hasError={Boolean(sholatStatsError)}
        />
      </div>
    </div>
  );
}
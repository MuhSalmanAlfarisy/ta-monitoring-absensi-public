import { useState, useEffect } from 'react';
import { spacing, getThemeColors } from '../../../lib/theme';
import { useLeaderboard, type LeaderboardPeriod } from '../../../hooks/useLeaderboard';
import { useRamadhanSettings } from '../../../hooks/useRamadhanSettings';

import { LeaderboardHeader } from './components/LeaderboardHeader';
import { LeaderboardError } from './components/LeaderboardError';
import { LeaderboardFilters } from './components/LeaderboardFilters';
import { LeaderboardLoading } from './components/LeaderboardLoading';
import { LeaderboardList } from './components/LeaderboardList';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeaderboardProps {
  isDark: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Leaderboard({ isDark }: LeaderboardProps) {
  const theme = getThemeColors(isDark);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    data, loading, error,
    period, setPeriod,
    waktuSholat, setWaktuSholat,
    startDate, setStartDate,
    endDate, setEndDate,
    refetch,
  } = useLeaderboard();

  const { data: ramadhanSettings } = useRamadhanSettings();
  const isRamadhanActive = Boolean(ramadhanSettings?.is_ramadhan_active_today);
  const showTarawihFilter = isRamadhanActive || Boolean(ramadhanSettings?.has_tarawih_history);

  useEffect(() => {
    if (!showTarawihFilter && Array.isArray(waktuSholat) && waktuSholat.includes('Tarawih')) {
      setWaktuSholat(waktuSholat.filter((w: string) => w !== 'Tarawih'));
    }
  }, [showTarawihFilter, setWaktuSholat, waktuSholat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <LeaderboardHeader
        theme={theme}
        isMobile={isMobile}
        loading={loading}
        onRefresh={refetch}
      />

      {error && (
        <LeaderboardError message={error} onRetry={refetch} />
      )}

      <LeaderboardFilters
        theme={theme}
        isMobile={isMobile}
        period={period}
        waktuSholat={waktuSholat}
        startDate={startDate}
        endDate={endDate}
        isRamadhanActive={showTarawihFilter}
        onPeriodChange={(p: LeaderboardPeriod) => setPeriod(p)}
        onWaktuSholatChange={setWaktuSholat}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {loading ? (
        <LeaderboardLoading theme={theme} />
      ) : (
        <LeaderboardList theme={theme} isMobile={isMobile} data={data} />
      )}
    </div>
  );
}

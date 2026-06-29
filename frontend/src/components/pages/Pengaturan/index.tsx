import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getThemeColors } from '../../../lib/theme';
import { api } from '../../../lib/axios';
import type {
  DeviceStatusResponse,
  SystemDailyLogSummary,
  SystemLogsResponse,
} from '../../../lib/types';

import { TampilanCard } from './components/TampilanCard';
import { DeviceStatusCard } from './components/DeviceStatusCard';
import { RiwayatLogCard } from './components/RiwayatLogCard';
import { LogDetailModal } from './components/LogDetailModal';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PengaturanProps {
  isDark: boolean;
  onDarkModeChange: (dark: boolean) => void;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const parseApiDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  // Backend already converts to WIB (+07:00) via _to_local(),
  // so timezone-less values are already local, not UTC.
  const normalized = hasTimezone ? value : `${value}+07:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTimeWIB = (value?: string | null): string => {
  const dateObj = parseApiDate(value);
  if (!dateObj) return '-';
  return dateObj.toLocaleString('id-ID', {
    day: 'numeric', month: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
};

const formatDateKeyWIB = (dateKey: string): string => {
  const dateObj = new Date(`${dateKey}T00:00:00+07:00`);
  if (Number.isNaN(dateObj.getTime())) return dateKey;
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Pengaturan({ isDark, onDarkModeChange }: PengaturanProps) {
  const theme = getThemeColors(isDark);

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusResponse | null>(null);
  const [dailySummaries, setDailySummaries] = useState<SystemDailyLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedLogDate = searchParams.get('logDate');
  const selectedDay = useMemo(
    () => (selectedLogDate ? dailySummaries.find((item) => item.date === selectedLogDate) ?? null : null),
    [dailySummaries, selectedLogDate]
  );

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, logsRes] = await Promise.all([
          api.get<DeviceStatusResponse>('/api/settings/device-status'),
          api.get<SystemLogsResponse>('/api/settings/logs'),
        ]);
        setDeviceStatus(statusRes.data);
        setDailySummaries(logsRes.data.daily_summaries || []);
      } catch (err) {
        console.error('Failed to fetch settings data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── URL Guard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && selectedLogDate && !selectedDay) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('logDate');
      setSearchParams(nextParams, { replace: true });
    }
  }, [loading, searchParams, selectedDay, selectedLogDate, setSearchParams]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenLogDetail = (item: SystemDailyLogSummary) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('logDate', item.date);
    setSearchParams(nextParams);
  };

  const handleCloseLogDetail = () => {
    if (!searchParams.has('logDate')) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('logDate');
    setSearchParams(nextParams, { replace: true });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: theme.text.primary }}>
        Pengaturan
      </h1>

      {selectedDay && (
        <LogDetailModal
          theme={theme}
          selectedDay={selectedDay}
          formatDateTimeWIB={formatDateTimeWIB}
          formatDateKeyWIB={formatDateKeyWIB}
          onClose={handleCloseLogDetail}
        />
      )}

      <TampilanCard
        theme={theme}
        isDark={isDark}
        onDarkModeChange={onDarkModeChange}
      />

      <DeviceStatusCard
        theme={theme}
        loading={loading}
        deviceStatus={deviceStatus}
        formatDateTimeWIB={formatDateTimeWIB}
      />

      <RiwayatLogCard
        theme={theme}
        loading={loading}
        dailySummaries={dailySummaries}
        formatDateTimeWIB={formatDateTimeWIB}
        formatDateKeyWIB={formatDateKeyWIB}
        onOpenDetail={handleOpenLogDetail}
      />
    </div>
  );
}

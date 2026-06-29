import { Activity, Clock } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import { getThemeColors } from '../../../../lib/theme';
import type { SystemDailyLogSummary } from '../../../../lib/types';

const PRAYER_ORDER = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] as const;

interface RiwayatLogCardProps {
  theme: ReturnType<typeof getThemeColors>;
  loading: boolean;
  dailySummaries: SystemDailyLogSummary[];
  formatDateTimeWIB: (value?: string | null) => string;
  formatDateKeyWIB: (dateKey: string) => string;
  onOpenDetail: (item: SystemDailyLogSummary) => void;
}

export function RiwayatLogCard({
  theme,
  loading,
  dailySummaries,
  formatDateTimeWIB,
  formatDateKeyWIB,
  onOpenDetail,
}: RiwayatLogCardProps) {
  return (
    <Card
      className="p-4 space-y-3"
      style={{ backgroundColor: theme.surface, color: theme.text.primary }}
    >
      <div className="flex items-center gap-2" style={{ color: theme.primary }}>
        <Activity size={18} />
        <h2 className="font-medium">Riwayat Log</h2>
      </div>

      <Separator />

      <div className="space-y-3 text-sm">
        {loading ? (
          <p>Memuat log...</p>
        ) : dailySummaries.length === 0 ? (
          <p className="text-gray-500">Tidak ada log terbaru.</p>
        ) : (
          dailySummaries.map((item) => {
            const insidePrayerCount = PRAYER_ORDER.reduce(
              (acc, key) => acc + (item.prayer_counts?.[key] || 0),
              0
            );

            return (
              <button
                key={item.date}
                type="button"
                className="w-full text-left rounded-md border p-3 transition-colors hover:bg-black/5"
                style={{ borderColor: theme.border }}
                onClick={() => onOpenDetail(item)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{formatDateKeyWIB(item.date)}</span>
                  <span className="text-xs" style={{ color: theme.text.secondary }}>
                    {item.total} data
                  </span>
                </div>
                <div
                  className="mt-2 flex items-center gap-4 text-xs"
                  style={{ color: theme.text.secondary }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {formatDateTimeWIB(item.latest_timestamp)}
                  </span>
                  <span>Dalam window: {insidePrayerCount}</span>
                  <span>Di luar waktu sholat: {item.outside_prayer_count}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
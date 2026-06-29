import { X } from 'lucide-react';
import { Separator } from '../../../../components/ui/separator';
import { getThemeColors } from '../../../../lib/theme';
import type { SystemDailyLogSummary } from '../../../../lib/types';

const PRAYER_ORDER = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] as const;

interface LogDetailModalProps {
  theme: ReturnType<typeof getThemeColors>;
  selectedDay: SystemDailyLogSummary;
  formatDateTimeWIB: (value?: string | null) => string;
  formatDateKeyWIB: (dateKey: string) => string;
  onClose: () => void;
}

export function LogDetailModal({
  theme,
  selectedDay,
  formatDateTimeWIB,
  formatDateKeyWIB,
  onClose,
}: LogDetailModalProps) {
  return (
    <div
      className="fixed inset-0 !m-0 z-[1000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg p-4 space-y-4"
        style={{ backgroundColor: theme.surface, color: theme.text.primary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Detail Log Harian</h3>
          <button type="button" onClick={onClose} style={{ color: theme.text.secondary }}>
            <X size={18} />
          </button>
        </div>

        <p className="text-sm" style={{ color: theme.text.secondary }}>
          {formatDateKeyWIB(selectedDay.date)}
        </p>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Total Data</div>
          <div className="font-medium">{selectedDay.total}</div>
          <div>Berhasil</div>
          <div className="font-medium text-green-600">{selectedDay.successful}</div>
          <div>Gagal</div>
          <div className="font-medium text-red-600">{selectedDay.failed}</div>
          <div>Log Terakhir</div>
          <div className="font-medium">{formatDateTimeWIB(selectedDay.latest_timestamp)}</div>
        </div>

        <Separator />

        {/* Per Waktu Sholat */}
        <div className="space-y-2 text-sm">
          <h4 className="font-medium">Rekap Berdasarkan Waktu Sholat</h4>
          {PRAYER_ORDER.map((name) => (
            <div key={name} className="flex items-center justify-between">
              <span>{name}</span>
              <span className="font-medium">{selectedDay.prayer_counts?.[name] || 0}</span>
            </div>
          ))}
          <div
            className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: theme.border }}
          >
            <span>Di luar waktu sholat</span>
            <span className="font-medium text-amber-600">{selectedDay.outside_prayer_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
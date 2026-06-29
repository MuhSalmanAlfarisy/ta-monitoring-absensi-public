import { Server, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import { getThemeColors } from '../../../../lib/theme';
import type { DeviceStatusResponse } from '../../../../lib/types';

interface DeviceStatusCardProps {
  theme: ReturnType<typeof getThemeColors>;
  loading: boolean;
  deviceStatus: DeviceStatusResponse | null;
  formatDateTimeWIB: (value?: string | null) => string;
}

export function DeviceStatusCard({
  theme,
  loading,
  deviceStatus,
  formatDateTimeWIB,
}: DeviceStatusCardProps) {
  return (
    <Card
      className="p-4 space-y-3"
      style={{ backgroundColor: theme.surface, color: theme.text.primary }}
    >
      <div className="flex items-center gap-2" style={{ color: theme.primary }}>
        <Server size={18} />
        <h2 className="font-medium">Status Perangkat</h2>
      </div>

      <Separator />

      {loading ? (
        <p className="text-sm text-gray-500">Memuat status perangkat...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>ID Perangkat</div>
          <div className="font-medium">{deviceStatus?.device_id || '-'}</div>

          <div>Nama</div>
          <div>{deviceStatus?.device_name || '-'}</div>

          <div>Status</div>
          <div className="flex items-center gap-1">
            {deviceStatus?.is_online ? (
              <>
                <Wifi size={16} className="text-green-600" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-600" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>

          <div>Firmware</div>
          <div>{deviceStatus?.firmware || '-'}</div>

          <div>Terakhir mengirim</div>
          <div>{formatDateTimeWIB(deviceStatus?.last_heartbeat)}</div>
        </div>
      )}
    </Card>
  );
}
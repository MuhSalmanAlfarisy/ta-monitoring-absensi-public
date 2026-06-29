import { Clock, Hash, User } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { getThemeColors } from '../../../../lib/theme';

interface AttendanceItem {
  id: number;
  photo_url?: string | null;
  scan_time: string;
  waktu_sholat?: string | null;
  status_kehadiran?: string | null;
}

interface ListViewProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  data: AttendanceItem[];
  jamaahNama: string;
  getPhotoUrl: (url?: string | null) => string | undefined;
  isTepatWaktu: (status: string | null | undefined) => boolean;
  isDiLuarWaktu: (status: string | null | undefined) => boolean;
  onItemClick: (item: AttendanceItem) => void;
}

export function ListView({
  theme,
  isDark,
  data,
  jamaahNama,
  getPhotoUrl,
  isTepatWaktu,
  isDiLuarWaktu,
  onItemClick,
}: ListViewProps) {
  return (
    <div className="space-y-1">
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="group cursor-pointer rounded-lg overflow-hidden border transition-all hover:shadow-sm"
          style={{
            borderColor: theme.border,
            backgroundColor: isDark ? theme.background : '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-2 p-2">
            {/* Avatar */}
            <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-[#0C5E3C] to-[#78C2A4] rounded flex items-center justify-center relative">
              {item.photo_url ? (
                <img
                  src={getPhotoUrl(item.photo_url)}
                  alt=""
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
              {/* Status dot */}
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white">
                {isTepatWaktu(item.status_kehadiran) ? (
                  <div className="w-full h-full rounded-full bg-green-400" />
                ) : isDiLuarWaktu(item.status_kehadiran) ? (
                  <div className="w-full h-full rounded-full bg-gray-400" />
                ) : (
                  <div className="w-full h-full rounded-full bg-orange-400" />
                )}
              </div>
            </div>

            {/* Row content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Nama */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs font-medium truncate" style={{ color: theme.text.primary }}>
                  {jamaahNama}
                </span>
              </div>

              {/* ID */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Hash className="w-3 h-3" style={{ color: theme.text.tertiary }} />
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: theme.primary }}>
                  {item.id.toString().slice(-3)}
                </span>
              </div>

              {/* Tanggal + Waktu */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" style={{ color: theme.text.tertiary }} />
                <div className="flex flex-col leading-none">
                  <span 
                    className="text-[10px] font-medium whitespace-nowrap"
                    style={{ color: theme.text.primary }}
                  >
                    {new Date(item.scan_time).toLocaleDateString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <span 
                    className="text-[9px] opacity-90 whitespace-nowrap"
                    style={{ color: theme.text.secondary }}
                  >
                    {new Date(item.scan_time)
                      .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      .replace('.', ':')}
                  </span>
                </div>
              </div>

              {/* Waktu Sholat Badge */}
              <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37] text-white text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                {item.waktu_sholat?.charAt(0) || '?'}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
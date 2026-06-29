import { CalendarDays } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';

interface AttendanceItem {
  id: number;
  photo_url?: string | null;
  scan_time: string;
  waktu_sholat?: string | null;
  status_kehadiran?: string | null;
}

interface GridViewProps {
  data: AttendanceItem[];
  jamaahNama: string;
  getPhotoUrl: (url?: string | null) => string | undefined;
  isTepatWaktu: (status: string | null | undefined) => boolean;
  isDiLuarWaktu: (status: string | null | undefined) => boolean;
  onItemClick: (item: AttendanceItem) => void;
}

export function GridView({
  data,
  jamaahNama,
  getPhotoUrl,
  isTepatWaktu,
  isDiLuarWaktu,
  onItemClick,
}: GridViewProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="group cursor-pointer rounded-lg overflow-hidden border transition-all hover:shadow-sm"
        >
          <div className="aspect-square bg-gradient-to-br from-[#0C5E3C] to-[#78C2A4] relative overflow-hidden">
            {item.photo_url ? (
              <img
                src={getPhotoUrl(item.photo_url)}
                alt={`Kehadiran ${item.waktu_sholat}`}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-base font-bold bg-[#0C5E3C]">
                {jamaahNama.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Status dot */}
            <div className="absolute top-1 right-1">
              {isTepatWaktu(item.status_kehadiran) ? (
                <div className="w-2 h-2 rounded-full bg-green-400" />
              ) : isDiLuarWaktu(item.status_kehadiran) ? (
                <div className="w-2 h-2 rounded-full bg-gray-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-orange-400" />
              )}
            </div>

            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 text-white">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="w-4 h-4 flex-shrink-0 rounded bg-white/20 flex items-center justify-center">
                    <CalendarDays className="w-2.5 h-2.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-medium leading-none truncate">
                      {new Date(item.scan_time).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span className="text-[8px] opacity-90 leading-none">
                      {new Date(item.scan_time)
                        .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        .replace('.', ':')}
                    </span>
                  </div>
                </div>
                <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37] text-[8px] px-1 py-0 h-4">
                  {item.waktu_sholat?.charAt(0) || '?'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
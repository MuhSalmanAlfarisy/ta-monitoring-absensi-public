import { X, Calendar, Clock, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { getThemeColors } from '../../../../lib/theme';

interface AttendanceItem {
  id: number;
  photo_url?: string | null;
  scan_time: string;
  waktu_sholat?: string | null;
  status_kehadiran?: string | null;
  jamaah_id?: number | string | null;
}

interface DetailModalProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  item: AttendanceItem;
  jamaahNama: string;
  isKingAdmin: boolean;
  isDeletingAttendance: boolean;
  deleteError: string | null;
  getPhotoUrl: (url?: string | null) => string | undefined;
  isTepatWaktu: (status: string | null | undefined) => boolean;
  isDiLuarWaktu: (status: string | null | undefined) => boolean;
  getStatusLabel: (status: string | null | undefined) => string;
  getStatusColorClass: (status: string | null | undefined) => string;
  onClose: () => void;
  onDelete: () => void;
  onPhotoClick: () => void;
}

export function DetailModal({
  theme,
  isDark,
  item,
  jamaahNama,
  isKingAdmin,
  isDeletingAttendance,
  deleteError,
  getPhotoUrl,
  isTepatWaktu,
  isDiLuarWaktu,
  getStatusLabel,
  getStatusColorClass,
  onClose,
  onDelete,
  onPhotoClick,
}: DetailModalProps) {
  const cardBg = isDark ? theme.background : '#F5F5F5';

  return (
    <div className="fixed inset-0 !m-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.surface }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0C5E3C] to-[#78C2A4] text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl mb-1">Detail Kehadiran</h3>
              <p className="text-sm text-white/80">{jamaahNama}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Photo */}
          <div className="rounded-xl overflow-hidden border-4 border-[#0C5E3C]/20">
            {item.photo_url ? (
              <img
                src={getPhotoUrl(item.photo_url)}
                alt="Foto Kehadiran"
                className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={onPhotoClick}
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                No Photo Available
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tanggal */}
            <div className="p-3 md:p-4 rounded-xl" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#0C5E3C]/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#0C5E3C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: theme.text.secondary }}>Tanggal</p>
                  <p className="text-sm md:text-base truncate font-semibold" style={{ color: theme.primary }}>
                    {new Date(item.scan_time).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Waktu Scan */}
            <div className="p-3 md:p-4 rounded-xl" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#78C2A4]/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#78C2A4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: theme.text.secondary }}>Waktu Scan</p>
                  <p className="text-sm md:text-base font-semibold" style={{ color: theme.primary }}>
                    {new Date(item.scan_time).toLocaleTimeString('id-ID', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Waktu Sholat */}
            <div className="md:col-span-2 p-3 md:p-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: theme.text.secondary }}>Waktu Sholat</p>
                    <Badge className="text-white text-sm md:text-base px-3 py-1" style={{ backgroundColor: '#D4AF37' }}>
                      {item.waktu_sholat || '-'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="md:col-span-2 p-3 md:p-4 rounded-xl" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  {isTepatWaktu(item.status_kehadiran) ? (
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  ) : isDiLuarWaktu(item.status_kehadiran) ? (
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs" style={{ color: theme.text.secondary }}>Status Kehadiran</p>
                  <p className={`text-sm md:text-base ${getStatusColorClass(item.status_kehadiran)}`}>
                    {getStatusLabel(item.status_kehadiran)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delete (king_admin only) */}
          {isKingAdmin && (
            <div className="space-y-3">
              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteError}
                </div>
              )}
              <Button
                onClick={onDelete}
                disabled={isDeletingAttendance}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingAttendance ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {isDeletingAttendance ? 'Menghapus...' : 'Hapus Data Kehadiran'}
              </Button>
              <p className="text-xs" style={{ color: theme.text.secondary }}>
                Akses ini khusus King Admin untuk pembersihan data duplikat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
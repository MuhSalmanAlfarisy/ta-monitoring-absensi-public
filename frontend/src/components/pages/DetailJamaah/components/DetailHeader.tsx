import { X, User } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { getThemeColors } from '../../../../lib/theme';

interface DetailHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
  nama: string;
  idDisplay: string;
  photoUrl?: string;
  onClose: () => void;
  onPhotoClick: () => void;
}

export function DetailHeader({
  theme,
  nama,
  idDisplay,
  photoUrl,
  onClose,
  onPhotoClick,
}: DetailHeaderProps) {
  return (
    <div
      className="sticky top-0 p-4 md:p-6 rounded-t-2xl z-10 border-b"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div
            className="w-10 h-10 md:w-16 md:h-16 rounded-full p-0.5 flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: `${theme.primary}20` }}
            onClick={() => photoUrl && onPhotoClick()}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={nama} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 md:w-8 md:h-8" style={{ color: theme.primary }} />
              )}
            </div>
          </div>

          {/* Nama + ID */}
          <div className="min-w-0 flex-1">
            <h2
              className="text-base md:text-xl font-semibold truncate"
              style={{ color: theme.text.primary }}
            >
              {nama}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs md:hidden"
                style={{ color: theme.text.secondary }}
              >
                ID: {idDisplay}
              </span>
              <Badge
                className="hidden md:inline-flex px-3 py-0.5"
                style={{
                  backgroundColor: `${theme.primary}15`,
                  color: theme.primary,
                  border: 'none',
                }}
              >
                ID: {idDisplay}
              </Badge>
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="rounded-full p-1.5 md:p-2 transition-colors flex-shrink-0"
          style={{ color: theme.text.secondary }}
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
}
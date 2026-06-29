import { User, Clock } from 'lucide-react';
import { getThemeColors } from '../../../../lib/theme';
import type { JamaahResponse } from '../../../../lib/types';
import { getPhotoUrl } from '../../../../lib/utils';

// ─── Utils ────────────────────────────────────────────────────────────────────


// ─── Props ────────────────────────────────────────────────────────────────────

interface JamaahListProps {
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
  data: JamaahResponse[];
  search: string;
  onJamaahClick: (jamaah: JamaahResponse) => void;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  theme,
  isDark,
  search,
}: {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  search: string;
}) {
  return (
    <div className="text-center py-10">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: isDark ? theme.background : '#F3F4F6' }}
      >
        <User className="w-8 h-8" style={{ color: theme.text.tertiary }} />
      </div>
      <p className="text-sm" style={{ color: theme.text.secondary }}>
        {search ? 'Tidak ada jamaah yang cocok' : 'Belum ada data jamaah'}
      </p>
    </div>
  );
}

// ─── List Item ────────────────────────────────────────────────────────────────

function JamaahListItem({
  jamaah,
  theme,
  isDark,
  onClick,
}: {
  jamaah: JamaahResponse;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group"
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Foto + Nama */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${getThemeColors(!isDark).primary})`,
          }}
        >
          {jamaah.foto_profil_url ? (
            <img
              src={getPhotoUrl(jamaah.foto_profil_url)}
              alt={jamaah.nama}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold">{jamaah.nama.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p
            className="font-medium text-sm truncate group-hover:underline"
            style={{ color: theme.primary }}
          >
            {jamaah.nama}
          </p>
          <p className="text-xs text-gray-500 truncate">ID: {jamaah.id}</p>
        </div>
      </div>

      {/* Total Scan + Waktu Terakhir */}
      <div className="flex items-center gap-4 ml-2 flex-shrink-0">
        {/* Total Kehadiran */}
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: theme.primary }}>
            {jamaah.total_kehadiran}
          </p>
          <p className="text-[10px]" style={{ color: theme.text.tertiary }}>
            Total Scan
          </p>
        </div>

        {/* Waktu Terakhir Hadir */}
        {jamaah.last_seen_at ? (
          <div className="flex items-center gap-1 text-right">
            <Clock className="w-3 h-3" style={{ color: theme.text.tertiary }} />
            <div>
              <p className="text-[10px] font-medium" style={{ color: theme.text.secondary }}>
                {new Date(jamaah.last_seen_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[9px]" style={{ color: theme.text.tertiary }}>
                {new Date(jamaah.last_seen_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[10px] italic text-gray-400">–</p>
        )}
      </div>
    </div>
  );
}

// ─── JamaahList ───────────────────────────────────────────────────────────────

export function JamaahList({ isDark, theme, data, search, onJamaahClick }: JamaahListProps) {
  if (data.length === 0) {
    return <EmptyState theme={theme} isDark={isDark} search={search} />;
  }

  return (
    <div className="divide-y" style={{ borderColor: theme.border }}>
      {data.map((jamaah) => (
        <JamaahListItem
          key={jamaah.id}
          jamaah={jamaah}
          theme={theme}
          isDark={isDark}
          onClick={() => onJamaahClick(jamaah)}
        />
      ))}
    </div>
  );
}

import { Calendar, Clock } from 'lucide-react';
import { getThemeColors } from '../../../../lib/theme';

interface DetailTimeInfoProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  firstSeen?: string | null;
  lastSeen?: string | null;
}

interface TimeRowProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  label: string;
  value?: string | null;
  iconColor: string;
  bgColor: string;
  icon: React.ElementType;
}

function TimeRow({ theme, isDark, label, value, iconColor, bgColor, icon: Icon }: TimeRowProps) {
  const date = value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  const time = value
    ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className="flex items-center gap-3 p-3 md:p-4 rounded-lg md:rounded-xl"
      style={{ backgroundColor: isDark ? theme.background : '#F5F5F5' }}
    >
      <div
        className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="min-w-0">
            <p className="text-xs md:text-sm truncate" style={{ color: theme.text.secondary }}>
              {label}
            </p>
            <p
              className="text-sm md:text-base font-medium truncate"
              style={{ color: theme.text.primary }}
            >
              {date}
            </p>
          </div>
          {time && (
            <span
              className="text-xs md:text-sm opacity-70 whitespace-nowrap"
              style={{ color: theme.text.secondary }}
            >
              {time}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DetailTimeInfo({ theme, isDark, firstSeen, lastSeen }: DetailTimeInfoProps) {
  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.primary }} />
        <span
          className="text-sm md:text-base font-semibold"
          style={{ color: theme.primary }}
        >
          Informasi Waktu
        </span>
      </div>

      <TimeRow
        theme={theme}
        isDark={isDark}
        label="Pertama Daftar"
        value={firstSeen}
        iconColor="#0C5E3C"
        bgColor="rgba(12,94,60,0.1)"
        icon={Calendar}
      />
      <TimeRow
        theme={theme}
        isDark={isDark}
        label="Terakhir Scan"
        value={lastSeen}
        iconColor="#78C2A4"
        bgColor="rgba(120,194,164,0.1)"
        icon={Clock}
      />
    </div>
  );
}
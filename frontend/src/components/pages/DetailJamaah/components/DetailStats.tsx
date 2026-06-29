import { TrendingUp, Calendar, Clock, Loader2 } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { getThemeColors } from '../../../../lib/theme';

interface DetailStatsProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  loading: boolean;
  totalKehadiran: number;
  bulanIni: number;
  mingguIni: number;
}

interface StatCardItemProps {
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
  loading: boolean;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  icon: React.ElementType;
  label: string;
  value: number;
}

function StatCardItem({
  isDark,
  theme,
  loading,
  borderColor,
  bgColor,
  iconColor,
  icon: Icon,
  label,
  value,
}: StatCardItemProps) {
  return (
    <Card
      className={`p-3 md:p-4 border rounded-lg md:rounded-xl`}
      style={{
        borderColor,
        backgroundColor: isDark ? theme.background : '#F5F5F5',
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-1 md:mb-2"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-4 h-4 md:w-6 md:h-6" style={{ color: iconColor }} />
        </div>
        <p
          className="text-[10px] md:text-sm mb-1 truncate w-full"
          style={{ color: theme.text.secondary }}
        >
          {label}
        </p>
        {loading ? (
          <Loader2
            className="w-4 h-4 md:w-5 md:h-5 animate-spin"
            style={{ color: iconColor }}
          />
        ) : (
          <p
            className="text-lg md:text-2xl font-bold truncate w-full"
            style={{ color: theme.primary }}
          >
            {value}
          </p>
        )}
      </div>
    </Card>
  );
}

export function DetailStats({
  theme,
  isDark,
  loading,
  totalKehadiran,
  bulanIni,
  mingguIni,
}: DetailStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      <StatCardItem
        isDark={isDark}
        theme={theme}
        loading={loading}
        borderColor="rgba(12,94,60,0.2)"
        bgColor="rgba(12,94,60,0.1)"
        iconColor="#0C5E3C"
        icon={TrendingUp}
        label="Total Scan"
        value={totalKehadiran}
      />
      <StatCardItem
        isDark={isDark}
        theme={theme}
        loading={loading}
        borderColor="rgba(120,194,164,0.2)"
        bgColor="rgba(120,194,164,0.1)"
        iconColor="#78C2A4"
        icon={Calendar}
        label="Bulan Ini"
        value={bulanIni}
      />
      <StatCardItem
        isDark={isDark}
        theme={theme}
        loading={loading}
        borderColor="rgba(212,175,55,0.2)"
        bgColor="rgba(212,175,55,0.1)"
        iconColor="#D4AF37"
        icon={Clock}
        label="Minggu Ini"
        value={mingguIni}
      />
    </div>
  );
}
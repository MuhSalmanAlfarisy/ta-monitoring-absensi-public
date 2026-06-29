import { Users, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import { colors, spacing } from '../../../../lib/theme';
import type { ThemeColors } from '../../../../lib/theme';
import { StatCard } from './StatCard';

interface StatsCardsProps {
  theme: ThemeColors;
  isDark: boolean;
  totalJamaah: string;
  todayAttendance: string;
  todayTotal: string;
  tepatWaktuPercentage: string;
  attendancePercentage: string;
}

export function StatsCards({
  theme,
  isDark,
  totalJamaah,
  todayAttendance,
  todayTotal,
  tepatWaktuPercentage,
  attendancePercentage,
}: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Jamaah Terdaftar',
      value: totalJamaah,
      icon: Users,
      gradient: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
      change: '',
    },
    {
      title: 'Jamaah Hadir Hari Ini',
      value: todayAttendance,
      icon: UserCheck,
      gradient: `linear-gradient(135deg, ${colors.primary.light}, ${colors.primary.main})`,
      change: `${attendancePercentage}% dari total jamaah`,
    },
    {
      title: 'Ketepatan Waktu',
      value: `${tepatWaktuPercentage}%`,
      icon: TrendingUp,
      gradient: `linear-gradient(135deg, ${colors.gold.main}, ${colors.gold.dark})`,
      change: 'Hari ini',
    },
    {
      title: 'Total Scan Hari Ini',
      value: todayTotal,
      icon: Calendar,
      gradient: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
      change: 'Semua scan hari ini',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: spacing.md,
      }}
    >
      {cards.map((card) => (
        <StatCard
          key={card.title}
          theme={theme}
          isDark={isDark}
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          gradient={card.gradient}
        />
      ))}
    </div>
  );
}
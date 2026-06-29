import { colors } from '../../../../lib/theme';

export const getPhotoUrl = (url?: string | null): string | undefined => {
  if (url && url.startsWith('/')) {
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  }
  return url || undefined;
};

export type AttendanceStatusView = {
  label: string;
  background: string;
  color: string;
  icon: 'tepat' | 'terlambat' | 'di_luar';
};

export const getAttendanceStatusView = (
  status: string | null | undefined
): AttendanceStatusView => {
  if (status === 'TEPAT_WAKTU') {
    return {
      label: 'Tepat',
      background: `${colors.success}20`,
      color: colors.success,
      icon: 'tepat',
    };
  }
  if (status === 'DI_LUAR_WAKTU_SHOLAT') {
    return {
      label: 'Di Luar',
      background: '#6B728020',
      color: '#6B7280',
      icon: 'di_luar',
    };
  }
  return {
    label: 'Terlambat',
    background: `${colors.warning}20`,
    color: colors.warning,
    icon: 'terlambat',
  };
};

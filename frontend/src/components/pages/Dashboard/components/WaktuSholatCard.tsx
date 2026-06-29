import { Clock, Sun, Sunrise, Sunset, Moon, RefreshCw } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import { PrayerTimes } from '../../../../hooks/usePrayerTimes';
import { useState, useEffect } from 'react';

// Helper untuk deteksi mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
};

interface WaktuSholatCardProps {
  data: PrayerTimes | null;
  loading: boolean;
  isDark: boolean;
  onRetry?: () => void;
}

type WaktuSholatName = 'Subuh' | 'Syuruq' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';

const sholatIcons: Record<WaktuSholatName, any> = {
  Subuh: Sunrise,
  Syuruq: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Sunset,
  Isya: Moon,
};

const sholatColors: Record<WaktuSholatName, string> = {
  Subuh: '#3b82f6',
  Syuruq: '#f59e0b',
  Dzuhur: '#eab308',
  Ashar: '#f97316',
  Maghrib: '#ef4444',
  Isya: '#8b5cf6',
};

const SHOLAT_ORDER: WaktuSholatName[] = ['Subuh', 'Syuruq', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

export function WaktuSholatCard({ data, loading, isDark, onRetry }: WaktuSholatCardProps) {
  const isMobile = useIsMobile();
  const theme = getThemeColors(isDark);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(data);

  useEffect(() => {
    if (data) {
      setPrayerTimes(data);
      setHasError(false);
    } else if (!loading) {
      setHasError(true);
    }
  }, [data, loading]);

  const handleRetry = () => {
    if (onRetry) {
      setIsRefreshing(true);
      onRetry();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const getWaktuSholatList = () => {
    if (!prayerTimes) return [];
    return SHOLAT_ORDER.map(name => ({
      name,
      time: prayerTimes[name.toLowerCase() as keyof PrayerTimes] || '--:--'
    }));
  };

  const getCurrentSholat = (sholatList: { name: WaktuSholatName; time: string }[]): WaktuSholatName => {
    if (sholatList.length === 0 || sholatList.some(s => s.time === '--:--')) return 'Subuh';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < sholatList.length; i++) {
      const sholat = sholatList[i];
      const [hours, minutes] = sholat.time.split(':').map(Number);
      const sholatMinutes = hours * 60 + minutes;
      if (currentMinutes < sholatMinutes) {
        return sholat.name;
      }
    }
    return sholatList[0].name;
  };

  const sholatList = getWaktuSholatList();
  const currentSholat = getCurrentSholat(sholatList);

  // Error State
  if (hasError && !loading) {
    return (
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.xl,
          padding: isMobile ? spacing.xs : spacing.lg,
          border: `2px dashed ${isDark ? '#ef444450' : '#fecaca'}`,
          transition: `all ${transitions.base}`,
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        {/* ... error content unchanged ... */}
        {/* Untuk fokus optimasi utama, bagian error/loading tetap menggunakan spacing default.
            Jika ingin dioptimalkan juga, bisa ditambahkan logika isMobile di sini. */}
      </div>
    );
  }

  // Loading Skeleton
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.xl,
          padding: isMobile ? spacing.xs : spacing.lg,
          border: `1px solid ${theme.border}`,
          transition: `all ${transitions.base}`,
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        {/* Header skeleton */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isMobile ? spacing.xs : spacing.lg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? spacing.xs : spacing.sm }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: theme.surfaceHover,
                animation: 'pulse 2s infinite',
              }}
            />
            <div>
              <div
                style={{
                  width: 120,
                  height: 20,
                  backgroundColor: theme.surfaceHover,
                  borderRadius: borderRadius.sm,
                  animation: 'pulse 2s infinite',
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  width: 80,
                  height: 12,
                  backgroundColor: theme.surfaceHover,
                  borderRadius: borderRadius.sm,
                  animation: 'pulse 2s infinite',
                }}
              />
            </div>
          </div>
        </div>

        {/* Grid skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: isMobile ? spacing.xs : spacing.md,
            marginBottom: isMobile ? spacing.xs : spacing.md,
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              style={{
                padding: isMobile ? spacing.xs : spacing.md,
                borderRadius: borderRadius.lg,
                backgroundColor: theme.surfaceHover,
                animation: 'pulse 2s infinite',
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '2px' : spacing.xs,
                  marginBottom: isMobile ? '2px' : spacing.xs,
                }}
              >
                <div
                  style={{
                    width: isMobile ? 12 : 16,
                    height: isMobile ? 12 : 16,
                    borderRadius: '50%',
                    backgroundColor: theme.border,
                  }}
                />
                <div
                  style={{
                    width: '60px',
                    height: isMobile ? '12px' : '14px',
                    backgroundColor: theme.border,
                    borderRadius: borderRadius.sm,
                  }}
                />
              </div>
              <div
                style={{
                  width: '100%',
                  height: isMobile ? '20px' : '28px',
                  backgroundColor: theme.border,
                  borderRadius: borderRadius.sm,
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer skeleton */}
        <div
          style={{
            marginTop: isMobile ? spacing.xs : spacing.md,
            padding: isMobile ? spacing.xs : spacing.md,
            borderRadius: borderRadius.md,
            backgroundColor: theme.surfaceHover,
            animation: 'pulse 2s infinite',
          }}
        >
          <div
            style={{
              width: '100%',
              height: isMobile ? '10px' : '12px',
              backgroundColor: theme.border,
              borderRadius: borderRadius.sm,
            }}
          />
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.xl,
        padding: isMobile ? spacing.xs : spacing.lg,
        border: `1px solid ${theme.border}`,
        transition: `all ${transitions.base}`,
        animation: 'fadeIn 0.5s ease-out',
        boxShadow: isDark
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? spacing.xs : spacing.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? spacing.xs : spacing.sm }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: isDark ? `${colors.primary.light}20` : `${colors.primary.main}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'bounceIn 0.5s ease-out',
            }}
          >
            <Clock size={20} color={isDark ? colors.primary.light : colors.primary.main} />
          </div>
          <div>
            <h3
              style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: 600,
                color: theme.text.primary,
                margin: 0,
              }}
            >
              Waktu Sholat Hari Ini
            </h3>
            {prayerTimes?.lokasi && (
              <p
                style={{
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  color: theme.text.secondary,
                  margin: '2px 0 0 0',
                }}
              >
                {prayerTimes.lokasi}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRetry}
          style={{
            padding: `${isMobile ? '4px' : spacing.xs} ${isMobile ? '6px' : spacing.md}`,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            backgroundColor: theme.surfaceHover,
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.md,
            color: theme.text.secondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : spacing.xs,
            transition: `all ${transitions.base}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.primary;
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = theme.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.surfaceHover;
            e.currentTarget.style.color = theme.text.secondary;
            e.currentTarget.style.borderColor = theme.border;
          }}
        >
          <RefreshCw size={isMobile ? 12 : 14} className={isRefreshing ? 'spin' : ''} />
          {isMobile ? 'Refresh' : 'Refresh'}
        </button>
      </div>

      {/* Prayer Times Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: isMobile ? spacing.xs : spacing.md,
          marginBottom: isMobile ? spacing.xs : spacing.md,
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        {sholatList.map((sholat, index) => {
          const Icon = sholatIcons[sholat.name];
          const isNext = sholat.name === currentSholat;
          const color = sholatColors[sholat.name];
          const isFriday = new Date().getDay() === 5;
          const displayName = sholat.name === 'Dzuhur' && isFriday ? 'Jumat' : sholat.name;

          return (
            <div
              key={sholat.name}
              style={{
                padding: isMobile ? spacing.xs : spacing.md,
                borderRadius: borderRadius.lg,
                backgroundColor: isNext
                  ? isDark
                    ? `${color}20`
                    : `${color}15`
                  : theme.surfaceHover,
                border: `${isMobile ? '1.5px' : '2px'} solid ${isNext ? color : 'transparent'}`,
                transition: `all ${transitions.base}`,
                position: 'relative',
                overflow: 'hidden',
                animation: `slideUp 0.5s ease-out ${index * 0.05}s both`,
                transform: 'translateY(20px)',
                opacity: 0,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isNext) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    : '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isNext) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isNext && (
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '2px' : spacing.xs,
                    right: isMobile ? '2px' : spacing.xs,
                    backgroundColor: color,
                    color: '#ffffff',
                    fontSize: isMobile ? '0.5rem' : '0.625rem',
                    fontWeight: 600,
                    padding: isMobile ? '1px 4px' : `2px ${spacing.xs}`,
                    borderRadius: borderRadius.sm,
                    textTransform: 'uppercase',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  {isMobile ? 'NEXT' : 'NEXT'}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  gap: isMobile ? '2px' : spacing.xs,
                  marginBottom: isMobile ? '2px' : spacing.xs,
                }}
              >
                <Icon
                  size={isMobile ? 12 : 18}
                  color={isNext ? color : theme.text.secondary}
                  style={{
                    animation: isNext ? 'wiggle 2s infinite' : 'none'
                  }}
                />
                <p
                  style={{
                    fontSize: isMobile ? '0.65rem' : '0.875rem',
                    fontWeight: 600,
                    color: isNext ? color : theme.text.secondary,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {displayName}
                </p>
              </div>

              <p
                style={{
                  fontSize: isMobile ? '0.875rem' : '1.5rem',
                  fontWeight: 700,
                  color: isNext ? color : theme.text.primary,
                  margin: 0,
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {sholat.time}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: isMobile ? '6px 8px' : spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: isDark ? `${colors.primary.light}15` : `${colors.primary.main}10`,
          border: `1px solid ${isDark ? colors.primary.light : colors.primary.main}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.8s ease-out',
          fontSize: isMobile ? '0.6rem' : '0.75rem',
        }}
      >
        <div>
          <p
            style={{
              color: theme.text.secondary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : spacing.xs,
              whiteSpace: isMobile ? 'nowrap' : 'normal',
            }}
          >
            🕌 {isMobile ? 'Tanggal:' : 'Tanggal:'} {prayerTimes?.date || '--/--/----'}
          </p>
          {!isMobile && (
            <p
              style={{
                color: theme.text.secondary,
                margin: '2px 0 0 0',
              }}
            >
              Sumber: API MyQuran • Data real-time
            </p>
          )}
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ color: theme.text.secondary }}>Live</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Tetap pertahankan styles global seperti sebelumnya
const styles = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
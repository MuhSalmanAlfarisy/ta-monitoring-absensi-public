import { RefreshCw, TrendingUp } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors, shadows } from '../../../../lib/theme';

interface RiwayatHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  isDark: boolean;
  dataCount: number;
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onRefresh: () => void;
}

export function RiwayatHeader({ theme, isMobile, isDark, dataCount, total, page, totalPages, loading, onRefresh }: RiwayatHeaderProps) {
  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: borderRadius.lg,
        padding: isMobile ? spacing.md : spacing.lg,
        border: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
        transition: 'all 0.3s',
        boxShadow: isDark
          ? '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)'
          : '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? spacing.sm : spacing.md, flex: 1, minWidth: 0 }}>
        {/* Title icon */}
        <div
          style={{
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            backgroundColor: `${theme.primary}15`,
            borderRadius: isMobile ? borderRadius.sm : borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TrendingUp size={isMobile ? 22 : 26} color={theme.primary} />
        </div>

        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: isMobile ? 'clamp(0.95rem, 4vw, 1.1rem)' : '1.75rem',
              fontWeight: 800,
              color: theme.text.primary,
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Riwayat Absensi
          </h2>
          <span
            style={{
              color: theme.text.tertiary,
              fontSize: isMobile ? 'clamp(0.55rem, 2.1vw, 0.7rem)' : '0.8rem',
              fontFamily: 'monospace',
              display: 'block',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
            }}
          >
            Menampilkan{' '}
            <strong style={{ color: colors.success }}>{dataCount}</strong>{' '}
            dari{' '}
            <strong style={{ color: colors.success }}>{total}</strong>{' '}
            data · Hal{' '}
            <strong style={{ color: colors.success }}>{page}</strong>{' '}
            /{' '}
            <strong style={{ color: colors.success }}>{totalPages || 1}</strong>
          </span>
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={() => onRefresh()}
        disabled={loading}
        className="refresh-btn-riwayat"
        style={{
          padding: isMobile ? '0.5rem' : '0.75rem 1.25rem',
          minWidth: isMobile ? '40px' : 'auto',
          height: isMobile ? '40px' : 'auto',
          background: theme.surfaceHover,
          border: `1px solid ${theme.border}40`,
          borderRadius: isMobile ? '50%' : borderRadius.md,
          color: theme.text.secondary,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontFamily: 'inherit',
          transition: 'all 0.3s',
          flexShrink: 0,
        }}
      >
        <RefreshCw 
          size={isMobile ? 18 : 14} 
          className={loading ? 'animate-spin' : ''} 
        />
        {!isMobile && 'Refresh Data'}
      </button>

      <style>{`
        .refresh-btn-riwayat:hover:not(:disabled) {
          border-color: ${colors.primary.main} !important;
          color: ${theme.text.primary} !important;
          transform: translateY(-2px);
          background: ${theme.surface} !important;
          box-shadow: ${shadows.md};
        }
      `}</style>
    </div>
  );
}

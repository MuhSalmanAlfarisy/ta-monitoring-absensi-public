import { spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import { Skeleton } from '../../../ui/skeleton';
import '../../../../styles/laporan-statistik.css';

interface LaporanSkeletonProps {
  isDark: boolean;
}

export function LaporanSkeleton({ isDark }: LaporanSkeletonProps) {
  const theme = getThemeColors(isDark);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      {/* Header Skeleton */}
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          border: `1px solid ${theme.border}`,
          transition: `all ${transitions.base}`,
        }}
      >
        <div className="laporan-header">
          <div style={{ width: '100%' }}>
            <Skeleton style={{ height: '32px', width: '200px', marginBottom: spacing.xs }} />
            <Skeleton style={{ height: '20px', width: '300px' }} />
          </div>
        </div>
      </div>

      {/* Insight Cards Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
          gap: spacing.lg,
        }}
      >
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              border: `1px solid ${theme.border}`,
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <Skeleton style={{ height: '16px', width: '120px', marginBottom: spacing.xs }} />
              <Skeleton style={{ height: '12px', width: '80px', marginBottom: spacing.md }} />
              <Skeleton style={{ height: '28px', width: '100px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Skeleton style={{ height: '16px', width: '16px', borderRadius: '50%' }} />
              <Skeleton style={{ height: '14px', width: '100px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 Skeleton */}
      <div className="charts-grid-laporan">
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              border: `1px solid ${theme.border}`,
              height: '350px',
            }}
          >
            <div style={{ marginBottom: spacing.lg, display: 'flex', justifyContent: 'space-between' }}>
               <div>
                  <Skeleton style={{ height: '24px', width: '180px', marginBottom: spacing.xs }} />
                  <Skeleton style={{ height: '16px', width: '220px' }} />
               </div>
               <Skeleton style={{ height: '36px', width: '120px', borderRadius: borderRadius.md }} />
            </div>
            <Skeleton style={{ height: '230px', width: '100%' }} />
          </div>
        ))}
      </div>

      {/* Charts Row 2 Skeleton */}
      <div className="charts-grid-laporan">
       {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: theme.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              border: `1px solid ${theme.border}`,
              height: '350px',
            }}
          >
            <div style={{ marginBottom: spacing.lg, display: 'flex', justifyContent: 'space-between' }}>
               <div>
                  <Skeleton style={{ height: '24px', width: '180px', marginBottom: spacing.xs }} />
                  <Skeleton style={{ height: '16px', width: '220px' }} />
               </div>
               <Skeleton style={{ height: '36px', width: '120px', borderRadius: borderRadius.md }} />
            </div>
            <Skeleton style={{ height: '230px', width: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

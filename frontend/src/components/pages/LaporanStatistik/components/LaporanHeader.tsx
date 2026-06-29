import { spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import '../../../../styles/laporan-statistik.css';

interface LaporanHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
}

export function LaporanHeader({ theme }: LaporanHeaderProps) {
  return (
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
        <div>
          <h2
            className="laporan-title"
            style={{
              fontWeight: 700,
              color: theme.text.primary,
              margin: 0,
              marginBottom: spacing.xs,
            }}
          >
            Laporan & Statistik
          </h2>
          <p
            className="laporan-subtitle"
            style={{ color: theme.text.secondary, margin: 0 }}
          >
            Analisis kehadiran jamaah dan tren absensi
          </p>
        </div>
      </div>
    </div>
  );
}
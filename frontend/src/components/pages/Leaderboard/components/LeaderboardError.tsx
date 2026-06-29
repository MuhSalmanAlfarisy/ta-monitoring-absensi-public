import { AlertCircle } from 'lucide-react';
import { spacing, borderRadius } from '../../../../lib/theme';

interface LeaderboardErrorProps {
  message: string;
  onRetry: () => void;
}

export function LeaderboardError({ message, onRetry }: LeaderboardErrorProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        fontSize: '0.875rem',
      }}
    >
      <AlertCircle size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: borderRadius.sm,
          backgroundColor: '#ffcdd2',
          color: '#d32f2f',
          border: 'none',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        Coba Lagi
      </button>
    </div>
  );
}
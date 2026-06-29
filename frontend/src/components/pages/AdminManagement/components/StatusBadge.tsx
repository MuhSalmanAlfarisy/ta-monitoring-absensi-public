import { borderRadius } from '../../../../lib/theme';

interface StatusBadgeProps {
  status: 'waiting' | 'active';
}

const STATUS_CONFIG = {
  waiting: {
    label: 'Menunggu Registrasi',
    bgColor: '#FEF3C7',
    textColor: '#92400E',
    dotColor: '#F59E0B',
  },
  active: {
    label: 'Aktif',
    bgColor: '#D1FAE5',
    textColor: '#065F46',
    dotColor: '#10B981',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bgColor, textColor, dotColor } = STATUS_CONFIG[status];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: borderRadius.full,
        backgroundColor: bgColor,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: borderRadius.full,
          backgroundColor: dotColor,
        }}
      />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textColor }}>
        {label}
      </span>
    </div>
  );
}

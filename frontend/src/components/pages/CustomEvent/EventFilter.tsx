import { motion } from 'framer-motion';
import { colors, spacing, borderRadius, getThemeColors } from '../../../lib/theme';

type FilterValue = 'all' | 'active' | 'completed' | 'upcoming';

interface EventFilterProps {
  filter: FilterValue;
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
  onChange: (value: FilterValue) => void;
}

const FILTER_LABELS: Record<FilterValue, string> = {
  all: 'Semua',
  active: 'Aktif',
  completed: 'Selesai',
  upcoming: 'Mendatang',
};

export function EventFilter({
  filter,
  isDark,
  theme,
  onChange,
}: EventFilterProps) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing.xs,
        display: 'flex',
        gap: spacing.xs,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        boxShadow: isDark
          ? '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)'
          : '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
      }}
    >
      <style>{`.event-filter-scroller::-webkit-scrollbar { display: none; }`}</style>

      {(Object.keys(FILTER_LABELS) as FilterValue[]).map((f) => {
        const isActive = filter === f;
        return (
          <motion.button
            key={f}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(f)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: borderRadius.md,
              border: 'none',
              background: isActive
                ? `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})`
                : 'transparent',
              color: isActive ? '#ffffff' : theme.text.secondary,
              fontSize: '0.875rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              boxShadow: isActive ? `0 4px 12px ${colors.primary.main}40` : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {FILTER_LABELS[f]}
          </motion.button>
        );
      })}
    </div>
  );
}
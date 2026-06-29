import { Trash2 } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

type TabType = 'sholat' | 'diluar' | 'event';

interface RiwayatTabBarProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  isDark: boolean;
  tab: TabType;
  canUseOutsideSelection: boolean;
  selectionMode: boolean;
  selectedOutsideIds: number[];
  isDeletingSelected: boolean;
  onTabChange: (tab: TabType) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

const TAB_CONFIG: { key: TabType; label: string; icon: string }[] = [
  { key: 'sholat', label: 'Sholat', icon: '🕌' },
  { key: 'diluar', label: 'Diluar Waktu Sholat', icon: '🚶' },
  { key: 'event', label: 'Event', icon: '📅' },
];

export function RiwayatTabBar({
  isMobile,
  isDark,
  tab,
  canUseOutsideSelection,
  selectionMode,
  selectedOutsideIds,
  isDeletingSelected,
  onTabChange,
  onDeleteSelected,
  onClearSelection,
  theme,
}: RiwayatTabBarProps) {
  // Mobile layout - with tabs that only show label when active
  if (isMobile) {
    return (
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: borderRadius.lg,
          padding: spacing.xs,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          boxShadow: isDark
            ? '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)'
            : '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
        }}
      >
        {/* Top row - Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.xs,
            overflowX: 'auto' as const,
            scrollbarWidth: 'none' as const,
            msOverflowStyle: 'none' as const,
            paddingBottom: '2px',
          }}
        >
          {TAB_CONFIG.map(({ key, label, icon }) => {
            const isActive = tab === key;
            const showCount =
              canUseOutsideSelection && selectionMode && selectedOutsideIds.length > 0 && tab === key;

            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                style={{
                  padding: isActive ? '0.625rem 1rem' : '0.625rem 0.875rem',
                  borderRadius: borderRadius.md,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: isActive ? '#ffffff' : theme.text.secondary,
                  cursor: 'pointer',
                  border: 'none',
                  background: isActive ? `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})` : 'transparent',
                  boxShadow: isActive ? `0 4px 12px ${colors.primary.main}40` : 'none',
                  whiteSpace: 'nowrap' as const,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  fontFamily: 'inherit',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                {isActive && label}
                {showCount && (
                  <span
                    style={{
                      padding: '0.125rem 0.4rem',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: borderRadius.sm,
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedOutsideIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom row - Selection Controls (Mobile) */}
        {canUseOutsideSelection && selectionMode && selectedOutsideIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              padding: `0 ${spacing.xs} ${spacing.xs} ${spacing.xs}`,
              borderTop: `1px solid ${theme.border}`,
              paddingTop: spacing.xs,
              marginTop: spacing.xs,
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            <button
              onClick={onDeleteSelected}
              disabled={isDeletingSelected}
              style={{
                flex: 1,
                height: 44,
                borderRadius: borderRadius.md,
                border: 'none',
                background: colors.error,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isDeletingSelected ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: isDeletingSelected ? 0.7 : 1,
              }}
            >
              <Trash2 size={18} />
              Hapus {selectedOutsideIds.length} Data
            </button>
            <button
              onClick={onClearSelection}
              disabled={isDeletingSelected}
              style={{
                padding: `0 ${spacing.lg}`,
                height: 44,
                borderRadius: borderRadius.md,
                border: `1px solid ${theme.border}`,
                background: theme.surfaceHover,
                color: theme.text.secondary,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isDeletingSelected ? 'not-allowed' : 'pointer',
              }}
            >
              Batal
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout - with centered tabs
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: borderRadius.lg,
        padding: spacing.xs,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        flexWrap: 'nowrap' as const,
        boxShadow: isDark
          ? '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)'
          : '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
      }}
    >
      {/* Empty div for balance when selection controls are present */}
      {canUseOutsideSelection && selectionMode && selectedOutsideIds.length > 0 ? (
        <div style={{ width: '80px' }} />
      ) : null}

      {/* Centered Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flex: 1,
          gap: spacing.xs,
          overflowX: 'auto' as const,
          scrollbarWidth: 'none' as const,
          msOverflowStyle: 'none' as const,
        }}
      >
        {TAB_CONFIG.map(({ key, label, icon }) => {
          const isActive = tab === key;
          const showCount =
            canUseOutsideSelection && selectionMode && selectedOutsideIds.length > 0 && tab === key;

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: borderRadius.md,
                fontWeight: 700,
                fontSize: '0.95rem',
                color: isActive ? '#ffffff' : theme.text.secondary,
                cursor: 'pointer',
                border: 'none',
                background: isActive ? `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})` : 'transparent',
                boxShadow: isActive ? `0 4px 12px ${colors.primary.main}40` : 'none',
                whiteSpace: 'nowrap' as const,
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing.sm,
                fontFamily: 'inherit',
                transition: 'all 0.3s',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              {label}
              {showCount && (
                <span
                  style={{
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: borderRadius.sm,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    marginLeft: 4,
                  }}
                >
                  {selectedOutsideIds.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection controls - right side */}
      {canUseOutsideSelection && selectionMode && selectedOutsideIds.length > 0 ? (
        <div style={{ display: 'flex', gap: spacing.sm, flexShrink: 0 }}>
          <button
            onClick={onDeleteSelected}
            disabled={isDeletingSelected}
            title="Hapus data terpilih"
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.md,
              border: `1px solid ${isDeletingSelected ? theme.border : colors.error}40`,
              background: isDeletingSelected ? theme.surfaceHover : `${colors.error}15`,
              color: isDeletingSelected ? theme.text.tertiary : colors.error,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDeletingSelected ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClearSelection}
            disabled={isDeletingSelected}
            style={{
              padding: '0 1.25rem',
              height: 40,
              borderRadius: borderRadius.md,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text.secondary,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isDeletingSelected ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.3s',
            }}
          >
            Batal
          </button>
        </div>
      ) : (
        // Empty div for balance when no selection controls
        <div style={{ width: '80px' }} />
      )}
</div>
  );
}
import { Filter, Search, ChevronDown, X } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';
import { MultiSelect } from '../../../ui/MultiSelect';

interface FilterControls {
  search: string;
  startDate: string;
  endDate: string;
  waktuSholat: string[];
  status: string;
  setSearch: (v: string) => void;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  setWaktuSholat: (v: string[]) => void;
  setStatus: (v: any) => void;
}

type TabType = 'sholat' | 'diluar' | 'event';

interface RiwayatFiltersProps {
  theme: ReturnType<typeof getThemeColors>;
  filters: FilterControls;
  isMobile: boolean;
  showFilters: boolean;
  isRamadhanActive: boolean;
  activeTab: TabType;
  isDark: boolean;
  onToggleFilters: () => void;
  onSetPage: (page: number) => void;
}

export function RiwayatFilters({
  theme,
  filters,
  isMobile,
  showFilters,
  isRamadhanActive,
  activeTab,
  isDark,
  onToggleFilters,
  onSetPage,
}: RiwayatFiltersProps) {
  const showSholatFilters = activeTab === 'sholat';
  const isPanelOpen = !isMobile || showFilters;

  const hasActiveFilter =
    Boolean(filters.search) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    (showSholatFilters && filters.waktuSholat.length > 0) ||
    (showSholatFilters && filters.status !== 'semua');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surface,
    color: theme.text.primary,
    fontSize: isMobile ? '0.8125rem' : '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    maxWidth: '100%',
  };

  const resetFilters = () => {
    filters.setSearch('');
    filters.setStartDate('');
    filters.setEndDate('');
    filters.setWaktuSholat([]);
    filters.setStatus('semua');
    onSetPage(1);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = colors.primary.main;
    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary.main}20`;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: borderRadius.lg,
        border: `1px solid ${theme.border}`,
        overflow: isMobile ? (isPanelOpen ? 'visible' : 'hidden') : 'visible',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        boxShadow: isDark
          ? '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)'
          : '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
      }}
    >
      <div
        onClick={() => {
          if (isMobile) onToggleFilters();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: isMobile ? spacing.md : `${spacing.md} ${spacing.lg}`,
          cursor: isMobile ? 'pointer' : 'default',
          backgroundColor: isMobile && showFilters ? theme.surfaceHover : 'transparent',
          transition: 'background-color 0.2s',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Filter size={isMobile ? 16 : 18} color={theme.text.primary} />
          {hasActiveFilter && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                background: colors.primary.main,
                borderRadius: '50%',
                border: `2px solid ${theme.surface}`,
              }}
            />
          )}
        </div>

        <span style={{ flex: 1, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, color: theme.text.primary }}>
          Filter Pencarian {hasActiveFilter && <span style={{ color: colors.primary.main }}>(Aktif)</span>}
        </span>

        {isMobile && (
          <ChevronDown
            size={18}
            color={theme.text.secondary}
            style={{
              transform: `rotate(${showFilters ? 180 : 0}deg)`,
              transition: 'transform 0.3s',
            }}
          />
        )}
      </div>

      <div
        style={{
          maxHeight: isMobile ? (showFilters ? '720px' : '0') : 'none',
          opacity: isPanelOpen ? 1 : 0,
          overflow: isPanelOpen ? 'visible' : 'hidden',
          transition: isMobile
            ? 'max-height 0.35s ease-in-out, opacity 0.25s ease-in-out, padding 0.3s ease-in-out'
            : 'none',
          padding: isPanelOpen
            ? (isMobile ? `0 ${spacing.md} ${spacing.md}` : `0 ${spacing.lg} ${spacing.lg}`)
            : '0',
          borderTop: isPanelOpen ? `1px solid ${theme.border}30` : 'none',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'visible',
          }}
        >
          <div style={{ position: 'relative', width: '100%', minWidth: 0, maxWidth: '100%' }}>
            <Search
              size={16}
              color={theme.text.tertiary}
              style={{ position: 'absolute', left: spacing.sm, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
            />
            <input
              type="text"
              placeholder="Cari nama jamaah..."
              value={filters.search || ''}
              onChange={(e) => {
                filters.setSearch(e.target.value);
                onSetPage(1);
              }}
              style={{ ...inputStyle, paddingLeft: '36px' }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, width: '100%', minWidth: 0 }}>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => {
                filters.setStartDate(e.target.value);
                onSetPage(1);
              }}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <input
              type="date"
              value={filters.endDate || ''}
              min={filters.startDate || undefined}
              disabled={!filters.startDate}
              onChange={(e) => {
                filters.setEndDate(e.target.value);
                onSetPage(1);
              }}
              style={{
                ...inputStyle,
                opacity: !filters.startDate ? 0.6 : 1,
                cursor: !filters.startDate ? 'not-allowed' : 'text',
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {showSholatFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, width: '100%', minWidth: 0 }}>
              <MultiSelect
                options={[
                  { value: 'Subuh', label: 'Subuh' },
                  { value: 'Dzuhur', label: 'Dzuhur' },
                  { value: 'Ashar', label: 'Ashar' },
                  { value: 'Maghrib', label: 'Maghrib' },
                  { value: 'Isya', label: 'Isya' },
                  ...(isRamadhanActive ? [{ value: 'Tarawih', label: 'Tarawih' }] : []),
                ]}
                selectedValues={filters.waktuSholat}
                onChange={(vals) => {
                  filters.setWaktuSholat(vals);
                  onSetPage(1);
                }}
                placeholder="Semua Waktu"
                theme={theme}
              />

              <select
                value={filters.status || 'semua'}
                onChange={(e) => {
                  filters.setStatus(e.target.value as any);
                  onSetPage(1);
                }}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              >
                <option value="semua">Semua Status</option>
                <option value="tepat-waktu">Tepat Waktu</option>
                <option value="terlambat">Terlambat</option>
              </select>
            </div>
          )}

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              style={{
                alignSelf: 'flex-start',
                padding: `${spacing.xs} ${spacing.md}`,
                borderRadius: borderRadius.md,
                border: `1px solid ${theme.border}`,
                backgroundColor: 'transparent',
                color: theme.text.secondary,
                fontSize: isMobile ? '0.8125rem' : '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.error;
                e.currentTarget.style.color = colors.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.color = theme.text.secondary;
              }}
            >
              <X size={14} />
              Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight, Grid3x3, List } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { getThemeColors } from '../../../../lib/theme';

interface RiwayatPaginationProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  page: number;
  totalPages: number;
  dataCount: number;
  total: number;
  loading: boolean;
  viewMode: 'grid' | 'list';
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function RiwayatPagination({
  theme,
  isDark,
  page,
  totalPages,
  dataCount,
  total,
  loading,
  viewMode,
  onPrev,
  onNext,
  onViewModeChange,
}: RiwayatPaginationProps) {
  if (totalPages <= 1) return null;

  const toggleBg = isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6';

  const viewBtnStyle = (active: boolean) => ({
    backgroundColor: active ? (isDark ? '#4B5563' : '#FFFFFF') : 'transparent',
    color: active ? '#0C5E3C' : theme.text.secondary,
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
  });

  return (
    <div
      className="flex flex-col xs:flex-row items-center justify-between mt-4 pt-3 border-t gap-2"
      style={{ borderColor: theme.border }}
    >
      <div className="flex items-center gap-2">
        <div className="text-xs whitespace-nowrap" style={{ color: theme.text.secondary }}>
          {page}/{totalPages} • {dataCount}/{total}
        </div>
        <div className="flex rounded p-0.5" style={{ backgroundColor: toggleBg }}>
          <Button
            size="sm" variant="ghost" className="p-0.5 h-6 w-6"
            style={viewBtnStyle(viewMode === 'grid')}
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
          >
            <Grid3x3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm" variant="ghost" className="p-0.5 h-6 w-6"
            style={viewBtnStyle(viewMode === 'list')}
            onClick={() => onViewModeChange('list')}
            title="List View"
          >
            <List className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          onClick={onPrev}
          disabled={page === 1 || loading}
          variant="outline"
          size="sm"
          className="px-2 h-7 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: theme.primary, borderColor: theme.primary }}
        >
          <ChevronLeft className="w-3 h-3 mr-0.5" />
          <span className="hidden xs:inline">Prev</span>
        </Button>
        <Button
          onClick={onNext}
          disabled={page === totalPages || loading}
          size="sm"
          className="px-2 h-7 text-xs bg-[#0C5E3C] hover:bg-[#0a4d30] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
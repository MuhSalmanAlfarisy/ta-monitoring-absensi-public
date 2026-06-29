import { ArrowLeft, Grid3x3, List } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { getThemeColors } from '../../../../lib/theme';

interface RiwayatKehadiranHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  jamaahNama: string;
  total: number;
  viewMode: 'grid' | 'list';
  onBack: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function RiwayatKehadiranHeader({
  theme,
  isDark,
  jamaahNama,
  total,
  viewMode,
  onBack,
  onViewModeChange,
}: RiwayatKehadiranHeaderProps) {
  const toggleBg = isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6';

  const viewBtnStyle = (active: boolean) => ({
    backgroundColor: active ? (isDark ? '#4B5563' : '#FFFFFF') : 'transparent',
    color: active ? theme.primary : theme.text.secondary,
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
  });

  return (
    <Card
      className="p-4 shadow-sm"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            style={{ borderColor: theme.border, color: theme.text.secondary, backgroundColor: 'transparent' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate" style={{ color: theme.text.primary }}>
              Riwayat Kehadiran
            </h2>
            <p className="text-xs truncate" style={{ color: theme.text.secondary }}>{jamaahNama}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            className="text-xs px-2 py-0 border-none"
            style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
          >
            {total} Total
          </Badge>

          {/* View Toggle - hidden on mobile */}
          <div className="hidden sm:flex rounded p-0.5" style={{ backgroundColor: toggleBg }}>
            <Button
              size="sm" variant="ghost" className="p-1 h-7 w-7"
              style={viewBtnStyle(viewMode === 'grid')}
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm" variant="ghost" className="p-1 h-7 w-7"
              style={viewBtnStyle(viewMode === 'list')}
              onClick={() => onViewModeChange('list')}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
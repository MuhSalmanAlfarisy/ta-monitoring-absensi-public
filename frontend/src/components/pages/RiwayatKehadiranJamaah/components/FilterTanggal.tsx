import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { getThemeColors } from '../../../../lib/theme';

interface FilterTanggalProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  startDate: string;
  endDate: string;
  loading: boolean;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onReset: () => void;
}

export function FilterTanggal({
  theme,
  isDark,
  startDate,
  endDate,
  loading,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: FilterTanggalProps) {
  const dateInputWrapStyle = {
    backgroundColor: isDark ? theme.background : '#FFFFFF',
    borderColor: theme.border,
  };

  return (
    <Card
      className="p-3 border-none overflow-x-auto"
      style={{ backgroundColor: theme.surface, color: theme.text.primary }}
    >
      <div className="flex items-center gap-3 w-max min-w-full">
        {/* Icon + Label */}
        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: theme.primary }}>
          <Calendar className="w-4 h-4" />
          <h3 className="text-sm font-semibold sr-only md:not-sr-only">Filter Tanggal</h3>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-1">
          {/* Dari */}
          <div className="min-w-[120px]">
            <Label className="sr-only">Dari Tanggal</Label>
            <div className="flex items-center h-8 px-2 gap-1.5 rounded-md border" style={dateInputWrapStyle}>
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="border-none p-0 h-auto text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ backgroundColor: 'transparent', color: theme.text.primary }}
              />
            </div>
          </div>

          <span className="text-gray-400 text-xs flex-shrink-0">s/d</span>

          {/* Sampai */}
          <div className="min-w-[120px]">
            <Label className="sr-only">Sampai Tanggal</Label>
            <div 
              className="flex items-center h-8 px-2 gap-1.5 rounded-md border" 
              style={{
                ...dateInputWrapStyle,
                opacity: !startDate ? 0.6 : 1,
                cursor: !startDate ? 'not-allowed' : 'pointer'
              }}
            >
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                disabled={!startDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="border-none p-0 h-auto text-xs focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-100"
                style={{ backgroundColor: 'transparent', color: theme.text.primary, cursor: !startDate ? 'not-allowed' : 'pointer' }}
              />
            </div>
          </div>

          {/* Reset */}
          <Button
            className="bg-[#0C5E3C] hover:bg-[#0a4d30] h-8 px-3 text-xs flex-shrink-0"
            onClick={onReset}
            disabled={loading}
          >
            {loading && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
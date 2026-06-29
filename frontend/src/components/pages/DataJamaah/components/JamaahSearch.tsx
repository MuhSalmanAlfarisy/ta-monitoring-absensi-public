import { Search } from 'lucide-react';
import { Card } from '../../../ui/card';
import { Input } from '../../../ui/input';
import { Badge } from '../../../ui/badge';
import { getThemeColors } from '../../../../lib/theme';

interface JamaahSearchProps {
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
  search: string;
  total: number;
  onSearchChange: (value: string) => void;
}

export function JamaahSearch({ isDark, theme, search, total, onSearchChange }: JamaahSearchProps) {
  return (
    <Card className="p-3 border-none" style={{ backgroundColor: theme.surface }}>
      <div className="flex items-center gap-2 w-full">
        {/* Search Input */}
        <div
          className="flex items-center h-9 px-3 gap-2 rounded-lg border flex-1 min-w-0 transition-colors duration-200"
          style={{
            backgroundColor: isDark ? theme.background : 'white',
            borderColor: theme.border,
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: theme.text.tertiary }} />
          <Input
            placeholder="Cari nama atau ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-none p-0 h-auto text-sm truncate focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            style={{ color: theme.text.primary }}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="flex-shrink-0 hover:opacity-70 transition-opacity w-4 h-4 relative"
              aria-label="Clear search"
              style={{ color: theme.text.tertiary }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-lg leading-none font-light">
                ×
              </span>
            </button>
          )}
        </div>

        {/* Total Badge */}
        <Badge
          variant="outline"
          className="h-9 px-3 text-xs font-medium whitespace-nowrap flex-shrink-0"
          style={{
            color: theme.primary,
            borderColor: theme.primary,
            backgroundColor: isDark ? `${theme.primary}15` : `${theme.primary}08`,
          }}
        >
          <span className="hidden sm:inline">{total} Data</span>
          <span className="sm:hidden">{total}</span>
        </Badge>
      </div>
    </Card>
  );
}

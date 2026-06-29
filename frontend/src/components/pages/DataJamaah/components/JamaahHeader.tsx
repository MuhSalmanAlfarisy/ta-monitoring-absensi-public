import { User, RefreshCw } from 'lucide-react';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { getThemeColors } from '../../../../lib/theme';

interface JamaahHeaderProps {
  theme: ReturnType<typeof getThemeColors>;
  loading: boolean;
  onRefresh: () => void;
}

export function JamaahHeader({ theme, loading, onRefresh }: JamaahHeaderProps) {
  return (
    <Card
      className="p-4 shadow-sm"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <User className="w-5 h-5" style={{ color: theme.primary }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: theme.text.primary }}>
              Data Jamaah Terdaftar
            </h2>
            <p className="text-xs" style={{ color: theme.text.secondary }}>
              Data jamaah dari mesin absensi secara realtime
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          style={{
            borderColor: theme.border,
            color: theme.text.secondary,
            backgroundColor: 'transparent',
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}

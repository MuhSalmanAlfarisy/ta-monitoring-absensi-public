import { Moon, Sun } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import { getThemeColors } from '../../../../lib/theme';

interface TampilanCardProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  onDarkModeChange: (checked: boolean) => void;
}

export function TampilanCard({ theme, isDark, onDarkModeChange }: TampilanCardProps) {
  return (
    <Card
      className="p-4 space-y-4"
      style={{ backgroundColor: theme.surface, color: theme.text.primary }}
    >
      <div className="flex items-center gap-2" style={{ color: theme.primary }}>
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
        <h2 className="font-medium">Tampilan</h2>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="dark-mode">Mode Gelap</Label>
        <Switch
          id="dark-mode"
          checked={isDark}
          onCheckedChange={onDarkModeChange}
          className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:hover:bg-gray-400 border-2 border-transparent data-[state=unchecked]:border-gray-300"
        />
      </div>
    </Card>
  );
}
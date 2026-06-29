import { AlertTriangle, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from './button';
import { getThemeColors } from '../../lib/theme';

interface ConfirmModalProps {
  theme: ReturnType<typeof getThemeColors>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  theme,
  title,
  description,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: <AlertCircle className="w-8 h-8 text-orange-600" />,
          iconBg: 'bg-orange-100',
          confirmBtn: 'bg-orange-600 hover:bg-orange-700',
        };
      case 'info':
        return {
          icon: <Info className="w-8 h-8 text-blue-600" />,
          iconBg: 'bg-blue-100',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'danger':
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
          iconBg: 'bg-red-100',
          confirmBtn: 'bg-red-600 hover:bg-red-700',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 !m-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mb-2`}>
            {styles.icon}
          </div>

          <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>
            {title}
          </h3>

          <div className="text-sm w-full" style={{ color: theme.text.secondary }}>
            {description}
          </div>

          <div className="flex gap-3 w-full mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              className={`flex-1 text-white border-none ${styles.confirmBtn}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { getThemeColors } from '../../../../lib/theme';

interface DeleteConfirmModalProps {
  theme: ReturnType<typeof getThemeColors>;
  nama: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  theme,
  nama,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 !m-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>
            Hapus Jamaah?
          </h3>

          <div className="text-sm space-y-2" style={{ color: theme.text.secondary }}>
            <p>
              Anda akan menghapus data jamaah{' '}
              <span className="font-bold text-red-500">{nama}</span> dari website.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-left">
              <p className="font-bold mb-1">⚠️ PERHATIAN PENTING:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Data HANYA terhapus dari database website.</li>
                <li>Data di MESIN ABSENSI tidak akan terhapus.</li>
                <li>Jika jamaah ini scan lagi, data akan otomatis muncul kembali.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
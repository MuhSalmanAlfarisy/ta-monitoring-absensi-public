import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface DetailActionsProps {
  onViewRiwayat: () => void;
  onDeleteClick: () => void;
  showDelete?: boolean;
}

export function DetailActions({ onViewRiwayat, onDeleteClick, showDelete }: DetailActionsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-3">
      <Button
        onClick={onViewRiwayat}
        className="flex-1 bg-gradient-to-r from-[#0C5E3C] to-[#78C2A4] hover:from-[#0a4d30] hover:to-[#65a890] text-white py-2 md:py-3 text-sm md:text-base shadow-md"
      >
        <span className="truncate">Lihat Riwayat Kehadiran</span>
        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1.5 md:ml-2 flex-shrink-0" />
      </Button>

      {showDelete && (
        <Button
          onClick={onDeleteClick}
          variant="ghost"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 px-3 md:px-4"
          title="Hapus Data Jamaah"
        >
          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline ml-2">Hapus Data Jamaah</span>
        </Button>
      )}
    </div>
  );
}
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../ui/button';
import { getThemeColors } from '../../../../lib/theme';

interface PaginationInfo {
  skip: number;
  limit: number;
  total: number;
  has_more: boolean;
}

interface JamaahPaginationProps {
  theme: ReturnType<typeof getThemeColors>;
  pagination: PaginationInfo;
  loading: boolean;
  onRefetch: (page: number) => void;
}

export function JamaahPagination({ theme, pagination, loading, onRefetch }: JamaahPaginationProps) {
  const { skip, limit, has_more } = pagination;
  const currentPage = Math.floor(skip / limit) + 1;

  if (!has_more && skip === 0) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <Button
        variant="outline"
        onClick={() => onRefetch(Math.max(1, currentPage - 1))}
        disabled={skip === 0 || loading}
        className="flex items-center gap-1 text-xs px-2 py-1"
      >
        <ChevronLeft className="w-3 h-3" />
        Sebelumnya
      </Button>

      <p className="text-xs" style={{ color: theme.text.secondary }}>
        Halaman {currentPage}
      </p>

      <Button
        onClick={() => onRefetch(currentPage + 1)}
        disabled={!has_more || loading}
        className="flex items-center gap-1 text-xs px-2 py-1 bg-[#0C5E3C] hover:bg-[#0a4d30] text-white"
      >
        Selanjutnya
        <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );
}

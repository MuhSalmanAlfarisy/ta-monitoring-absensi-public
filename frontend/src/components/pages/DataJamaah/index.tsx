import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { getThemeColors } from '../../../lib/theme';
import { useJamaahList } from '../../../hooks/useJamaah';
import type { JamaahResponse } from '../../../lib/types';

import { JamaahHeader } from './components/JamaahHeader';
import { JamaahSearch } from './components/JamaahSearch';
import { JamaahList } from './components/JamaahList';
import { JamaahPagination } from './components/JamaahPagination';
import { JamaahInfoNote } from './components/JamaahInfoNote';
import { DetailJamaah } from '../DetailJamaah/index';
import { RiwayatKehadiranJamaah } from '../RiwayatKehadiranJamaah/index';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'detail' | 'riwayat';

interface DataJamaahProps {
  isDark: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataJamaah({ isDark }: DataJamaahProps) {
  const theme = getThemeColors(isDark);
  const [selectedJamaah, setSelectedJamaah] = useState<JamaahResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [queryParams, setQueryParams] = useSearchParams();

  const { data, loading, error, pagination, search, setSearch, refetch } = useJamaahList({
    initialLimit: 50,
  });

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refetch(1, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, refetch]);

  useEffect(() => {
    const viewFromUrl = queryParams.get('view');
    const jamaahIdFromUrl = queryParams.get('jamaahId');

    if (viewFromUrl !== 'detail' && viewFromUrl !== 'riwayat') {
      if (viewMode !== 'list') setViewMode('list');
      if (selectedJamaah) setSelectedJamaah(null);
      return;
    }

    if (!jamaahIdFromUrl) {
      if (viewMode !== 'list') setViewMode('list');
      if (selectedJamaah) setSelectedJamaah(null);
      return;
    }

    setViewMode(viewFromUrl);

    const matchedJamaah = data.find((item) => String(item.id) === jamaahIdFromUrl);
    if (matchedJamaah) {
      if (!selectedJamaah || String(selectedJamaah.id) !== jamaahIdFromUrl) {
        setSelectedJamaah(matchedJamaah);
      }
      return;
    }

    if (selectedJamaah && String(selectedJamaah.id) === jamaahIdFromUrl) return;

    if (!loading) {
      const cleaned = new URLSearchParams(queryParams);
      cleaned.delete('view');
      cleaned.delete('jamaahId');
      setViewMode('list');
      setSelectedJamaah(null);
      setQueryParams(cleaned, { replace: true });
    }
  }, [data, loading, queryParams, selectedJamaah, setQueryParams, viewMode]);

  // ─── URL Helpers ───────────────────────────────────────────────────────────

  const setViewInUrl = (
    nextView: ViewMode,
    jamaah?: JamaahResponse | null,
    replace = false
  ) => {
    const nextParams = new URLSearchParams(queryParams);
    if (nextView !== 'riwayat') nextParams.delete('riwayatDetailId');

    if (nextView === 'list') {
      nextParams.delete('view');
      nextParams.delete('jamaahId');
    } else {
      nextParams.set('view', nextView);
      const targetId = jamaah?.id ?? selectedJamaah?.id;
      if (targetId !== undefined && targetId !== null) {
        nextParams.set('jamaahId', String(targetId));
      } else {
        nextParams.delete('jamaahId');
      }
    }

    setQueryParams(nextParams, { replace });
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleJamaahClick = (jamaah: JamaahResponse) => {
    setSelectedJamaah(jamaah);
    setViewMode('detail');
    setViewInUrl('detail', jamaah);
  };

  const handleViewRiwayat = (jamaahId: number | string) => {
    const targetJamaah =
      selectedJamaah && String(selectedJamaah.id) === String(jamaahId)
        ? selectedJamaah
        : data.find((item) => String(item.id) === String(jamaahId)) || selectedJamaah;

    if (!targetJamaah) return;

    setSelectedJamaah(targetJamaah);
    setViewMode('riwayat');
    setViewInUrl('riwayat', targetJamaah);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedJamaah(null);
    setViewInUrl('list', null, true);
  };

  const handleBackToDetail = () => {
    if (!selectedJamaah) {
      handleBackToList();
      return;
    }
    setViewMode('detail');
    setViewInUrl('detail', selectedJamaah, true);
  };

  // ─── Riwayat View ──────────────────────────────────────────────────────────

  if (viewMode === 'riwayat' && selectedJamaah) {
    return (
      <RiwayatKehadiranJamaah
        jamaahId={selectedJamaah.id}
        jamaahNama={selectedJamaah.nama}
        onBack={handleBackToDetail}
        isDark={isDark}
      />
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <JamaahHeader theme={theme} loading={loading} onRefresh={() => refetch()} />

      {/* Error */}
      {error && (
        <Card className="p-3 bg-red-50 border-red-200 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm flex-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-red-300 hover:bg-red-100 text-xs px-2 py-1"
          >
            Coba Lagi
          </Button>
        </Card>
      )}

      <JamaahSearch
        isDark={isDark}
        theme={theme}
        search={search}
        total={pagination.total}
        onSearchChange={setSearch}
      />

      <JamaahList
        isDark={isDark}
        theme={theme}
        data={data}
        search={search}
        onJamaahClick={handleJamaahClick}
      />

      <JamaahPagination
        theme={theme}
        pagination={pagination}
        loading={loading}
        onRefetch={refetch}
      />

      <JamaahInfoNote />

      {/* Detail Modal */}
      {viewMode === 'detail' && selectedJamaah && (
        <DetailJamaah
          jamaah={selectedJamaah}
          onClose={handleBackToList}
          onViewRiwayat={handleViewRiwayat}
          onRefresh={() => refetch()}
          isDark={isDark}
        />
      )}
    </div>
  );
}

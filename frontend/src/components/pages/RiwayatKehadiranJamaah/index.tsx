import { useState, useEffect } from 'react';
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { getThemeColors, spacing, borderRadius } from '../../../lib/theme';
import { useJamaahHistory } from '../../../hooks/useJamaah';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/axios';
import { emitAttendanceDataChanged } from '../../../lib/attendanceEvents';

import { RiwayatKehadiranHeader } from './components/RiwayatKehadiranHeader';
import { FilterTanggal } from './components/FilterTanggal';
import { GridView } from './components/GridView';
import { ListView } from './components/ListView';
import { RiwayatPagination } from './components/RiwayatPagination';
import { DetailModal } from './components/DetailModal';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { ConfirmModal } from '../../ui/ConfirmModal';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiwayatKehadiranJamaahProps {
  jamaahId: number | string;
  jamaahNama: string;
  onBack: () => void;
  isDark: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPhotoUrl = (url?: string | null): string | undefined => {
  if (url && url.startsWith('/')) {
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  }
  return url || undefined;
};

const isTepatWaktu = (status: string | null | undefined) => status === 'TEPAT_WAKTU';
const isDiLuarWaktu = (status: string | null | undefined) => status === 'DI_LUAR_WAKTU_SHOLAT';

const getStatusLabel = (status: string | null | undefined) => {
  if (isTepatWaktu(status)) return 'Tepat Waktu';
  if (isDiLuarWaktu(status)) return 'Di Luar Waktu Sholat';
  return 'Terlambat';
};

const getStatusColorClass = (status: string | null | undefined) => {
  if (isTepatWaktu(status)) return 'text-green-600';
  if (isDiLuarWaktu(status)) return 'text-gray-600';
  return 'text-orange-600';
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RiwayatKehadiranJamaah({
  jamaahId,
  jamaahNama,
  onBack,
  isDark,
}: RiwayatKehadiranJamaahProps) {
  const theme = getThemeColors(isDark);
  const { role } = useAuth();
  const isKingAdmin = role === 'king_admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRiwayat, setSelectedRiwayat] = useState<any | null>(null);
  const selectedRiwayatId = searchParams.get('riwayatDetailId');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, loading, error, pagination, page, setPage, filters, refetch } = useJamaahHistory(
    String(jamaahId),
    { initialLimit: viewMode === 'grid' ? 16 : 20 }
  );

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // ─── URL Sync ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedRiwayatId) {
      if (selectedRiwayat) setSelectedRiwayat(null);
      return;
    }

    const matchedItem = data.find((item) => String(item.id) === selectedRiwayatId);
    if (matchedItem) {
      if (!selectedRiwayat || String(selectedRiwayat.id) !== selectedRiwayatId) {
        setSelectedRiwayat(matchedItem);
      }
      return;
    }

    if (selectedRiwayat && String(selectedRiwayat.id) === selectedRiwayatId) return;

    if (!loading) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('riwayatDetailId');
      setSearchParams(nextParams, { replace: true });
      setSelectedRiwayat(null);
    }
  }, [data, loading, searchParams, selectedRiwayat, selectedRiwayatId, setSearchParams]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenDetail = (item: any) => {
    setDeleteError(null);
    setSelectedRiwayat(item);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('riwayatDetailId', String(item.id));
    setSearchParams(nextParams);
  };

  const handleCloseDetail = (replace = true) => {
    if (!searchParams.has('riwayatDetailId')) {
      setSelectedRiwayat(null);
      setDeleteError(null);
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('riwayatDetailId');
    setSearchParams(nextParams, { replace });
    setSelectedRiwayat(null);
    setDeleteError(null);
  };

  const handleDeleteAttendance = async () => {
    if (!isKingAdmin || !selectedRiwayat || isDeletingAttendance) return;

    setIsDeletingAttendance(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/attendance/${selectedRiwayat.id}`);
      emitAttendanceDataChanged({
        action: 'deleted',
        logId: Number(selectedRiwayat.id),
        jamaahId: String(selectedRiwayat.jamaah_id ?? jamaahId),
      });
      handleCloseDetail(true);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.detail;
      setDeleteError(backendMessage || 'Gagal menghapus data kehadiran');
    } finally {
      setIsDeletingAttendance(false);
      setShowDeleteConfirm(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <RiwayatKehadiranHeader
        theme={theme}
        isDark={isDark}
        jamaahNama={jamaahNama}
        total={pagination.total}
        viewMode={viewMode}
        onBack={onBack}
        onViewModeChange={setViewMode}
      />

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: '#ffEBEE',
            color: '#d32f2f',
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            border: '1px solid #ffcdd2',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="ml-auto border-red-200 text-red-700 hover:bg-red-50 text-xs h-7 px-2"
          >
            Retry
          </Button>
        </div>
      )}

      <FilterTanggal
        theme={theme}
        isDark={isDark}
        startDate={filters.startDate || ''}
        endDate={filters.endDate || ''}
        loading={loading}
        onStartDateChange={filters.setStartDate}
        onEndDateChange={filters.setEndDate}
        onReset={filters.reset}
      />

      {/* Grid/List Content */}
      <Card className="p-4 border-none relative min-h-[300px]" style={{ backgroundColor: theme.surface }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0C5E3C]" />
          </div>
        )}

        {!loading && data.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: isDark ? theme.background : '#F3F4F6' }}
            >
              <Calendar className="w-8 h-8" style={{ color: theme.text.tertiary }} />
            </div>
            <p className="text-sm" style={{ color: theme.text.secondary }}>Tidak ada data kehadiran</p>
          </div>
        ) : viewMode === 'grid' ? (
          <GridView
            data={data}
            jamaahNama={jamaahNama}
            getPhotoUrl={getPhotoUrl}
            isTepatWaktu={isTepatWaktu}
            isDiLuarWaktu={isDiLuarWaktu}
            onItemClick={handleOpenDetail}
          />
        ) : (
          <ListView
            theme={theme}
            isDark={isDark}
            data={data}
            jamaahNama={jamaahNama}
            getPhotoUrl={getPhotoUrl}
            isTepatWaktu={isTepatWaktu}
            isDiLuarWaktu={isDiLuarWaktu}
            onItemClick={handleOpenDetail}
          />
        )}

        <RiwayatPagination
          theme={theme}
          isDark={isDark}
          page={page}
          totalPages={totalPages}
          dataCount={data.length}
          total={pagination.total}
          loading={loading}
          viewMode={viewMode}
          onPrev={() => { if (page > 1) setPage(page - 1); }}
          onNext={() => { if (page < totalPages) setPage(page + 1); }}
          onViewModeChange={setViewMode}
        />
      </Card>

      {selectedRiwayat && (
        <DetailModal
          theme={theme}
          isDark={isDark}
          item={selectedRiwayat}
          jamaahNama={jamaahNama}
          isKingAdmin={isKingAdmin}
          isDeletingAttendance={isDeletingAttendance}
          deleteError={deleteError}
          getPhotoUrl={getPhotoUrl}
          isTepatWaktu={isTepatWaktu}
          isDiLuarWaktu={isDiLuarWaktu}
          getStatusLabel={getStatusLabel}
          getStatusColorClass={getStatusColorClass}
          onClose={() => handleCloseDetail(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onPhotoClick={() => setShowPhotoPreview(true)}
        />
      )}

      {showPhotoPreview && selectedRiwayat?.photo_url && (
        <PhotoPreviewModal
          photoUrl={getPhotoUrl(selectedRiwayat.photo_url) || ''}
          onClose={() => setShowPhotoPreview(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          theme={theme}
          title="Hapus Kehadiran?"
          description={
            <div className="space-y-4">
              <p>Apakah Anda yakin ingin menghapus data kehadiran ini?</p>
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-left">
                <p className="font-bold mb-1">⚠️ PERHATIAN:</p>
                <p>Tindakan ini tidak dapat dibatalkan. Riwayat kehadiran akan dihapus secara permanen dari basis data.</p>
              </div>
            </div>
          }
          confirmLabel="Ya, Hapus Data"
          isLoading={isDeletingAttendance}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAttendance}
        />
      )}
    </div>
  );
}


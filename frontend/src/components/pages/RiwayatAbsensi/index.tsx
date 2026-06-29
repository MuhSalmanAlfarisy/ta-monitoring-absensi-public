import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { spacing, borderRadius, getThemeColors } from '../../../lib/theme';
import { useAttendance } from '../../../hooks/useAttendance';
import { useRamadhanSettings } from '../../../hooks/useRamadhanSettings';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/axios';
import { emitAttendanceDataChanged } from '../../../lib/attendanceEvents';

import { RiwayatHeader } from './components/RiwayatHeader';
import { RiwayatFilters } from './components/RiwayatFilters';
import { RiwayatTabBar } from './components/RiwayatTabBar';
import { RiwayatTable } from './components/RiwayatTable';
import { RiwayatPagination } from './components/RiwayatPagination';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { ConfirmModal } from '../../ui/ConfirmModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const LONG_PRESS_DURATION_MS = 500;
type TabType = 'sholat' | 'diluar' | 'event';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiwayatAbsensiProps {
  isDark: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiwayatAbsensi({ isDark }: RiwayatAbsensiProps) {
  const theme = getThemeColors(isDark);
  const { role } = useAuth();
  const isKingAdmin = role === 'king_admin';

  // ─── UI State ───────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // ─── Selection State ────────────────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedOutsideIds, setSelectedOutsideIds] = useState<number[]>([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  // ─── Data Hooks ──────────────────────────────────────────────────────────────
  const { data, loading, error, pagination, filters, setPage, refetch } = useAttendance({
    initialLimit: 20,
  });
  const { data: ramadhanSettings } = useRamadhanSettings();
  const isRamadhanActive = Boolean(ramadhanSettings?.is_ramadhan_active_today);
  const showTarawihFilter = isRamadhanActive || Boolean(ramadhanSettings?.has_tarawih_history);
  const currentTab: TabType = filters.tab;

  const canUseOutsideSelection =
    isKingAdmin && (currentTab === 'diluar' || currentTab === 'event');

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (showTarawihFilter) return;
    if (!filters.waktuSholat.includes('Tarawih')) return;

    filters.setWaktuSholat(filters.waktuSholat.filter((waktu) => waktu !== 'Tarawih'));
    setPage(1);
  }, [filters.waktuSholat, filters.setWaktuSholat, showTarawihFilter, setPage]);

  useEffect(() => {
    if (canUseOutsideSelection) return;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setSelectionMode(false);
    setSelectedOutsideIds([]);
    setSelectionError(null);
  }, [canUseOutsideSelection]);

  useEffect(() => {
    if (!selectionMode) return;
    if (selectedOutsideIds.length > 0) return;
    setSelectionMode(false);
  }, [selectionMode, selectedOutsideIds.length]);

  useEffect(() => {
    if (!selectionMode) return;
    const visibleIds = new Set(data.map((item) => item.id));
    setSelectedOutsideIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [data, selectionMode]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // ─── Long Press Handlers ─────────────────────────────────────────────────────

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const toggleOutsideSelection = (logId: number) => {
    setSelectionError(null);
    setSelectedOutsideIds((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const handleRowPressStart = (logId: number) => {
    if (!canUseOutsideSelection || isDeletingSelected) return;
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setSelectionError(null);
      setSelectionMode(true);
      setSelectedOutsideIds((prev) =>
        prev.includes(logId) ? prev : [...prev, logId]
      );
    }, LONG_PRESS_DURATION_MS);
  };

  const handleRowPressCancel = () => clearLongPressTimer();

  const handleRowClick = (logId: number) => {
    if (!canUseOutsideSelection || !selectionMode) return;
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    toggleOutsideSelection(logId);
  };

  const clearOutsideSelection = () => {
    setSelectionMode(false);
    setSelectedOutsideIds([]);
    setSelectionError(null);
  };

  // ─── Delete Handler ──────────────────────────────────────────────────────────

  const handleDeleteSelectedOutside = async () => {
    if (!canUseOutsideSelection || selectedOutsideIds.length === 0 || isDeletingSelected) return;

    setIsDeletingSelected(true);
    setSelectionError(null);

    try {
      const idsToDelete = [...selectedOutsideIds];
      const results = await Promise.allSettled(
        idsToDelete.map((id) => api.delete(`/api/attendance/${id}`))
      );

      const successIds: number[] = [];
      const failedErrors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successIds.push(idsToDelete[index]);
          return;
        }
        const backendDetail = (result.reason as any)?.response?.data?.detail;
        if (backendDetail && typeof backendDetail === 'string') {
          failedErrors.push(backendDetail);
        }
      });

      successIds.forEach((id) => emitAttendanceDataChanged({ action: 'deleted', logId: id }));

      if (successIds.length > 0) {
        clearOutsideSelection();
        await refetch();
      }

      const failedCount = idsToDelete.length - successIds.length;
      if (failedCount > 0) {
        const fallbackError = `Berhasil menghapus ${successIds.length} data, ${failedCount} data gagal dihapus.`;
        setSelectionError(failedErrors[0] || fallbackError);
      } else {
        setSelectionError(null);
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.detail;
      setSelectionError(
        typeof backendMessage === 'string' ? backendMessage : 'Gagal menghapus data terpilih.'
      );
    } finally {
      setIsDeletingSelected(false);
      setShowDeleteConfirm(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <RiwayatHeader
        theme={theme}
        isMobile={isMobile}
        isDark={isDark}
        dataCount={data.length}
        total={pagination.total}
        page={pagination.page}
        totalPages={totalPages}
        loading={loading}
        onRefresh={() => refetch()}
      />

      {/* Error banners */}
      {error && (
        <div
          style={{
            backgroundColor: '#ffEBEE',
            color: '#d32f2f',
            padding: spacing.md,
            borderRadius: borderRadius.md,
            border: '1px solid #ffcdd2',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.8125rem' }}>Error: {error}</span>
        </div>
      )}

      {selectionError && (
        <div
          style={{
            backgroundColor: '#FFF4E5',
            color: '#9A3412',
            padding: spacing.md,
            borderRadius: borderRadius.md,
            border: '1px solid #FED7AA',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.8125rem' }}>{selectionError}</span>
        </div>
      )}

      <RiwayatFilters
        theme={theme}
        filters={filters}
        isMobile={isMobile}
        showFilters={showFilters}
        isRamadhanActive={showTarawihFilter}
        activeTab={currentTab}
        isDark={isDark}
        onToggleFilters={() => setShowFilters((v) => !v)}
        onSetPage={setPage}
      />

      <RiwayatTabBar
        theme={theme}
        isMobile={isMobile}
        isDark={isDark}
        tab={currentTab}
        canUseOutsideSelection={canUseOutsideSelection}
        selectionMode={selectionMode}
        selectedOutsideIds={selectedOutsideIds}
        isDeletingSelected={isDeletingSelected}
        onTabChange={(tab) => { filters.setTab(tab); setPage(1); }}
        onDeleteSelected={() => setShowDeleteConfirm(true)}
        onClearSelection={clearOutsideSelection}
      />

      {canUseOutsideSelection && (
        <div style={{ marginTop: `-${spacing.xs}`, fontSize: '0.75rem', color: theme.text.secondary }}>
          {selectionMode
            ? `${selectedOutsideIds.length} item dipilih. Ketuk item lain untuk menambah/mengurangi pilihan.`
            : 'Tekan dan tahan satu item untuk mulai pilih banyak data.'}
        </div>
      )}

      <RiwayatTable
        theme={theme}
        isDark={isDark}
        isMobile={isMobile}
        data={data}
        loading={loading}
        tab={currentTab}
        page={pagination.page}
        limit={pagination.limit}
        canUseOutsideSelection={canUseOutsideSelection}
        selectionMode={selectionMode}
        selectedOutsideIds={selectedOutsideIds}
        isDeletingSelected={isDeletingSelected}
        onPressStart={handleRowPressStart}
        onPressCancel={handleRowPressCancel}
        onRowClick={handleRowClick}
        onPhotoClick={setPreviewPhoto}
        onToggleSelection={toggleOutsideSelection}
      />


      <RiwayatPagination
        theme={theme}
        isMobile={isMobile}
        page={pagination.page}
        totalPages={totalPages}
        loading={loading}
        onSetPage={setPage}
      />

      {previewPhoto && (
        <PhotoPreviewModal photoUrl={previewPhoto} onClose={() => setPreviewPhoto(null)} />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          theme={theme}
          title="Hapus Data Terpilih?"
          description={
            <div className="space-y-4">
              <p>Apakah Anda yakin ingin menghapus <span className="font-bold text-red-500">{selectedOutsideIds.length} data {currentTab === 'event' ? 'event' : 'di luar waktu sholat'}</span> yang dipilih?</p>
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-left">
                <p className="font-bold mb-1">⚠️ PERHATIAN:</p>
                <p>Tindakan ini tidak bisa dibatalkan. Seluruh data yang dipilih akan dihapus secara permanen dari sistem.</p>
              </div>
            </div>
          }
          confirmLabel="Ya, Hapus Data"
          isLoading={isDeletingSelected}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteSelectedOutside}
        />
      )}
    </div>
  );
}

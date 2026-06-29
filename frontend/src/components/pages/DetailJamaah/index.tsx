import { useState, useEffect } from 'react';
import { getThemeColors } from '../../../lib/theme';
import { useJamaah } from '../../../hooks/useJamaah';
import type { JamaahResponse, JamaahDetailResponse } from '../../../lib/types';
import { getPhotoUrl } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';

import { DetailHeader } from './components/DetailHeader';
import { DetailStats } from './components/DetailStats';
import { DetailTimeInfo } from './components/DetailTimeInfo';
import { DetailInfoNote } from './components/DetailInfoNote';
import { DetailActions } from './components/DetailActions';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { ConfirmModal } from '../../ui/ConfirmModal';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DetailJamaahProps {
  jamaah: JamaahResponse;
  onClose: () => void;
  onViewRiwayat: (jamaahId: number | string) => void;
  onRefresh?: () => void;
  isDark: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DetailJamaah({
  jamaah: initialJamaah,
  onClose,
  onViewRiwayat,
  onRefresh,
  isDark,
}: DetailJamaahProps) {
  const theme = getThemeColors(isDark);
  const { role } = useAuth();
  const { deleteJamaah, getJamaahDetail, loading: detailsLoading } = useJamaah();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailData, setDetailData] = useState<JamaahDetailResponse | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // ─── Fetch Detail ──────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      if (initialJamaah?.id) {
        const data = await getJamaahDetail(String(initialJamaah.id));
        if (isMounted && data) setDetailData(data);
      }
    };
    void fetchDetail();
    return () => { isMounted = false; };
  }, [initialJamaah, getJamaahDetail]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const displayData = detailData || initialJamaah;
  const stats = detailData?.statistics || { bulan_ini: 0, minggu_ini: 0 };
  const totalKehadiran = displayData.total_kehadiran || 0;
  const firstSeen = (displayData as any).first_seen_at || (displayData as any).first_seen;
  const lastSeen = (displayData as any).last_seen_at || (displayData as any).last_seen;
  const photoUrl = getPhotoUrl(displayData.foto_profil_url);
  const idDisplay = String(displayData.id);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteJamaah(String(initialJamaah.id));
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete:', err);
      setIsDeleting(false);
    }
  };

  // ─── Modals ────────────────────────────────────────────────────────────────

  if (showPhotoPreview && photoUrl) {
    return (
      <PhotoPreviewModal
        photoUrl={photoUrl}
        nama={displayData.nama}
        onClose={() => setShowPhotoPreview(false)}
      />
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 !m-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.surface }}
      >
        <DetailHeader
          theme={theme}
          nama={displayData.nama}
          idDisplay={idDisplay}
          photoUrl={photoUrl || undefined}
          onClose={onClose}
          onPhotoClick={() => setShowPhotoPreview(true)}
        />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <DetailStats
            theme={theme}
            isDark={isDark}
            loading={detailsLoading}
            totalKehadiran={totalKehadiran}
            bulanIni={stats.bulan_ini}
            mingguIni={stats.minggu_ini}
          />

          <DetailTimeInfo
            theme={theme}
            isDark={isDark}
            firstSeen={firstSeen}
            lastSeen={lastSeen}
          />

          <DetailInfoNote />

          <DetailActions
            onViewRiwayat={() => onViewRiwayat(initialJamaah.id)}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            showDelete={role === 'king_admin'}
          />
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          theme={theme}
          title="Hapus Jamaah?"
          description={
            <div className="space-y-4 text-left">
              <p>
                Anda akan menghapus data jamaah{' '}
                <span className="font-bold text-red-500">{displayData.nama}</span> dari website.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs">
                <p className="font-bold mb-1">⚠️ PERHATIAN PENTING:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Data HANYA terhapus dari database website.</li>
                  <li>Data di MESIN ABSENSI tidak akan terhapus.</li>
                  <li>Jika jamaah ini scan lagi, data akan otomatis muncul kembali.</li>
                </ul>
              </div>
            </div>
          }
          confirmLabel="Ya, Hapus"
          isLoading={isDeleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}


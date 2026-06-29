import { useState, useEffect } from 'react';
import { spacing, borderRadius, transitions, getThemeColors } from '../../../lib/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { api, getValidTokenOrLogout } from '../../../lib/axios';
import { useRamadhanSettings } from '../../../hooks/useRamadhanSettings';

import { ProfilHeader } from './components/ProfilHeader';
import { ProfilCard } from './components/ProfilCard';
import { AccountInfoGrid } from './components/AccountInfoGrid';
import { PermissionsCard } from './components/PermissionsCard';
import { RamadhanSettings, type ValidationStatus } from './components/RamadhanSettings';
import { RamadhanConfirmModal } from './components/RamadhanConfirmModal';
import { SecuritySection } from './components/SecuritySection';
import { ActivityLogModal, type ActivityLog } from './components/ActivityLogModal';
import { ActionButtons } from './components/ActionButtons';
import { ViewPhotoModal } from './components/ViewPhotoModal';
import { CropPhotoModal } from './components/CropPhotoModal';
import { ConfirmModal } from '../../ui/ConfirmModal';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfilProps {
  isDark: boolean;
  onLogout: () => void;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const parseApiDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatLogTimestamp = (value?: string | null): string => {
  const date = parseApiDate(value);
  if (!date) return '-';
  return date.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
};

const formatDateOnlyWIB = (value?: string | null): string => {
  const date = parseApiDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
};

const parseIsoDateLocal = (isoDate?: string | null): Date | null => {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toStartOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const getRamadhanDateBounds = (idulFitri: Date, today = toStartOfDay(new Date())) => {
  const idulDate = toStartOfDay(idulFitri);
  const idealStart = addDays(idulDate, -30);
  const minStartDate = today > idealStart ? today : idealStart;
  return {
    idealStartDate: idealStart,
    minStartDate,
    maxDate: idulDate,
    idealStartIso: toDateInputValue(idealStart),
    minStartIso: toDateInputValue(minStartDate),
    maxIso: toDateInputValue(idulDate),
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Profil({ isDark, onLogout }: ProfilProps) {
  const theme = getThemeColors(isDark);
  const { user, role, updateUserProfile, updateUserPassword } = useAuth();
  const {
    data: ramadhanSettings,
    loading: ramadhanLoading,
    saving: ramadhanSaving,
    error: ramadhanError,
    updateSettings: updateRamadhanSettings,
  } = useRamadhanSettings();

  const [isMobile, setIsMobile] = useState(false);

  // ─── Edit State ───────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  // ─── Photo State ──────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  // ─── Password State ───────────────────────────────────────────────────────
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastPasswordChange, setLastPasswordChange] = useState<string | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [profileLastLoginAt, setProfileLastLoginAt] = useState<string | null>(null);

  // ─── Activity Log State ───────────────────────────────────────────────────
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // ─── Delete State ─────────────────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Ramadhan State ───────────────────────────────────────────────────────
  const [ramadhanMode, setRamadhanMode] = useState(false);
  const [ramadhanStartDate, setRamadhanStartDate] = useState('');
  const [ramadhanEndDate, setRamadhanEndDate] = useState('');
  const [idulFitriDate, setIdulFitriDate] = useState<Date | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmType, setConfirmType] = useState<'activate' | 'deactivate'>('activate');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  const isRamadhanRunning = (() => {
    if (!ramadhanMode || !ramadhanStartDate || !ramadhanEndDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return today >= ramadhanStartDate && today <= ramadhanEndDate;
  })();

  const ramadhanDateBounds = idulFitriDate ? getRamadhanDateBounds(idulFitriDate) : null;
  const ramadhanStartMinDate = ramadhanDateBounds?.minStartIso || '';
  const ramadhanStartMaxDate = ramadhanDateBounds?.maxIso || '';
  const ramadhanEndMaxDate = ramadhanDateBounds?.maxIso || '';
  const ramadhanDateHint = (() => {
    if (!ramadhanDateBounds) return '';
    const minLabel = ramadhanDateBounds.minStartDate.toLocaleDateString('id-ID');
    const maxLabel = ramadhanDateBounds.maxDate.toLocaleDateString('id-ID');
    const idealStartPassed =
      ramadhanDateBounds.minStartDate.getTime() > ramadhanDateBounds.idealStartDate.getTime();
    if (idealStartPassed) {
      return `Pilihan kalender dibatasi ${minLabel} sampai ${maxLabel}. Hari Ramadhan yang sudah lewat tidak dapat dipilih.`;
    }
    return `Pilihan kalender dibatasi ${minLabel} sampai ${maxLabel} (mengikuti H-Idul Fitri).`;
  })();

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user?.displayName) setNewName(user.displayName);
  }, [user?.displayName]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getValidTokenOrLogout();
        if (!token) return;
        const res = await api.get('/api/profile/me', { params: { token } });
        setProfileCreatedAt(res.data.created_at || null);
        setProfileLastLoginAt(res.data.last_login_at || null);
        if (res.data.last_password_change) setLastPasswordChange(res.data.last_password_change);
      } catch (err) {
        console.error('Error fetching profile', err);
      }
    };
    fetchProfile();
  }, [role]);

  useEffect(() => {
    if (!ramadhanSettings) return;
    setRamadhanMode(Boolean(ramadhanSettings.ramadhan_mode));
    setRamadhanStartDate(ramadhanSettings.ramadhan_start_date || '');
    setRamadhanEndDate(ramadhanSettings.ramadhan_end_date || '');
  }, [ramadhanSettings]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      const token = getValidTokenOrLogout();
      if (!token) return;
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('token', token);
      await api.put('/api/profile/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await updateUserProfile(newName, user?.photoURL || undefined);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.readAsDataURL(file);
      });
      setImageSrc(dataUrl);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const token = getValidTokenOrLogout();
      if (!token) return;
      const file = new File([blob], 'profile_photo.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);
      const response = await api.post('/api/profile/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      let photoURL = response.data.url;
      if (photoURL.startsWith('/')) photoURL = `${import.meta.env.VITE_API_BASE_URL}${photoURL}`;
      await updateUserProfile(user?.displayName || 'User', photoURL);
      setImageSrc(null);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Gagal mengupload foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) { alert('Password tidak sama.'); return; }
    if (password.length < 6) { alert('Password minimal 6 karakter.'); return; }
    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(password);
      alert('Password berhasil dibuat/diubah!');
      setLastPasswordChange(new Date().toISOString());
      setPassword(''); setConfirmPassword(''); setShowPasswordSection(false);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert('Demi keamanan, silakan Logout dan Login kembali sebelum mengubah password.');
        onLogout();
      } else {
        alert('Gagal mengubah password. ' + error.message);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const fetchActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await api.get('/api/system/admin/activity-logs');
      setActivityLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/api/system/profile/me');
      alert('Akun berhasil dihapus. Anda akan logout.');
      onLogout();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Gagal menghapus akun.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Ramadhan Handlers ────────────────────────────────────────────────────

  const handleCekValidasi = async () => {
    setValidationStatus('loading');
    setValidationMessage('');
    try {
      const year = new Date().getFullYear();
      const response = await fetch(`https://libur.deno.dev/api?year=${year}`);
      const data = await response.json();
      const idulFitriEntry = data.find((d: any) => d.name?.toLowerCase().includes('idul fitri'));
      if (!idulFitriEntry) {
        setValidationStatus('expired');
        setValidationMessage('Data Idul Fitri tidak ditemukan dari API. Silakan coba lagi nanti.');
        return;
      }
      const idulFitri = parseIsoDateLocal(idulFitriEntry.date);
      if (!idulFitri) {
        setValidationStatus('expired');
        setValidationMessage('Format tanggal Idul Fitri dari API tidak valid.');
        return;
      }
      setIdulFitriDate(idulFitri);
      const today = toStartOfDay(new Date());
      const diffDays = Math.ceil((idulFitri.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const formatted = idulFitri.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      if (diffDays < 0) {
        setValidationStatus('expired');
        setValidationMessage(`Idul Fitri tahun ini (${formatted}) sudah lewat.`);
      } else if (diffDays > 35) {
        setValidationStatus('too_early');
        setValidationMessage(`Idul Fitri diperkirakan pada ${formatted} (H-${diffDays}). Aktivasi hanya diperbolehkan mulai H-35.`);
      } else {
        const bounds = getRamadhanDateBounds(idulFitri, today);
        const normalizedStart =
          ramadhanStartDate &&
            ramadhanStartDate >= bounds.minStartIso &&
            ramadhanStartDate <= bounds.maxIso
            ? ramadhanStartDate
            : bounds.minStartIso;

        const minEndIso = normalizedStart > bounds.minStartIso ? normalizedStart : bounds.minStartIso;
        const normalizedEnd =
          ramadhanEndDate &&
            ramadhanEndDate >= minEndIso &&
            ramadhanEndDate <= bounds.maxIso
            ? ramadhanEndDate
            : bounds.maxIso;

        setRamadhanStartDate(normalizedStart);
        setRamadhanEndDate(normalizedEnd);
        setValidationStatus('valid');
        setValidationMessage(`Idul Fitri diperkirakan pada ${formatted} (H-${diffDays}). Anda dapat mengaktifkan Mode Ramadhan sekarang.`);
      }
    } catch (err) {
      setValidationStatus('expired');
      setValidationMessage('Gagal mengambil data Idul Fitri. Periksa koneksi internet dan coba lagi.');
    }
  };

  const handleToggleRamadhan = (targetMode: boolean) => {
    if (targetMode) {
      const diffDays = idulFitriDate ? Math.ceil((idulFitriDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      setConfirmMessage(`Idul Fitri diperkirakan pada ${idulFitriDate?.toLocaleDateString('id-ID')} (H-${diffDays}).\n\nApakah Anda yakin ingin mengaktifkan Mode Ramadhan sekarang?`);
      setConfirmType('activate');
    } else {
      if (ramadhanSettings?.ramadhan_activated_at) {
        const diff = Math.abs(new Date().getTime() - new Date(ramadhanSettings.ramadhan_activated_at).getTime());
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const duration = days > 0 ? `${days} hari ${hours} jam` : `${hours} jam`;
        const isExpired = ramadhanEndDate && new Date() > new Date(`${ramadhanEndDate}T23:59:59`);
        if (isExpired) {
          setConfirmMessage(`Periode Ramadhan telah berakhir (${duration} lalu).\n\n✅ Data absensi Tarawih AMAN — tidak ada data yang dihapus.\n\nMenutup mode ini hanya akan menghapus status "Aktif" dari pengaturan. Riwayat Tarawih tetap tersimpan di database dan dapat dilihat di Riwayat Absensi.\n\nLanjutkan menutup Mode Ramadhan?`);
        } else {
          setConfirmMessage(`Mode Ramadhan telah aktif selama ${duration}.\n\n✅ Data absensi Tarawih AMAN — tidak ada data yang dihapus.\n\nMembatalkan mode ini akan menghentikan jadwal Tarawih ke depannya. Riwayat absensi yang sudah tercatat tetap tersimpan.\n\nApakah Anda yakin ingin menonaktifkan Mode Ramadhan?`);
        }
      } else {
        setConfirmMessage('Apakah Anda yakin ingin menonaktifkan Mode Ramadhan?');
      }
      setConfirmType('deactivate');
    }
    setShowConfirmModal(true);
  };

  const handleSaveRamadhanSettings = async (targetMode: boolean) => {
    if (targetMode) {
      if (!ramadhanStartDate || !ramadhanEndDate) { alert('Tanggal mulai dan akhir Ramadhan wajib diisi.'); return; }
      if (ramadhanEndDate < ramadhanStartDate) { alert('Tanggal akhir tidak boleh sebelum tanggal mulai.'); return; }
      if (!idulFitriDate) {
        alert('Silakan cek validasi Ramadhan terlebih dahulu agar rentang tanggal mengikuti H-Idul Fitri.');
        return;
      }

      const bounds = getRamadhanDateBounds(idulFitriDate);
      if (ramadhanStartDate < bounds.minStartIso || ramadhanStartDate > bounds.maxIso) {
        alert(`Tanggal mulai harus berada dalam rentang ${bounds.minStartIso} s.d. ${bounds.maxIso}.`);
        return;
      }

      const minEndIso = ramadhanStartDate > bounds.minStartIso ? ramadhanStartDate : bounds.minStartIso;
      if (ramadhanEndDate < minEndIso || ramadhanEndDate > bounds.maxIso) {
        alert(`Tanggal akhir harus berada dalam rentang ${minEndIso} s.d. ${bounds.maxIso}.`);
        return;
      }
    }
    try {
      await updateRamadhanSettings({
        ramadhan_mode: targetMode,
        ramadhan_start_date: targetMode ? ramadhanStartDate : null,
        ramadhan_end_date: targetMode ? ramadhanEndDate : null,
      });
    } catch (error: any) {
      alert(error?.message || 'Gagal menyimpan pengaturan Ramadhan.');
    }
  };

  // ─── Derived display values ───────────────────────────────────────────────

  const joinedAt = profileCreatedAt
    ? formatDateOnlyWIB(profileCreatedAt)
    : user?.metadata.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
      : '-';

  const lastLogin = profileLastLoginAt
    ? formatLogTimestamp(profileLastLoginAt)
    : user?.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
      : 'Baru saja';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? spacing.lg : spacing.xl, padding: isMobile ? spacing.sm : '0' }}>

      {/* Modals */}
      {viewPhotoUrl && <ViewPhotoModal photoUrl={viewPhotoUrl} onClose={() => setViewPhotoUrl(null)} />}
      {imageSrc && (
        <CropPhotoModal
          theme={theme}
          imageSrc={imageSrc}
          onClose={() => setImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
      {showActivityLog && (
        <ActivityLogModal
          theme={theme}
          isMobile={isMobile}
          logs={activityLogs}
          isLoading={isLoadingLogs}
          formatTimestamp={formatLogTimestamp}
          onClose={() => setShowActivityLog(false)}
        />
      )}
      {isDeleteModalOpen && (
        <ConfirmModal
          theme={theme}
          title="Hapus Akun?"
          description={
            <div className="space-y-4 text-left">
              <p>Apakah Anda yakin ingin menghapus akun Anda?</p>
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs">
                <p className="font-bold mb-1">⚠️ PERHATIAN:</p>
                <p>Tindakan ini <strong>tidak dapat dibatalkan</strong>. Seluruh akses Anda ke sistem akan dihapus secara permanen.</p>
              </div>
            </div>
          }
          confirmLabel="Ya, Hapus Akun"
          variant="danger"
          isLoading={isDeleting}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
      {showConfirmModal && (
        <RamadhanConfirmModal
          theme={theme}
          confirmType={confirmType}
          confirmMessage={confirmMessage}
          isSaving={ramadhanSaving}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={async () => {
            await handleSaveRamadhanSettings(confirmType === 'activate');
            setShowConfirmModal(false);
          }}
        />
      )}

      {/* Page */}
      <ProfilHeader
        theme={theme}
        isMobile={isMobile}
        isEditing={isEditing}
        onEditClick={() => setIsEditing(true)}
      />

      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          padding: isMobile ? spacing.md : spacing.xl,
          border: `1px solid ${theme.border}`,
          transition: `all ${transitions.base}`,
        }}
      >
        <ProfilCard
          theme={theme}
          isDark={isDark}
          isMobile={isMobile}
          isEditing={isEditing}
          isSaving={isSaving}
          isUploading={isUploading}
          displayName={user?.displayName || ''}
          email={user?.email || ''}
          photoURL={user?.photoURL || undefined}
          role={role || ''}
          newName={newName}
          onNewNameChange={setNewName}
          onPhotoClick={() => user?.photoURL && setViewPhotoUrl(user.photoURL)}
          onFileChange={handleFileChange}
          onSave={handleSaveProfile}
          onCancelEdit={() => { setIsEditing(false); setNewName(user?.displayName || ''); }}
        />

        <AccountInfoGrid theme={theme} isMobile={isMobile} joinedAt={joinedAt} lastLogin={lastLogin} />

        <PermissionsCard theme={theme} isMobile={isMobile} role={role || ''} />

        {role === 'king_admin' && (
          <RamadhanSettings
            theme={theme}
            isDark={isDark}
            isMobile={isMobile}
            ramadhanMode={ramadhanMode}
            ramadhanStartDate={ramadhanStartDate}
            ramadhanEndDate={ramadhanEndDate}
            isRamadhanRunning={isRamadhanRunning}
            ramadhanSettings={ramadhanSettings}
            ramadhanLoading={ramadhanLoading}
            ramadhanSaving={ramadhanSaving}
            ramadhanError={ramadhanError}
            validationStatus={validationStatus}
            validationMessage={validationMessage}
            ramadhanStartMinDate={ramadhanStartMinDate}
            ramadhanStartMaxDate={ramadhanStartMaxDate}
            ramadhanEndMaxDate={ramadhanEndMaxDate}
            ramadhanDateHint={ramadhanDateHint}
            onStartDateChange={setRamadhanStartDate}
            onEndDateChange={setRamadhanEndDate}
            onToggle={handleToggleRamadhan}
            onCekValidasi={handleCekValidasi}
            onResetValidation={() => setValidationStatus('idle')}
          />
        )}

        {role === 'king_admin' && (
          <SecuritySection
            theme={theme}
            isMobile={isMobile}
            lastPasswordChange={lastPasswordChange}
            showPasswordSection={showPasswordSection}
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            isUpdatingPassword={isUpdatingPassword}
            formatTimestamp={formatLogTimestamp}
            onTogglePasswordSection={() => setShowPasswordSection(!showPasswordSection)}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onUpdatePassword={handleUpdatePassword}
            onShowActivityLog={() => { setShowActivityLog(true); fetchActivityLogs(); }}
          />
        )}

        <ActionButtons
          theme={theme}
          isMobile={isMobile}
          role={role || ''}
          onLogout={onLogout}
          onDeleteClick={() => setIsDeleteModalOpen(true)}
        />
      </div>
    </div>
  );
}


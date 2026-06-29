import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getThemeColors } from '../../../lib/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/axios';
import type { WhitelistUser, HistoryFilter } from '../../../lib/types';
import { formatDate, formatDateTime, mapWhitelistResponse } from '../../../lib/utils';

import { PageHeader } from './components/PageHeader';
import { AddWhitelistForm } from './components/AddWhitelistForm';
import { StatCards } from './components/StatCards';
import { WhitelistTable } from './components/WhitelistTable';
import { HistoryModal } from './components/HistoryModal';
import { TransferModal } from './components/TransferModal';
import { ConfirmModal } from '../../ui/ConfirmModal';

interface AdminManagementProps {
  isDark: boolean;
}

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminManagement({ isDark }: AdminManagementProps) {
  const theme = getThemeColors(isDark);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Data
  const [whitelistUsers, setWhitelistUsers] = useState<WhitelistUser[]>([]);
  const [historyUsers, setHistoryUsers] = useState<WhitelistUser[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    filter: HistoryFilter;
    title: string;
  }>({ isOpen: false, filter: 'all', title: 'Riwayat Whitelist' });

  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    step: 1 | 2;
    targetEmail: string;
  }>({ isOpen: false, step: 1, targetEmail: '' });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    email: string;
    id: string;
    isDeleting: boolean;
  }>({ isOpen: false, email: '', id: '', isDeleting: false });

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    void fetchWhitelist();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() =>
    whitelistUsers.filter((u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [whitelistUsers, searchQuery]
  );

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchWhitelist = async () => {
    try {
      const res = await api.get('/api/system/admin/whitelist');
      setWhitelistUsers(mapWhitelistResponse(res.data));
    } catch (err) {
      console.error('Failed to fetch whitelist', err);
    }
  };

  const openHistoryModal = async (filter: HistoryFilter, title: string) => {
    setHistoryModal({ isOpen: true, filter, title });
    setIsHistoryLoading(true);
    try {
      const res = await api.get('/api/system/admin/whitelist/history', {
        params: filter === 'all' ? {} : { status_filter: filter },
      });
      setHistoryUsers(mapWhitelistResponse(res.data));
    } catch (err) {
      console.error('Failed to fetch whitelist history', err);
      setHistoryUsers([]);
      alert('Gagal mengambil riwayat whitelist');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddWhitelist = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email wajib diisi');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Format email tidak valid');
      return;
    }

    const isDuplicate = whitelistUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (isDuplicate) {
      alert('Email sudah terdaftar dalam whitelist!');
      return;
    }

    try {
      await api.post('/api/system/admin/whitelist', { email: email.trim() });
      await fetchWhitelist();
      setEmail('');
      alert('Pengurus berhasil ditambahkan ke whitelist!');
    } catch (err: any) {
      console.error('Failed to add whitelist', err);
      alert(err.response?.data?.detail || 'Gagal menambahkan pengurus');
    }
  };

  const handleDelete = async (emailToDelete: string, id: string) => {
    setDeleteConfirm({ isOpen: true, email: emailToDelete, id, isDeleting: false });
  };

  const confirmDelete = async () => {
    const { email: emailToDelete, id } = deleteConfirm;
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      await api.delete(`/api/system/admin/whitelist/${emailToDelete}`);
      setWhitelistUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteConfirm({ isOpen: false, email: '', id: '', isDeleting: false });
    } catch (err: any) {
      console.error('Failed to remove whitelist', err);
      alert(err.response?.data?.detail || 'Gagal menghapus pengurus');
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleTransfer = async () => {
    try {
      await api.post('/api/system/admin/transfer-job', {
        target_email: transferModal.targetEmail,
      });
      alert(`Jabatan King Admin berhasil dialihkan ke ${transferModal.targetEmail}. Anda akan otomatis logout.`);
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Failed to transfer role', err);
      alert(err.response?.data?.detail || 'Gagal mengalihkan jabatan');
      setTransferModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader isMobile={isMobile} theme={theme} />

      <AddWhitelistForm
        isMobile={isMobile}
        theme={theme}
        email={email}
        emailError={emailError}
        onEmailChange={setEmail}
        onSubmit={handleAddWhitelist}
      />

      <StatCards
        isMobile={isMobile}
        theme={theme}
        totalCount={whitelistUsers.length}
        waitingCount={whitelistUsers.filter((u) => u.status === 'waiting').length}
        activeCount={whitelistUsers.filter((u) => u.status === 'active').length}
        onClickAll={() => openHistoryModal('all', 'Riwayat Semua Whitelist')}
        onClickWaiting={() => openHistoryModal('waiting', 'Riwayat Status Menunggu')}
        onClickActive={() => openHistoryModal('active', 'Riwayat Status Aktif')}
      />

      <WhitelistTable
        isMobile={isMobile}
        theme={theme}
        filteredUsers={filteredUsers}
        totalCount={whitelistUsers.length}
        searchQuery={searchQuery}
        formatDate={formatDate}
        onSearchChange={setSearchQuery}
        onDelete={handleDelete}
        onTransfer={(email) => setTransferModal({ isOpen: true, step: 1, targetEmail: email })}
      />

      <HistoryModal
        isMobile={isMobile}
        theme={theme}
        isOpen={historyModal.isOpen}
        title={historyModal.title}
        isLoading={isHistoryLoading}
        historyUsers={historyUsers}
        formatDateTime={formatDateTime}
        onClose={() => setHistoryModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <TransferModal
        theme={theme}
        isOpen={transferModal.isOpen}
        step={transferModal.step}
        targetEmail={transferModal.targetEmail}
        onClose={() => setTransferModal((prev) => ({ ...prev, isOpen: false }))}
        onNextStep={() => setTransferModal((prev) => ({ ...prev, step: 2 }))}
        onConfirm={handleTransfer}
      />

      {deleteConfirm.isOpen && (
        <ConfirmModal
          theme={theme}
          title="Hapus dari Whitelist?"
          description={
            <div className="space-y-2">
              <p>Apakah Anda yakin ingin menghapus pengurus <span className="font-bold text-red-500">{deleteConfirm.email}</span> dari whitelist?</p>
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-left">
                <p className="font-bold mb-1">⚠️ PERHATIAN:</p>
                <p>Pengurus ini tidak akan bisa login lagi ke sistem.</p>
              </div>
            </div>
          }
          confirmLabel="Ya, Hapus Pengurus"
          isLoading={deleteConfirm.isDeleting}
          onCancel={() => setDeleteConfirm({ isOpen: false, email: '', id: '', isDeleting: false })}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}


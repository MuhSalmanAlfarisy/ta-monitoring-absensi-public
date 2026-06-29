import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CalendarDays } from 'lucide-react';
import {
  colors,
  spacing,
  borderRadius,
  getThemeColors,
} from '../../../lib/theme';
import type {
  Event,
  EventFormData,
  JamaahResponse,
  PageType,
} from '../../../lib/types';
import { useAuth } from '../../../contexts/AuthContext';
import { useJamaahList } from '../../../hooks/useJamaah';
import { eventsService } from '../../../services/events';
import type { EventCreateData } from '../../../services/events';
import { getComputedEventStatus, getTodayIsoDate } from '../../../lib/utils';
import { EventCard } from './EventCard';
import { EventFilter } from './EventFilter';
import { AddEventModal } from './AddEventModal';
import { EventDetailModal } from './EventDetailModal';
import { HistoryModal } from './HistoryModal';
import { ParticipantModal } from './ParticipantModal';
import { ConfirmModal } from '../../ui/ConfirmModal';

type FilterValue = 'all' | 'active' | 'completed' | 'upcoming';

interface CustomEventPageProps {
  isDark: boolean;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

const createInitialFormData = (): EventFormData => ({
  title: '',
  description: '',
  type: 'one-time',
  days: [],
  date: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  lateThreshold: 15,
  selectedParticipants: [],
});

export function CustomEventPage({ isDark }: CustomEventPageProps) {
  const theme = getThemeColors(isDark);
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedHistoryDate, setExpandedHistoryDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>(() => createInitialFormData());
  const [participantSearch, setParticipantSearch] = useState('');
  const todayIsoDate = useMemo(() => getTodayIsoDate(), []);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    isLoading: boolean;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    onConfirm: () => { },
    isLoading: false,
    variant: 'danger',
  });

  const { data: jamaahList, loading: jamaahLoading, refetch } = useJamaahList({ initialLimit: 500 });

  // ─── Fetch Events ─────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setErrorEvents(null);
      const res = await eventsService.getEvents();
      const formattedEvents: Event[] = res.data.map((e) => ({
        id: String(e.id),
        title: e.title,
        description: e.description || '',
        type: e.event_type,
        days: e.days ? e.days.split(',') : [],
        date: e.date,
        startDate: e.start_date,
        endDate: e.end_date,
        startTime: e.start_time,
        endTime: e.end_time,
        lateThreshold: e.late_threshold,
        status: e.status,
        participantCount: typeof e.participants_count === 'number' ? e.participants_count : 0,
        participants: [],
        history: [],
        createdAt: e.created_at,
        createdBy: e.created_by || 'Sistem',
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setErrorEvents('Gagal memuat daftar event. Silakan coba lagi.');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (showAddModal && jamaahList.length === 0) {
      void refetch(1, participantSearch);
    }
  }, [showAddModal, participantSearch, refetch, jamaahList.length]);

  // ─── Derived State ────────────────────────────────────────────────────────

  const filteredJamaah = useMemo(() => {
    if (!participantSearch) return jamaahList;
    const lower = participantSearch.toLowerCase();
    return jamaahList.filter((j) => j.nama.toLowerCase().includes(lower));
  }, [jamaahList, participantSearch]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter === 'all') return true;
      return getComputedEventStatus(event, now) === filter;
    });
  }, [events, filter, now]);

  const selectedEventStatus = useMemo(() => {
    return selectedEvent ? getComputedEventStatus(selectedEvent, now) : null;
  }, [selectedEvent, now]);

  const canMarkRecurringAsCompleted = useCallback((event: Event) => {
    const computedStatus = getComputedEventStatus(event, now);
    return event.type === 'recurring' && computedStatus !== 'completed' && computedStatus !== 'inactive';
  }, [now]);

  const endDateMin = formData.startDate || todayIsoDate;

  const isAddEventDisabled =
    !formData.title ||
    !formData.startTime ||
    !formData.endTime ||
    (formData.type === 'one-time' && !formData.date) ||
    (formData.type === 'recurring' && formData.days.length === 0) ||
    (formData.type === 'rentang' && (!formData.startDate || !formData.endDate)) ||
    formData.selectedParticipants.length === 0;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const toggleParticipant = (jamaah: JamaahResponse) => {
    setFormData((prev) => {
      const isSelected = prev.selectedParticipants.some((p) => p.id === jamaah.id);
      return {
        ...prev,
        selectedParticipants: isSelected
          ? prev.selectedParticipants.filter((p) => p.id !== jamaah.id)
          : [...prev.selectedParticipants, jamaah],
      };
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleAddEvent = async () => {
    try {
      const payload: EventCreateData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.type,
        start_time: formData.startTime,
        end_time: formData.endTime,
        late_threshold: formData.lateThreshold,
        status: 'active',
        created_by: user?.displayName || 'Admin',
        participants: formData.selectedParticipants.map((p) => p.id),
      };
      if (formData.type === 'one-time' && formData.date.trim()) payload.date = formData.date;
      if (formData.type === 'recurring' && formData.days.length > 0) payload.days = formData.days.join(',');
      if (formData.type === 'rentang' && formData.startDate.trim() && formData.endDate.trim()) {
        payload.start_date = formData.startDate;
        payload.end_date = formData.endDate;
      }
      await eventsService.createEvent(payload);
      setShowAddModal(false);
      setFormData(createInitialFormData());
      setParticipantSearch('');
      await fetchEvents();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      let errorMessage = 'Gagal membuat event (kemungkinan jadwal bentrok).';
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((item: any) => {
          const field = item.loc ? item.loc.filter((l: string) => l !== 'body').join('.') : '';
          return field ? `${field}: ${item.msg}` : item.msg;
        }).join('\n');
      }
      alert(errorMessage);
    }
  };

  const confirmDeleteEvent = async (eventId: number) => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await eventsService.deleteEvent(eventId);
      setShowDetailModal(false);
      await fetchEvents();
      setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      let errorMessage = 'Gagal menghapus event.';
      if (typeof detail === 'string') errorMessage = detail;
      else if (Array.isArray(detail)) errorMessage = detail.map((i: any) => i.msg || i.message).join(', ');
      alert(errorMessage);
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Event?',
      description: (
        <div className="space-y-2">
          <p>Apakah Anda yakin ingin menghapus event ini secara permanen?</p>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-left">
            <p className="font-bold mb-1">⚠️ PERHATIAN:</p>
            <p>Seluruh data riwayat kehadiran pada event ini juga akan terhapus.</p>
          </div>
        </div>
      ),
      confirmLabel: 'Ya, Hapus Permanen',
      onConfirm: () => confirmDeleteEvent(eventId),
      isLoading: false,
      variant: 'danger',
    });
  };

  const mapDetailToEvent = (
    event: Event,
    detail: Awaited<ReturnType<typeof eventsService.getEventDetails>>
  ): Event => ({
    ...event,
    participantCount: typeof detail.participants_count === 'number'
      ? detail.participants_count
      : (detail.participants?.length || event.participantCount),
    participants: detail.participants?.map((p) => ({
      id: p.jamaah_id,
      name: p.nama_jamaah || 'Unknown',
      foto_profil_url: p.foto_profil_url,
    })) || [],
    history: detail.history || [],
  });

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
    try {
      const detail = await eventsService.getEventDetails(Number(event.id));
      setSelectedEvent(mapDetailToEvent(event, detail));
    } catch (err) {
      console.error(err);
    }
  };

  const handleHistoryClick = async (event: Event) => {
    try {
      const detail = await eventsService.getEventDetails(Number(event.id));
      setSelectedEvent(mapDetailToEvent(event, detail));
    } catch (err) {
      console.error(err);
      setSelectedEvent(event);
    } finally {
      setExpandedHistoryDate(null);
      setShowHistoryModal(true);
    }
  };

  const confirmCompleteEvent = async (event: Event) => {
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await eventsService.updateEventStatus(Number(event.id), 'completed');
      await fetchEvents();
      setShowDetailModal(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err) {
      console.error(err);
      alert('Gagal menyelesaikan event.');
      setConfirmModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCompleteEvent = async (event: Event) => {
    if (event.type !== 'recurring') return;
    const computedStatus = getComputedEventStatus(event, now);
    if (computedStatus === 'completed' || computedStatus === 'inactive') return;

    setConfirmModal({
      isOpen: true,
      title: 'Selesaikan Event?',
      description: (
        <div className="space-y-2">
          <p>Apakah Anda yakin ingin menyelesaikan event <span className="font-bold text-orange-500">{event.title}</span>?</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-3 rounded-lg text-xs text-left">
            <p className="font-bold mb-1">⚠️ INFORMASI:</p>
            <p>Event yang sudah diselesaikan tidak dapat diaktifkan kembali. Riwayat absensi tetap tersimpan.</p>
          </div>
        </div>
      ),
      confirmLabel: 'Ya, Selesaikan',
      onConfirm: () => confirmCompleteEvent(event),
      isLoading: false,
      variant: 'warning',
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: spacing.lg }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: spacing.xl }}>
        <p style={{ color: theme.text.secondary, fontSize: '0.875rem', marginBottom: spacing.xs }}>
          Halo,{' '}
          <strong style={{ color: theme.text.primary, fontWeight: 600 }}>
            {user?.displayName || 'Nama Pengurus'}
          </strong>
        </p>

        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: theme.text.primary, margin: `0 0 ${spacing.xs} 0` }}>
          Custom Event
        </h1>

        {/* Event count badge + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          <span
            style={{
              backgroundColor: `${theme.primary}18`,
              color: theme.primary,
              padding: `2px ${spacing.sm}`,
              borderRadius: borderRadius.full,
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            {events.length} event tersedia
          </span>
        </div>

        <EventFilter
          filter={filter}
          isDark={isDark}
          theme={theme}
          onChange={setFilter}
        />
      </div>

      {/* ── Add Event Button ── */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${colors.primary.main}40` }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowAddModal(true)}
        style={{
          width: '100%',
          marginBottom: spacing.xl,
          background: `linear-gradient(135deg, ${colors.primary.dark}, ${colors.primary.main})`,
          color: '#ffffff',
          border: 'none',
          borderRadius: borderRadius.xl,
          padding: `${spacing.md} ${spacing.lg}`,
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          boxShadow: `0 4px 14px ${colors.primary.main}30`,
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </div>
        Tambah Event Baru
      </motion.button>

      {/* ── Event List ── */}
      <div style={{ display: 'grid', gap: spacing.md }}>

        {/* Loading */}
        {loadingEvents && (
          <div
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              color: theme.text.secondary,
              backgroundColor: theme.surface,
              textAlign: 'center',
            }}
          >
            Memuat event...
          </div>
        )}

        {/* Error */}
        {!loadingEvents && errorEvents && (
          <div
            style={{
              border: `1px solid ${colors.error}`,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              color: colors.error,
              backgroundColor: theme.surface,
            }}
          >
            {errorEvents}
          </div>
        )}

        {/* Empty state */}
        {!loadingEvents && !errorEvents && filteredEvents.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: `${spacing.xl} ${spacing.lg}`,
              color: theme.text.secondary,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: theme.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: `0 auto ${spacing.md} auto`,
              }}
            >
              <CalendarDays size={32} color={theme.text.tertiary} />
            </div>
            <p style={{ fontWeight: 600, margin: `0 0 ${spacing.xs} 0`, color: theme.text.primary }}>
              Tidak ada event
            </p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Belum ada event pada kategori ini
            </p>
          </div>
        )}

        {/* Event cards */}
        {!loadingEvents && !errorEvents && filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            now={now}
            isDark={isDark}
            theme={theme}
            canMarkRecurringAsCompleted={canMarkRecurringAsCompleted}
            onCardClick={handleEventClick}
            onHistoryClick={handleHistoryClick}
            onCompleteClick={handleCompleteEvent}
          />
        ))}
      </div>

      {/* ── Modals ── */}
      <AddEventModal
        show={showAddModal}
        theme={theme}
        formData={formData}
        todayIsoDate={todayIsoDate}
        endDateMin={endDateMin}
        isAddEventDisabled={isAddEventDisabled}
        jamaahLoading={jamaahLoading}
        filteredJamaah={filteredJamaah}
        participantSearch={participantSearch}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEvent}
        onFormChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
        onDayToggle={handleDayToggle}
        onParticipantSearchChange={setParticipantSearch}
        onToggleParticipant={toggleParticipant}
      />

      <EventDetailModal
        show={showDetailModal}
        event={selectedEvent}
        selectedEventStatus={selectedEventStatus}
        theme={theme}
        canMarkRecurringAsCompleted={canMarkRecurringAsCompleted}
        onClose={() => setShowDetailModal(false)}
        onViewParticipants={() => setShowParticipantModal(true)}
        onComplete={handleCompleteEvent}
        onDelete={handleDeleteEvent}
      />

      <HistoryModal
        show={showHistoryModal}
        event={selectedEvent}
        isDark={isDark}
        theme={theme}
        expandedHistoryDate={expandedHistoryDate}
        onClose={() => {
          setShowHistoryModal(false);
          setExpandedHistoryDate(null);
        }}
        onToggleDate={setExpandedHistoryDate}
      />

      <ParticipantModal
        show={showParticipantModal}
        event={selectedEvent}
        theme={theme}
        onClose={() => setShowParticipantModal(false)}
      />

      {confirmModal.isOpen && (
        <ConfirmModal
          theme={theme}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          isLoading={confirmModal.isLoading}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
        />
      )}
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Check,
  Plus,
  Minus,
  Clock,
  Calendar,
  Users,
  Hourglass,
  AlertCircle
} from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions } from '../../../lib/theme';
import type { ThemeColors } from '../../../lib/theme';
import type { JamaahResponse } from '../../../lib/types';
import type { EventFormData } from '../../../lib/types';
import { isValidTimeValue, toMinutes, DAYS_OF_WEEK } from '../../../lib/utils';

// ─── Shared Input Style ───────────────────────────────────────────────────────

const inputStyle = (theme: ThemeColors, disabled = false, hasError = false) => ({
  width: '100%',
  padding: `${spacing.md} ${spacing.lg}`,
  border: `1.5px solid ${hasError ? '#ef4444' : disabled ? theme.border : theme.border}`,
  borderRadius: borderRadius.xl,
  backgroundColor: disabled ? `${theme.surface}80` : theme.background,
  color: theme.text.primary,
  fontSize: '0.9375rem',
  fontWeight: 500,
  transition: transitions.base,
  outline: 'none',
  cursor: disabled ? 'not-allowed' : 'text',
});

const labelStyle = (theme: ThemeColors, required = false) => ({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginBottom: spacing.sm,
  color: theme.text.primary,
  fontWeight: required ? 700 : 600,
  fontSize: '0.875rem',
});

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.xs,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddEventModalProps {
  show: boolean;
  theme: ThemeColors;
  formData: EventFormData;
  todayIsoDate: string;
  endDateMin: string;
  isAddEventDisabled: boolean;
  jamaahLoading: boolean;
  filteredJamaah: JamaahResponse[];
  participantSearch: string;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (data: Partial<EventFormData>) => void;
  onDayToggle: (day: string) => void;
  onParticipantSearchChange: (value: string) => void;
  onToggleParticipant: (jamaah: JamaahResponse) => void;
}

// ─── Helper Components ───────────────────────────────────────────────────────

const RadioCard = ({
  value,
  label,
  selected,
  onChange,
  theme
}: {
  value: string;
  label: string;
  selected: boolean;
  onChange: () => void;
  theme: ThemeColors;
}) => (
  <label
    data-value={value}
    onClick={onChange}
    style={{
      flex: 1,
      padding: `${spacing.md} ${spacing.sm}`,
      border: `2px solid ${selected ? colors.primary.main : theme.border}`,
      borderRadius: borderRadius.lg,
      backgroundColor: selected ? `${colors.primary.main}10` : theme.background,
      cursor: 'pointer',
      transition: transitions.base,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: spacing.xs,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: `2px solid ${selected ? colors.primary.main : theme.border}`,
        backgroundColor: selected ? colors.primary.main : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: transitions.fast,
      }}
    >
      {selected && <Check size={12} color="#ffffff" strokeWidth={3} />}
    </div>
    <span
      style={{
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: selected ? colors.primary.main : theme.text.primary,
        textAlign: 'center',
      }}
    >
      {label}
    </span>
  </label>
);

const DayChip = ({
  day,
  selected,
  onToggle,
  theme
}: {
  day: string;
  selected: boolean;
  onToggle: () => void;
  theme: ThemeColors;
}) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.full,
      border: 'none',
      backgroundColor: selected ? colors.primary.main : theme.surface,
      color: selected ? '#ffffff' : theme.text.secondary,
      fontSize: '0.8125rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: transitions.fast,
      transform: selected ? 'scale(1.05)' : 'scale(1)',
      boxShadow: selected ? shadows.md : 'none',
    }}
  >
    {day}
  </button>
);

const ParticipantChip = ({
  jamaah,
  onRemove,
  color
}: {
  jamaah: JamaahResponse;
  onRemove: () => void;
  color: string;
}) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.xs,
      padding: `${spacing.xs} ${spacing.sm} ${spacing.xs} ${spacing.xs}`,
      backgroundColor: `${colors.primary.main}15`,
      border: `1px solid ${colors.primary.main}30`,
      borderRadius: borderRadius.full,
    }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#ffffff',
      }}
    >
      {jamaah.nama.charAt(0).toUpperCase()}
    </div>
    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.primary.dark }}>
      {jamaah.nama}
    </span>
    <button
      type="button"
      onClick={onRemove}
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.primary.main,
      }}
    >
      <X size={14} strokeWidth={3} />
    </button>
  </motion.div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export function AddEventModal({
  show,
  theme,
  formData,
  todayIsoDate,
  endDateMin,
  isAddEventDisabled,
  jamaahLoading,
  filteredJamaah,
  participantSearch,
  onClose,
  onSubmit,
  onFormChange,
  onDayToggle,
  onParticipantSearchChange,
  onToggleParticipant,
}: AddEventModalProps) {

  // Generate avatar colors
  const getAvatarColor = (id: string | number) => {
    const colors_list = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const numericId = typeof id === 'number'
      ? id
      : Array.from(id).reduce((total, char) => total + char.charCodeAt(0), 0);
    return colors_list[Math.abs(numericId) % colors_list.length];
  };

  // Adjust late threshold
  const adjustLateTime = (delta: number) => {
    const current = formData.lateThreshold || 0;
    const newValue = Math.max(0, Math.min(120, current + delta));
    onFormChange({ lateThreshold: newValue });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: spacing.md,
          }}
        >
          <motion.div
            className="add-event-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.background,
              borderRadius: borderRadius['2xl'],
              maxWidth: 480,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              boxShadow: shadows.xl,
              display: 'flex',
              flexDirection: 'column' as const,
            } as any}
          >
            <style>{`
              .add-event-modal::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* ── Header ── */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: theme.background,
                padding: `${spacing.lg} ${spacing.xl}`,
                borderBottom: `1px solid ${theme.border}`,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{
                  margin: 0,
                  color: theme.text.primary,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}>
                  Tambah Event Baru
                </h2>
                <p style={{
                  margin: `${spacing.xs} 0 0 0`,
                  color: theme.text.secondary,
                  fontSize: '0.875rem'
                }}>
                  Isi detail event di bawah ini
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: theme.surface,
                  color: theme.text.secondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.surface;
                }}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Form Body ── */}
            <div style={{
              padding: `${spacing.xl} ${spacing.xl} 100px ${spacing.xl}`,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: spacing.xl
            }}>

              {/* Title */}
              <div style={sectionStyle}>
                <label style={labelStyle(theme, true)}>
                  Judul Event
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => onFormChange({ title: e.target.value })}
                  placeholder="Masukkan judul event"
                  style={{
                    ...inputStyle(theme),
                    ':focus': {
                      borderColor: colors.primary.main,
                      boxShadow: `0 0 0 3px ${colors.primary.main}20`,
                    },
                  } as any}
                />
              </div>

              {/* Description */}
              <div style={sectionStyle}>
                <label style={labelStyle(theme)}>Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => onFormChange({ description: e.target.value })}
                  placeholder="Masukkan deskripsi event (opsional)"
                  style={{
                    ...inputStyle(theme),
                    minHeight: 100,
                    resize: 'none',
                    padding: spacing.lg,
                  }}
                />
              </div>

              {/* Event Type */}
              <div style={sectionStyle}>
                <label style={labelStyle(theme)}>Jenis Event</label>
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <RadioCard
                    value="one-time"
                    label="Sekali Saja"
                    selected={formData.type === 'one-time'}
                    onChange={() => onFormChange({ type: 'one-time' })}
                    theme={theme}
                  />
                  <RadioCard
                    value="recurring"
                    label="Berulang"
                    selected={formData.type === 'recurring'}
                    onChange={() => onFormChange({ type: 'recurring' })}
                    theme={theme}
                  />
                  <RadioCard
                    value="rentang"
                    label="Rentang"
                    selected={formData.type === 'rentang'}
                    onChange={() => onFormChange({ type: 'rentang' })}
                    theme={theme}
                  />
                </div>
              </div>

              {/* Recurring: Day Checkboxes */}
              <AnimatePresence>
                {formData.type === 'recurring' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={sectionStyle}>
                      <label style={labelStyle(theme)}>Pilih Hari</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
                        {DAYS_OF_WEEK.map((day) => (
                          <DayChip
                            key={day}
                            day={day}
                            selected={formData.days.includes(day)}
                            onToggle={() => onDayToggle(day)}
                            theme={theme}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Date Fields */}
              <AnimatePresence mode="wait">
                {formData.type === 'one-time' && (
                  <motion.div
                    key="one-time"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={sectionStyle}
                  >
                    <label style={labelStyle(theme)}>
                      <Calendar size={16} style={{ marginRight: spacing.xs }} />
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      min={todayIsoDate}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next && next < todayIsoDate) return;
                        onFormChange({ date: next });
                      }}
                      style={inputStyle(theme)}
                    />
                  </motion.div>
                )}

                {formData.type === 'rentang' && (
                  <motion.div
                    key="rentang"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ display: 'flex', gap: spacing.md }}
                  >
                    <div style={{ flex: 1, ...sectionStyle }}>
                      <label style={labelStyle(theme)}>Tanggal Mulai</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        min={todayIsoDate}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next && next < todayIsoDate) return;
                          const shouldResetEnd = formData.endDate && next && formData.endDate < next;
                          onFormChange({ startDate: next, endDate: shouldResetEnd ? '' : formData.endDate });
                        }}
                        style={inputStyle(theme)}
                      />
                    </div>
                    <div style={{ flex: 1, ...sectionStyle }}>
                      <label style={labelStyle(theme)}>Tanggal Selesai</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        min={endDateMin}
                        disabled={!formData.startDate}
                        onChange={(e) => {
                          const next = e.target.value;
                          const minAllowed = formData.startDate || todayIsoDate;
                          if (next && next < minAllowed) return;
                          onFormChange({ endDate: next });
                        }}
                        style={inputStyle(theme, !formData.startDate)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Time Range */}
              <div style={{ display: 'flex', gap: spacing.md }}>
                <div style={{ flex: 1, ...sectionStyle }}>
                  <label style={labelStyle(theme)}>
                    <Clock size={16} style={{ marginRight: spacing.xs }} />
                    Dari Jam
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    step={60}
                    onChange={(e) => {
                      const next = e.target.value;
                      const shouldResetEnd =
                        formData.endTime &&
                        isValidTimeValue(next) &&
                        isValidTimeValue(formData.endTime) &&
                        toMinutes(formData.endTime) < toMinutes(next);
                      onFormChange({ startTime: next, endTime: shouldResetEnd ? '' : formData.endTime });
                    }}
                    style={inputStyle(theme)}
                  />
                </div>
                <div style={{ flex: 1, ...sectionStyle }}>
                  <label style={labelStyle(theme)}>
                    <Clock size={16} style={{ marginRight: spacing.xs }} />
                    Sampai Jam
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    min={formData.startTime || undefined}
                    step={60}
                    disabled={!formData.startTime}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (
                        next &&
                        formData.startTime &&
                        isValidTimeValue(formData.startTime) &&
                        isValidTimeValue(next) &&
                        toMinutes(next) < toMinutes(formData.startTime)
                      ) return;
                      onFormChange({ endTime: next });
                    }}
                    style={inputStyle(theme, !formData.startTime)}
                  />
                </div>
              </div>

              {/* Late Threshold - NEW DESIGN */}
              <div style={sectionStyle}>
                <label style={labelStyle(theme)}>
                  <Hourglass size={16} style={{ marginRight: spacing.xs }} />
                  Batas Keterlambatan
                </label>
                <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="number"
                      value={formData.lateThreshold || 15}
                      min="0"
                      max="120"
                      onChange={(e) => onFormChange({ lateThreshold: parseInt(e.target.value) || 0 })}
                      style={{
                        ...inputStyle(theme),
                        paddingRight: 60,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: spacing.lg,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: theme.text.secondary,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        pointerEvents: 'none',
                      }}
                    >
                      menit
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      type="button"
                      onClick={() => adjustLateTime(-5)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: borderRadius.lg,
                        border: `1.5px solid ${theme.border}`,
                        backgroundColor: theme.surface,
                        color: theme.text.secondary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: transitions.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.border;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.surface;
                      }}
                    >
                      <Minus size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustLateTime(5)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        backgroundColor: `${colors.primary.main}15`,
                        color: colors.primary.main,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: transitions.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary.main;
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primary.main}15`;
                        e.currentTarget.style.color = colors.primary.main;
                      }}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <p style={{
                  margin: `${spacing.xs} 0 0 0`,
                  fontSize: '0.75rem',
                  color: theme.text.tertiary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}>
                  <AlertCircle size={12} />
                  Jamaah yang datang melebihi batas waktu akan tercatat terlambat
                </p>
              </div>

              {/* Participant Picker - NEW DESIGN */}
              <div style={sectionStyle}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}>
                  <label style={{ ...labelStyle(theme), marginBottom: 0 }}>
                    <Users size={16} style={{ marginRight: spacing.xs }} />
                    Pilih Partisipan
                  </label>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: colors.primary.main,
                      backgroundColor: `${colors.primary.main}15`,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.full,
                    }}
                  >
                    {formData.selectedParticipants.length} dipilih
                  </span>
                </div>

                {/* Selected Chips */}
                <AnimatePresence>
                  {formData.selectedParticipants.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: spacing.sm,
                        marginBottom: spacing.md,
                        padding: spacing.sm,
                        backgroundColor: theme.surface,
                        borderRadius: borderRadius.lg,
                        maxHeight: 100,
                        overflowY: 'auto',
                      }}
                    >
                      {formData.selectedParticipants.map((p) => (
                        <ParticipantChip
                          key={p.id}
                          jamaah={p}
                          onRemove={() => onToggleParticipant(p)}
                          color={getAvatarColor(p.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: `${spacing.md} ${spacing.lg}`,
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: borderRadius.xl,
                    backgroundColor: theme.background,
                    marginBottom: spacing.md,
                    transition: transitions.base,
                  }}
                >
                  <Search size={18} color={theme.text.tertiary} style={{ marginRight: spacing.md }} />
                  <input
                    type="text"
                    placeholder="Cari jamaah..."
                    value={participantSearch}
                    onChange={(e) => onParticipantSearchChange(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      color: theme.text.primary,
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                    }}
                  />
                </div>

                {/* List */}
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: borderRadius.xl,
                    backgroundColor: theme.background,
                  }}
                >
                  {jamaahLoading ? (
                    <div
                      style={{
                        padding: spacing.xl,
                        textAlign: 'center',
                        color: theme.text.secondary,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          border: `3px solid ${theme.border}`,
                          borderTopColor: colors.primary.main,
                          borderRadius: '50%',
                          margin: '0 auto',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <p style={{ marginTop: spacing.md, fontSize: '0.875rem' }}>
                        Memuat jamaah...
                      </p>
                    </div>
                  ) : filteredJamaah.length === 0 ? (
                    <div
                      style={{
                        padding: spacing.xl,
                        textAlign: 'center',
                        color: theme.text.secondary,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: theme.surface,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          marginBottom: spacing.md,
                        }}
                      >
                        <Search size={24} color={theme.text.tertiary} />
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                        Tidak ada jamaah ditemukan
                      </p>
                      <p style={{ fontSize: '0.75rem', marginTop: spacing.xs }}>
                        Coba kata kunci lain
                      </p>
                    </div>
                  ) : (
                    filteredJamaah.map((jamaah, index) => {
                      const isSelected = formData.selectedParticipants.some((p) => p.id === jamaah.id);
                      return (
                        <motion.div
                          key={jamaah.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => onToggleParticipant(jamaah)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: `${spacing.md} ${spacing.lg}`,
                            borderBottom: `1px solid ${theme.border}`,
                            cursor: 'pointer',
                            backgroundColor: isSelected ? `${colors.primary.main}08` : 'transparent',
                            transition: transitions.fast,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = theme.surface;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                backgroundColor: getAvatarColor(jamaah.id),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: '#ffffff',
                              }}
                            >
                              {jamaah.nama.charAt(0).toUpperCase()}
                            </div>
                            <span style={{
                              fontSize: '0.9375rem',
                              fontWeight: 600,
                              color: theme.text.primary
                            }}>
                              {jamaah.nama}
                            </span>
                          </div>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? colors.primary.main : theme.border}`,
                              backgroundColor: isSelected ? colors.primary.main : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: transitions.fast,
                            }}
                          >
                            {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Sticky Footer ── */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: theme.background,
                padding: `${spacing.lg} ${spacing.xl}`,
                borderTop: `1px solid ${theme.border}`,
                display: 'flex',
                gap: spacing.md,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: `${spacing.md} ${spacing.lg}`,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: borderRadius.xl,
                  backgroundColor: 'transparent',
                  color: theme.text.secondary,
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Batal
              </button>
              <button
                onClick={onSubmit}
                disabled={isAddEventDisabled}
                style={{
                  flex: 2,
                  padding: `${spacing.md} ${spacing.lg}`,
                  border: 'none',
                  borderRadius: borderRadius.xl,
                  backgroundColor: colors.primary.main,
                  color: '#ffffff',
                  cursor: isAddEventDisabled ? 'not-allowed' : 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  opacity: isAddEventDisabled ? 0.5 : 1,
                  boxShadow: isAddEventDisabled ? 'none' : `0 4px 14px ${colors.primary.main}40`,
                  transition: transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
                onMouseEnter={(e) => {
                  if (!isAddEventDisabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary.main}50`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAddEventDisabled) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 14px ${colors.primary.main}40`;
                  }
                }}
              >
                <Check size={18} strokeWidth={3} />
                Simpan Event
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

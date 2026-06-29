import { Calendar, Activity, Save, LogOut, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../../../lib/theme';
import type { RamadhanSettingsResponse } from '../../../../lib/types';

export type ValidationStatus = 'idle' | 'loading' | 'valid' | 'expired' | 'too_early';

interface RamadhanSettingsProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  isMobile: boolean;
  ramadhanMode: boolean;
  ramadhanStartDate: string;
  ramadhanEndDate: string;
  isRamadhanRunning: boolean;
  ramadhanSettings: RamadhanSettingsResponse | null;
  ramadhanLoading: boolean;
  ramadhanSaving: boolean;
  ramadhanError: string | null;
  validationStatus: ValidationStatus;
  validationMessage: string;
  ramadhanStartMinDate: string;
  ramadhanStartMaxDate: string;
  ramadhanEndMaxDate: string;
  ramadhanDateHint: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onToggle: (targetMode: boolean) => void;
  onCekValidasi: () => void;
  onResetValidation: () => void;
}

export function RamadhanSettings({
  theme, isDark, isMobile,
  ramadhanMode, ramadhanStartDate, ramadhanEndDate,
  isRamadhanRunning, ramadhanSettings,
  ramadhanLoading, ramadhanSaving, ramadhanError,
  validationStatus, validationMessage,
  ramadhanStartMinDate, ramadhanStartMaxDate, ramadhanEndMaxDate, ramadhanDateHint,
  onStartDateChange, onEndDateChange,
  onToggle, onCekValidasi, onResetValidation,
}: RamadhanSettingsProps) {
  const calculateDuration = (startTime: string) => {
    const diff = Math.abs(new Date().getTime() - new Date(startTime).getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days} hari ${hours} jam`;
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    return `${minutes} menit`;
  };

  const dateInputStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surface,
    color: theme.text.primary,
    fontSize: '0.875rem',
    width: '100%', outline: 'none',
  };

  const dateInputLockedStyle: React.CSSProperties = {
    ...dateInputStyle,
    border: '1px solid transparent',
    backgroundColor: isDark ? 'rgba(22, 163, 74, 0.1)' : '#F0FDF4',
    color: '#16A34A', fontWeight: 600, cursor: 'not-allowed',
  };

  const isExpired = ramadhanMode && ramadhanEndDate && new Date() > new Date(`${ramadhanEndDate}T23:59:59`);

  return (
    <div
      style={{
        padding: isMobile ? spacing.md : spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: theme.surfaceHover,
        border: `1px solid ${ramadhanMode && !isExpired ? colors.primary.main : theme.border}`,
        marginBottom: isMobile ? spacing.lg : spacing.xl,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Active badge */}
      {ramadhanMode && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          backgroundColor: isExpired ? (isDark ? '#475569' : '#94A3B8') : (isRamadhanRunning ? '#16A34A' : colors.primary.main),
          color: '#fff', padding: '4px 12px',
          borderBottomLeftRadius: borderRadius.md,
          fontSize: '0.75rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {isExpired ? '⚪ Telah Berakhir' : (isRamadhanRunning ? '🟢 Sedang Berjalan' : 'Mode Aktif')}
        </div>
      )}

      {/* Title */}
      <h4 style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 600, color: theme.text.primary, margin: 0, marginBottom: spacing.xs, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <Calendar size={isMobile ? 18 : 20} color={isExpired ? theme.text.secondary : theme.primary} />
        Pengaturan Mode Ramadhan
      </h4>
      <p style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', color: theme.text.secondary, margin: 0, marginBottom: spacing.md }}>
        {isExpired 
          ? 'Periode Ramadhan telah berakhir. Silakan tutup mode ini untuk kembali ke pengaturan normal.'
          : 'Mode ini akan mengaktifkan jadwal sholat khusus (Tarawih) dan aturan absensi Ramadhan.'}
      </p>

      {/* Status duration when active */}
      {ramadhanMode && ramadhanSettings?.ramadhan_activated_at && (
        <div style={{
          backgroundColor: isExpired ? (isDark ? 'rgba(100, 116, 139, 0.1)' : '#F8FAFC') : (isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF'),
          border: `1px solid ${isExpired ? (isDark ? 'rgba(100, 116, 139, 0.2)' : '#E2E8F0') : (isDark ? 'rgba(59, 130, 246, 0.2)' : '#BFDBFE')}`,
          borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md,
          display: 'flex', gap: spacing.md, alignItems: 'flex-start',
        }}>
          <Activity size={20} color={isExpired ? theme.text.secondary : theme.primary} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: theme.text.primary, fontWeight: 600 }}>Status Aktivasi</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: theme.text.secondary, marginTop: 4 }}>
              {isExpired ? (
                <>Periode Ramadhan telah selesai pada <strong style={{ color: theme.text.primary }}>{new Date(ramadhanEndDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong>.</>
              ) : (
                <>Mode ini telah berjalan selama <strong style={{ color: theme.primary }}>{calculateDuration(ramadhanSettings.ramadhan_activated_at)}</strong>.</>
              )}
              <br />
              {ramadhanSettings.updated_by && (
                <>Diaktifkan oleh: <strong style={{ color: theme.text.primary }}>{ramadhanSettings.updated_by}</strong><br /></>
              )}
              Pada: {new Date(ramadhanSettings.ramadhan_activated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      )}

      {/* ── ACTIVE STATE ── */}
      {ramadhanMode && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
            <div style={{ display: 'grid', gap: spacing.xs }}>
              <label style={{ fontSize: '0.75rem', color: theme.text.secondary }}>Tanggal Mulai Ramadhan</label>
              <input type="date" value={ramadhanStartDate} disabled style={dateInputLockedStyle} />
            </div>
            <div style={{ display: 'grid', gap: spacing.xs }}>
              <label style={{ fontSize: '0.75rem', color: theme.text.secondary }}>Tanggal Akhir Ramadhan</label>
              <input type="date" value={ramadhanEndDate} disabled style={dateInputLockedStyle} />
            </div>
          </div>
          {ramadhanError && <p style={{ marginTop: spacing.sm, color: colors.error, fontSize: '0.8125rem' }}>{ramadhanError}</p>}
          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
            <button
              onClick={() => onToggle(false)}
              disabled={ramadhanLoading || ramadhanSaving}
              style={{
                padding: '8px 16px', borderRadius: borderRadius.sm,
                border: 'none', 
                backgroundColor: isExpired ? (isDark ? '#334155' : '#64748B') : colors.error, 
                color: '#fff',
                fontWeight: 600, cursor: ramadhanSaving ? 'not-allowed' : 'pointer',
                opacity: ramadhanSaving ? 0.7 : 1,
                display: 'inline-flex', alignItems: 'center', gap: spacing.xs,
                flex: isMobile ? 1 : 'initial', fontSize: '0.875rem',
                transition: transitions.base,
              }}
            >
              {ramadhanSaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={16} />}
              {isExpired ? 'Tutup Mode Ramadhan' : 'Batalkan Mode Ramadhan'}
            </button>
          </div>
        </>
      )}

      {/* ── INACTIVE STATE ── */}
      {!ramadhanMode && (
        <>
          {/* idle */}
          {validationStatus === 'idle' && (
            <button
              onClick={onCekValidasi}
              style={{
                padding: '10px 20px', borderRadius: borderRadius.sm,
                border: `1px solid ${theme.primary}`,
                backgroundColor: 'transparent', color: theme.primary,
                fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: spacing.sm,
                fontSize: '0.875rem', transition: transitions.base,
              }}
            >
              <Calendar size={16} />
              Cek Validasi Ramadhan
            </button>
          )}

          {/* loading */}
          {validationStatus === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
              <Loader2 size={20} className="animate-spin" color={theme.primary} />
              <span style={{ fontSize: '0.875rem', color: theme.text.secondary }}>Memeriksa data Idul Fitri...</span>
            </div>
          )}

          {/* expired */}
          {validationStatus === 'expired' && (
            <div style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, borderRadius: borderRadius.md, padding: spacing.md, display: 'flex', gap: spacing.sm, alignItems: 'flex-start' }}>
              <AlertCircle size={20} color={colors.error} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: isDark ? '#ff0000ff' : '#991B1B', lineHeight: 1.5 }}>{validationMessage}</p>
                <button onClick={onResetValidation} style={{ marginTop: spacing.sm, padding: '7px 16px', borderRadius: borderRadius.sm, border: 'none', backgroundColor: theme.border, color: theme.text.primary, fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600, boxShadow: '0 5px 15px -3px rgba(0,0,0,0.25), 0 4px 6px -2px rgba(0,0,0,0.1)', transition: transitions.base }}>Kembali</button>
              </div>
            </div>
          )}

          {/* too_early */}
          {validationStatus === 'too_early' && (
            <div style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB', border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A'}`, borderRadius: borderRadius.md, padding: spacing.md, display: 'flex', gap: spacing.sm, alignItems: 'flex-start' }}>
              <AlertCircle size={20} color={colors.warning} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: isDark ? '#FCD34D' : '#92400E', lineHeight: 1.5 }}>{validationMessage}</p>
                <button onClick={onResetValidation} style={{ marginTop: spacing.sm, padding: '7px 16px', borderRadius: borderRadius.sm, border: 'none', backgroundColor: theme.border, color: theme.text.primary, fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600, boxShadow: '0 5px 15px -3px rgba(0,0,0,0.25), 0 4px 6px -2px rgba(0,0,0,0.1)', transition: transitions.base }}>Kembali</button>
              </div>
            </div>
          )}

          {/* valid */}
          {validationStatus === 'valid' && (
            <>
              <div style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0'}`, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, display: 'flex', gap: spacing.sm, alignItems: 'flex-start' }}>
                <CheckCircle size={20} color={colors.success} style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: isDark ? '#6EE7B7' : '#065F46', lineHeight: 1.5 }}>{validationMessage}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
                <div style={{ display: 'grid', gap: spacing.xs }}>
                  <label style={{ fontSize: '0.75rem', color: theme.text.secondary }}>Tanggal Mulai Ramadhan</label>
                  <input
                    type="date"
                    value={ramadhanStartDate}
                    min={ramadhanStartMinDate || undefined}
                    max={ramadhanStartMaxDate || undefined}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gap: spacing.xs }}>
                  <label style={{ fontSize: '0.75rem', color: theme.text.secondary }}>Tanggal Akhir Ramadhan</label>
                  <input
                    type="date"
                    value={ramadhanEndDate}
                    min={(ramadhanStartDate || ramadhanStartMinDate) || undefined}
                    max={ramadhanEndMaxDate || undefined}
                    disabled={!ramadhanStartDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    style={{
                      ...dateInputStyle,
                      opacity: !ramadhanStartDate ? 0.6 : 1,
                      cursor: !ramadhanStartDate ? 'not-allowed' : 'text',
                    }}
                  />
                </div>
              </div>
              {ramadhanDateHint && (
                <p style={{ margin: 0, marginBottom: spacing.md, fontSize: '0.75rem', color: theme.text.tertiary }}>
                  {ramadhanDateHint}
                </p>
              )}
              {ramadhanError && <p style={{ marginTop: spacing.sm, color: colors.error, fontSize: '0.8125rem' }}>{ramadhanError}</p>}
              <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
                <button onClick={onResetValidation} style={{ padding: '8px 16px', borderRadius: borderRadius.sm, border: `1px solid ${theme.border}`, backgroundColor: 'transparent', color: theme.text.secondary, fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>Batal</button>
                <button
                  onClick={() => onToggle(true)}
                  disabled={ramadhanLoading || ramadhanSaving}
                  style={{
                    padding: '8px 16px', borderRadius: borderRadius.sm,
                    border: 'none', backgroundColor: theme.primary, color: '#fff',
                    fontWeight: 600, cursor: ramadhanSaving ? 'not-allowed' : 'pointer',
                    opacity: ramadhanSaving ? 0.7 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: spacing.xs,
                    flex: isMobile ? 1 : 'initial', fontSize: '0.875rem',
                  }}
                >
                  {ramadhanSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={16} />}
                  Simpan & Aktifkan
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

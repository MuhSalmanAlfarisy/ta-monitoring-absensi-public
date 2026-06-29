import { Mail, Plus, UserCheck, AlertCircle } from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions, getThemeColors } from '../../../../lib/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddWhitelistFormProps {
  isMobile: boolean;
  theme: ReturnType<typeof getThemeColors>;
  email: string;
  emailError: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddWhitelistForm({
  isMobile,
  theme,
  email,
  emailError,
  onEmailChange,
  onSubmit,
}: AddWhitelistFormProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: isMobile ? borderRadius.md : borderRadius.lg,
        padding: isMobile ? spacing.md : spacing.lg,
        border: `1px solid ${theme.border}`,
        marginBottom: isMobile ? spacing.md : spacing.lg,
        boxShadow: shadows.sm,
      }}
    >
      {/* ── Section Title ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <UserCheck size={20} color={colors.primary.main} strokeWidth={2.5} />
        <h2
          style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: 600,
            color: theme.text.primary,
            margin: 0,
          }}
        >
          Tambah Pengurus Baru
        </h2>
      </div>

      {/* ── Email Input ── */}
      <div style={{ marginBottom: spacing.md }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.text.primary,
            marginBottom: spacing.xs,
          }}
        >
          Email Google
        </label>
        <div style={{ position: 'relative' }}>
          <Mail
            size={18}
            style={{
              position: 'absolute',
              left: spacing.sm,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.text.tertiary,
              pointerEvents: 'none',
            }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
            placeholder="contoh@gmail.com"
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} 40px`,
              borderRadius: borderRadius.md,
              border: `1px solid ${emailError ? '#EF4444' : theme.border}`,
              backgroundColor: theme.background,
              color: theme.text.primary,
              fontSize: '0.875rem',
              outline: 'none',
              transition: `all ${transitions.fast}`,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary.main;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary.main}15`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = emailError ? '#EF4444' : theme.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Inline error */}
        {emailError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
            }}
          >
            <AlertCircle size={14} color="#EF4444" />
            <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{emailError}</span>
          </div>
        )}
      </div>

      {/* ── Submit Button ── */}
      <button
        onClick={onSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          width: isMobile ? '100%' : 'auto',
          padding: `${spacing.sm} ${spacing.lg}`,
          borderRadius: borderRadius.md,
          border: 'none',
          backgroundColor: colors.primary.main,
          color: '#ffffff',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary.light;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = shadows.md;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary.main;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <Plus size={18} />
        <span>Tambah ke Daftar</span>
      </button>
    </div>
  );
}

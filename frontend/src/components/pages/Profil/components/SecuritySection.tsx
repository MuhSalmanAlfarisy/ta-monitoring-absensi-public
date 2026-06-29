import { Activity, Eye, EyeOff } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface SecuritySectionProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  lastPasswordChange: string | null;
  showPasswordSection: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  isUpdatingPassword: boolean;
  formatTimestamp: (v?: string | null) => string;
  onTogglePasswordSection: () => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onUpdatePassword: () => void;
  onShowActivityLog: () => void;
}

export function SecuritySection({
  theme, isMobile,
  lastPasswordChange, showPasswordSection,
  password, confirmPassword, showPassword, isUpdatingPassword,
  formatTimestamp,
  onTogglePasswordSection, onPasswordChange, onConfirmPasswordChange,
  onToggleShowPassword, onUpdatePassword, onShowActivityLog,
}: SecuritySectionProps) {
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    paddingRight: '40px',
    borderRadius: borderRadius.sm,
    border: `1px solid ${theme.border}`,
    fontSize: '0.875rem',
    width: '100%',
    backgroundColor: theme.surface,
    color: theme.text.primary,
    outline: 'none',
  };

  const eyeBtn: React.CSSProperties = {
    position: 'absolute', right: '10px', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', color: theme.text.secondary,
  };

  return (
    <div
      style={{
        padding: isMobile ? spacing.md : spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: theme.surfaceHover,
        border: `1px solid ${theme.border}`,
        marginBottom: isMobile ? spacing.lg : spacing.xl,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <h4 style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
            Keamanan Akun
          </h4>
          {lastPasswordChange && (
            <span style={{ fontSize: '0.75rem', color: colors.error, fontWeight: 500 }}>
              (Terakhir diubah: {formatTimestamp(lastPasswordChange)})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            onClick={onShowActivityLog}
            style={{ background: 'none', border: 'none', color: theme.text.secondary, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Activity size={16} />
            Log Aktivitas
          </button>
          <div style={{ width: 1, backgroundColor: theme.border }} />
          <button
            onClick={onTogglePasswordSection}
            style={{ background: 'none', border: 'none', color: theme.primary, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {showPasswordSection ? 'Tutup' : 'Atur Password'}
          </button>
        </div>
      </div>

      {showPasswordSection && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <p style={{ fontSize: '0.875rem', color: theme.text.secondary, margin: 0 }}>
            Silahkan ubah password anda disini. Pastikan untuk menggunakan password yang kuat dan tidak mudah ditebak untuk menjaga keamanan akun Anda.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {/* Password */}
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password Baru" value={password} onChange={(e) => onPasswordChange(e.target.value)} style={inputStyle} />
              <button type="button" onClick={onToggleShowPassword} style={eyeBtn}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Konfirmasi */}
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Konfirmasi Password" value={confirmPassword} onChange={(e) => onConfirmPasswordChange(e.target.value)} style={inputStyle} />
              <button type="button" onClick={onToggleShowPassword} style={eyeBtn}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={onUpdatePassword}
              disabled={isUpdatingPassword}
              style={{
                padding: '8px 16px',
                backgroundColor: colors.primary.main, color: '#fff',
                border: 'none', borderRadius: borderRadius.sm,
                fontWeight: 600,
                cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
                alignSelf: 'flex-start', marginTop: spacing.xs,
              }}
            >
              {isUpdatingPassword ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
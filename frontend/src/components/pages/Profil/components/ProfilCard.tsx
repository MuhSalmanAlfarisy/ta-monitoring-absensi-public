import { useRef } from 'react';
import { Mail, Shield, Camera, Save, X, Loader2 } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface ProfilCardProps {
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  isMobile: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isUploading: boolean;
  displayName: string;
  email: string;
  photoURL?: string;
  role: string;
  newName: string;
  onNewNameChange: (v: string) => void;
  onPhotoClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancelEdit: () => void;
}

export function ProfilCard({
  theme, isDark, isMobile,
  isEditing, isSaving, isUploading,
  displayName, email, photoURL, role,
  newName, onNewNameChange,
  onPhotoClick, onFileChange,
  onSave, onCancelEdit,
}: ProfilCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? spacing.md : spacing.lg,
        marginBottom: isMobile ? spacing.lg : spacing.xl,
        paddingBottom: isMobile ? spacing.md : spacing.xl,
        borderBottom: `1px solid ${theme.border}`,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => photoURL && onPhotoClick()}
          style={{
            width: isMobile ? '64px' : '96px',
            height: isMobile ? '64px' : '96px',
            borderRadius: borderRadius.full,
            background: photoURL
              ? `url(${photoURL}) center/cover no-repeat`
              : `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: 700, color: '#ffffff',
            flexShrink: 0,
            marginBottom: isMobile ? spacing.md : '0',
            border: `4px solid ${theme.surface}`,
            cursor: photoURL ? 'pointer' : 'default',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => photoURL && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => photoURL && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {!photoURL && displayName?.charAt(0).toUpperCase()}
        </div>

        {isEditing && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                position: 'absolute',
                bottom: isMobile ? spacing.md : 0,
                right: 0,
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '50%',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              }}
            >
              {isUploading
                ? <Loader2 size={16} className="animate-spin text-gray-500" />
                : <Camera size={16} color={theme.text.primary} />}
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
        {isEditing ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            style={{
              fontSize: isMobile ? '1.125rem' : '1.5rem',
              fontWeight: 600, color: theme.text.primary,
              backgroundColor: theme.surfaceHover,
              border: `1px solid ${theme.border}`,
              borderRadius: borderRadius.sm,
              padding: '4px 8px',
              width: '100%', maxWidth: '300px',
            }}
          />
        ) : (
          <h3
            style={{
              fontSize: isMobile ? '1.125rem' : '1.5rem',
              fontWeight: 600, color: theme.text.primary,
              margin: 0, marginBottom: spacing.xs, lineHeight: 1.3,
            }}
          >
            {displayName || 'Jamaah'}
          </h3>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs, flexWrap: 'wrap' }}>
          <Mail size={isMobile ? 14 : 16} color={theme.text.tertiary} />
          <p style={{ fontSize: isMobile ? '0.8125rem' : '0.9375rem', color: theme.text.secondary, margin: 0 }}>
            {email}
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: spacing.xs,
            padding: isMobile ? `${spacing.xs} ${spacing.sm}` : `${spacing.xs} ${spacing.md}`,
            borderRadius: borderRadius.sm,
            backgroundColor: isDark ? `${theme.primary}20` : `${theme.primary}15`,
            border: `1px solid ${theme.primary}40`,
            marginTop: spacing.xs,
          }}
        >
          <Shield size={isMobile ? 12 : 14} color={theme.primary} />
          <span style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: 600, color: theme.primary, textTransform: 'capitalize' }}>
            {role === 'king_admin' ? 'King Admin' : role || 'Pengurus'}
          </span>
        </div>

        {isEditing && (
          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
            <button
              onClick={onSave}
              disabled={isSaving}
              style={{
                padding: '6px 12px',
                backgroundColor: colors.success,
                color: '#fff', border: 'none',
                borderRadius: borderRadius.sm,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.875rem', fontWeight: 600,
              }}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              style={{
                padding: '6px 12px',
                backgroundColor: theme.surfaceHover,
                color: theme.text.secondary,
                border: `1px solid ${theme.border}`,
                borderRadius: borderRadius.sm,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.875rem', fontWeight: 600,
              }}
            >
              <X size={14} />
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
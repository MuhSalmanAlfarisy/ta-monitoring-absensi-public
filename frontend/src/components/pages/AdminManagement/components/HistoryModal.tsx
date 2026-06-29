import { X, Loader2 } from 'lucide-react';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';
import type { WhitelistUser } from '../../../../lib/types';


interface HistoryModalProps {
  isMobile: boolean;
  theme: ReturnType<typeof getThemeColors>;
  isOpen: boolean;
  title: string;
  isLoading: boolean;
  historyUsers: WhitelistUser[];
  formatDateTime: (value?: string | null) => string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HistoryModal({
  isMobile,
  theme,
  isOpen,
  title,
  isLoading,
  historyUsers,
  formatDateTime,
  onClose,
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? spacing.sm : spacing.md,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: isMobile ? '90vh' : '80vh',
          backgroundColor: theme.surface,
          borderRadius: isMobile ? borderRadius.md : borderRadius.lg,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: isMobile ? spacing.sm : spacing.md,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: theme.text.primary,
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: 700,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                marginTop: 2,
                color: theme.text.secondary,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
              }}
            >
              Menampilkan riwayat timestamp whitelist dan aktivasi
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: theme.text.secondary,
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={isMobile ? 20 : 22} />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? spacing.sm : spacing.md,
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 160,
              }}
            >
              <Loader2 size={22} color={colors.primary.main} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : historyUsers.length === 0 ? (
            <p
              style={{
                margin: 0,
                textAlign: 'center',
                color: theme.text.secondary,
                fontSize: '0.875rem',
              }}
            >
              Tidak ada data riwayat untuk filter ini.
            </p>
          ) : isMobile ? (
            /* ── Mobile Cards ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {historyUsers.map((item) => (
                <div
                  key={`${item.email}-${item.status}`}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: theme.background,
                    padding: spacing.sm,
                  }}
                >
                  <p style={{ margin: 0, color: theme.text.primary, fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-word' }}>
                    {item.email}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: theme.text.secondary, fontSize: '0.75rem' }}>
                    Status: {item.status === 'active' ? 'Aktif' : 'Menunggu'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: theme.text.secondary, fontSize: '0.75rem' }}>
                    Masuk whitelist: {formatDateTime(item.createdAt)}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: theme.text.secondary, fontSize: '0.75rem' }}>
                    Aktif sejak: {formatDateTime(item.activatedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop Table ── */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Email', 'Status', 'Masuk Whitelist', 'Aktif Sejak'].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: spacing.sm,
                          textAlign: 'left',
                          fontSize: '0.8rem',
                          color: theme.text.secondary,
                          fontWeight: 600,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyUsers.map((item) => (
                    <tr
                      key={`${item.email}-${item.status}`}
                      style={{ borderBottom: `1px solid ${theme.border}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surfaceHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: spacing.sm, fontSize: '0.85rem', color: theme.text.primary }}>
                        {item.email}
                      </td>
                      <td style={{ padding: spacing.sm, fontSize: '0.8rem', color: theme.text.secondary }}>
                        {item.status === 'active' ? 'Aktif' : 'Menunggu'}
                      </td>
                      <td style={{ padding: spacing.sm, fontSize: '0.8rem', color: theme.text.secondary }}>
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td style={{ padding: spacing.sm, fontSize: '0.8rem', color: theme.text.secondary }}>
                        {formatDateTime(item.activatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

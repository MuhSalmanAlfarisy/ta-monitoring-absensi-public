import { Search, Mail, Shield, Trash2, UserCheck } from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions, getThemeColors } from '../../../../lib/theme';
import type { WhitelistUser } from '../../../../lib/types';
import { StatusBadge } from './StatusBadge';


interface WhitelistTableProps {
  isMobile: boolean;
  theme: ReturnType<typeof getThemeColors>;
  filteredUsers: WhitelistUser[];
  totalCount: number;
  searchQuery: string;
  formatDate: (value?: string | null) => string;
  onSearchChange: (value: string) => void;
  onDelete: (email: string, id: string) => void;
  onTransfer: (email: string) => void;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  isMobile,
  theme,
  searchQuery,
}: {
  isMobile: boolean;
  theme: ReturnType<typeof getThemeColors>;
  searchQuery: string;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: isMobile
          ? `${spacing.xl} ${spacing.md}`
          : `${spacing.xl} ${spacing.lg}`,
      }}
    >
      <div
        style={{
          width: isMobile ? 80 : 120,
          height: isMobile ? 80 : 120,
          margin: `0 auto ${spacing.md} auto`,
          borderRadius: borderRadius.full,
          backgroundColor: `${colors.primary.main}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UserCheck
          size={isMobile ? 40 : 60}
          color={colors.primary.main}
          strokeWidth={1.5}
        />
      </div>
      <h3
        style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: 600,
          color: theme.text.primary,
          margin: 0,
          marginBottom: spacing.xs,
        }}
      >
        {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada pengurus terdaftar'}
      </h3>
      <p
        style={{
          fontSize: isMobile ? '0.75rem' : '0.875rem',
          color: theme.text.secondary,
          margin: 0,
        }}
      >
        {searchQuery
          ? 'Coba gunakan kata kunci lain'
          : 'Tambahkan pengurus baru menggunakan form di atas'}
      </p>
    </div>
  );
}

// ─── Desktop Table ────────────────────────────────────────────────────────────

function DesktopTable({
  theme,
  filteredUsers,
  formatDate,
  onDelete,
  onTransfer,
}: Pick<WhitelistTableProps, 'theme' | 'filteredUsers' | 'formatDate' | 'onDelete' | 'onTransfer'>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
            {['Email', 'Tanggal Ditambahkan', 'Status', 'Aksi'].map((col, i) => (
              <th
                key={col}
                style={{
                  padding: spacing.md,
                  textAlign: i >= 2 ? 'center' : 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: theme.text.secondary,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr
              key={user.id}
              style={{
                borderBottom: `1px solid ${theme.border}`,
                transition: `background-color ${transitions.fast}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Email */}
              <td style={{ padding: spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Mail size={16} color={theme.text.tertiary} />
                  <span style={{ fontSize: '0.875rem', color: theme.text.primary }}>
                    {user.email}
                  </span>
                </div>
              </td>

              {/* Tanggal */}
              <td style={{ padding: spacing.md }}>
                <span style={{ fontSize: '0.875rem', color: theme.text.secondary }}>
                  {formatDate(user.createdAt)}
                </span>
              </td>

              {/* Status */}
              <td style={{ padding: spacing.md, textAlign: 'center' }}>
                <StatusBadge status={user.status} />
              </td>

              {/* Aksi */}
              <td style={{ padding: spacing.md, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {user.status === 'active' && (
                    <button
                      onClick={() => onTransfer(user.email)}
                      title="Jadikan King Admin"
                      style={{
                        padding: spacing.sm,
                        borderRadius: borderRadius.md,
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#2563EB',
                        cursor: 'pointer',
                        transition: `all ${transitions.fast}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Shield size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(user.email, user.id)}
                    title="Hapus Pengurus"
                    style={{
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#EF4444',
                      cursor: 'pointer',
                      transition: `all ${transitions.fast}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Mobile Card List ─────────────────────────────────────────────────────────

function MobileCardList({
  theme,
  filteredUsers,
  formatDate,
  onDelete,
  onTransfer,
}: Pick<WhitelistTableProps, 'theme' | 'filteredUsers' | 'formatDate' | 'onDelete' | 'onTransfer'>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.7fr 1.2fr auto auto',
          gap: 8,
          alignItems: 'center',
          padding: `0 ${spacing.xs}`,
          fontSize: '0.625rem',
          fontWeight: 700,
          color: theme.text.tertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        <span>Email</span>
        <span>Tanggal Ditambahkan</span>
        <span style={{ textAlign: 'center' }}>Status</span>
        <span style={{ textAlign: 'center' }}>Aksi</span>
      </div>

      {filteredUsers.map((user) => (
        <div
          key={user.id}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.background,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.7fr 1.2fr auto auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {/* Email */}
            <span
              style={{
                fontSize: '0.75rem',
                color: theme.text.primary,
                wordBreak: 'break-word',
                lineHeight: 1.3,
              }}
            >
              {user.email}
            </span>

            {/* Tanggal */}
            <span
              style={{
                fontSize: '0.6875rem',
                color: theme.text.secondary,
                lineHeight: 1.3,
              }}
            >
              {formatDate(user.createdAt)}
            </span>

            {/* Status badge mini */}
            <div style={{ textAlign: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  borderRadius: borderRadius.full,
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  backgroundColor: user.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                  color: user.status === 'active' ? '#065F46' : '#92400E',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.status === 'active' ? 'Aktif' : 'Menunggu'}
              </span>
            </div>

            {/* Aksi */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {user.status === 'active' && (
                <button
                  onClick={() => onTransfer(user.email)}
                  title="Alihkan King Admin"
                  style={{
                    padding: 5,
                    borderRadius: borderRadius.sm,
                    border: 'none',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    cursor: 'pointer',
                  }}
                >
                  <Shield size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(user.email, user.id)}
                style={{
                  padding: 5,
                  borderRadius: borderRadius.sm,
                  border: 'none',
                  backgroundColor: '#FEE2E2',
                  color: '#EF4444',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WhitelistTable ───────────────────────────────────────────────────────────

export function WhitelistTable({
  isMobile,
  theme,
  filteredUsers,
  totalCount,
  searchQuery,
  formatDate,
  onSearchChange,
  onDelete,
  onTransfer,
}: WhitelistTableProps) {
  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: isMobile ? borderRadius.md : borderRadius.lg,
        padding: isMobile ? spacing.md : spacing.lg,
        border: `1px solid ${theme.border}`,
        boxShadow: shadows.sm,
      }}
    >
      {/* ── Search Bar ── */}
      <div style={{ marginBottom: spacing.md }}>
        <div style={{ position: 'relative' }}>
          <Search
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
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari email..."
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} 40px`,
              borderRadius: borderRadius.md,
              border: `1px solid ${theme.border}`,
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
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      {filteredUsers.length === 0 ? (
        <EmptyState isMobile={isMobile} theme={theme} searchQuery={searchQuery} />
      ) : isMobile ? (
        <MobileCardList
          theme={theme}
          filteredUsers={filteredUsers}
          formatDate={formatDate}
          onDelete={onDelete}
          onTransfer={onTransfer}
        />
      ) : (
        <DesktopTable
          theme={theme}
          filteredUsers={filteredUsers}
          formatDate={formatDate}
          onDelete={onDelete}
          onTransfer={onTransfer}
        />
      )}

      {/* ── Results Count ── */}
      {filteredUsers.length > 0 && (
        <div
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${theme.border}`,
            textAlign: 'center',
            fontSize: '0.75rem',
            color: theme.text.tertiary,
          }}
        >
          Menampilkan {filteredUsers.length} dari {totalCount} pengurus
        </div>
      )}
    </div>
  );
}

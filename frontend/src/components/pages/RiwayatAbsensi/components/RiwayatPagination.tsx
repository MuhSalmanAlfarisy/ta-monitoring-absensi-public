import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';

interface RiwayatPaginationProps {
  theme: ReturnType<typeof getThemeColors>;
  isMobile: boolean;
  page: number;
  totalPages: number;
  loading: boolean;
  onSetPage: (page: number) => void;
}

export function RiwayatPagination({ theme, isMobile, page, totalPages, loading, onSetPage }: RiwayatPaginationProps) {
  if (totalPages <= 1) return null;

  const btnBase: React.CSSProperties = {
    padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
    borderRadius: borderRadius.md,
    fontSize: isMobile ? '0.8rem' : '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.3s',
    border: `1px solid ${theme.border}40`,
    background: theme.surfaceHover,
    color: theme.text.secondary,
  };

  const activeBtnStyle: React.CSSProperties = {
    ...btnBase,
    background: colors.primary.main,
    border: '1px solid transparent',
    color: '#ffffff',
    boxShadow: `0 4px 12px ${colors.primary.main}40`,
  };

  const disabledStyle: React.CSSProperties = {
    ...btnBase,
    opacity: 0.4,
    cursor: 'not-allowed',
    background: theme.surfaceHover,
    border: `1px solid ${theme.border}20`,
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        flexWrap: 'wrap' as const,
        marginTop: spacing.md,
      }}
    >
      {/* Prev */}
      <button
        onClick={() => onSetPage(Math.max(1, page - 1))}
        disabled={page === 1 || loading}
        style={page === 1 || loading ? disabledStyle : btnBase}
        onMouseEnter={(e) => {
          if (page !== 1 && !loading) {
            e.currentTarget.style.borderColor = colors.primary.main;
            e.currentTarget.style.color = theme.text.primary;
            e.currentTarget.style.background = theme.surface;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${theme.border}40`;
          e.currentTarget.style.color = theme.text.secondary;
          e.currentTarget.style.background = theme.surfaceHover;
        }}
      >
        ‹ Prev
      </button>

      {/* Page numbers — show sliding window */}
      {(() => {
        const maxVisible = isMobile ? 3 : 5;
        let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;

        if (endPage > totalPages) {
          endPage = totalPages;
          startPage = Math.max(1, endPage - maxVisible + 1);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }

        return (
          <>
            {startPage > 1 && (
              <>
                <button
                  onClick={() => onSetPage(1)}
                  style={btnBase}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary.main;
                    e.currentTarget.style.color = theme.text.primary;
                    e.currentTarget.style.background = theme.surface;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${theme.border}40`;
                    e.currentTarget.style.color = theme.text.secondary;
                    e.currentTarget.style.background = theme.surfaceHover;
                  }}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span style={{ color: theme.text.tertiary, padding: `0 ${spacing.xs}` }}>…</span>
                )}
              </>
            )}
            {pages.map((pageNum) => {
              const isActive = page === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => onSetPage(pageNum)}
                  style={isActive ? activeBtnStyle : btnBase}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = colors.primary.main;
                      e.currentTarget.style.color = theme.text.primary;
                      e.currentTarget.style.background = theme.surface;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = `${theme.border}40`;
                      e.currentTarget.style.color = theme.text.secondary;
                      e.currentTarget.style.background = theme.surfaceHover;
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span style={{ color: theme.text.tertiary, padding: `0 ${spacing.xs}` }}>…</span>
                )}
                <button
                  onClick={() => onSetPage(totalPages)}
                  style={btnBase}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary.main;
                    e.currentTarget.style.color = theme.text.primary;
                    e.currentTarget.style.background = theme.surface;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${theme.border}40`;
                    e.currentTarget.style.color = theme.text.secondary;
                    e.currentTarget.style.background = theme.surfaceHover;
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}
          </>
        );
      })()}

      {/* Next */}
      <button
        onClick={() => onSetPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages || loading}
        style={page >= totalPages || loading ? disabledStyle : btnBase}
        onMouseEnter={(e) => {
          if (page < totalPages && !loading) {
            e.currentTarget.style.borderColor = colors.primary.main;
            e.currentTarget.style.color = theme.text.primary;
            e.currentTarget.style.background = theme.surface;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${theme.border}40`;
          e.currentTarget.style.color = theme.text.secondary;
          e.currentTarget.style.background = theme.surfaceHover;
        }}
      >
        Next ›
      </button>
    </div>
  );
}
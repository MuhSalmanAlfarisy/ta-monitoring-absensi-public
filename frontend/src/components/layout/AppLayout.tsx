
import { useState, useEffect, ReactNode } from 'react';

import { Home, Users, TrendingUp, FileText, Settings, X, Trophy, User, Shield, PanelLeftClose, PanelLeft, Wrench } from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions, getThemeColors } from '../../lib/theme';
import { ConvexBottomNav } from './ConvexBottomNav';

import { PageType } from '../../lib/types';

interface AppLayoutProps {
  children: ReactNode;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isDark: boolean;
  role?: string;
}

const menuItems: { id: PageType; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'jamaah', label: 'Data Jamaah', icon: Users },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'riwayat', label: 'Riwayat Absensi', icon: TrendingUp },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'admin', label: 'Manajemen User', icon: Shield },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];



// Inject global animations once
const injectAnimations = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('app-layout-animations')) return;

  const style = document.createElement('style');
  style.id = 'app-layout-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
};

export function AppLayout({ children, currentPage, onNavigate, isDark, role }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const theme = getThemeColors(isDark);
  const isLeaderboardActive = currentPage === 'leaderboard';
  const isProfilActive = currentPage === 'profil';

  const [navWidth, setNavWidth] = useState(0);

  // Inject animations once
  useEffect(() => {
    injectAnimations();
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setNavWidth(window.innerWidth);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (page: PageType) => {
    onNavigate(page);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.background,
        transition: `background-color ${transitions.base}`,
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: desktopSidebarCollapsed ? 0 : '280px',
            height: '100vh',
            backgroundColor: theme.surface,
            borderRight: desktopSidebarCollapsed ? 'none' : `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            transition: `width ${transitions.base}, border ${transitions.base}`,
            zIndex: 40,
            overflow: 'hidden',
          }}
        >
          <SidebarContent
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isDark={isDark}
            theme={theme}
            role={role}
            onCollapse={() => setDesktopSidebarCollapsed(true)}
            showCollapseButton
          />
        </aside>
      )}

      {/* Desktop: tombol buka sidebar ketika collapsed */}
      {!isMobile && desktopSidebarCollapsed && (
        <button
          type="button"
          onClick={() => setDesktopSidebarCollapsed(false)}
          aria-label="Buka sidebar"
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '48px',
            border: `1px solid ${theme.border}`,
            borderLeft: 'none',
            borderTopRightRadius: borderRadius.md,
            borderBottomRightRadius: borderRadius.md,
            backgroundColor: theme.surface,
            color: theme.text.secondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 41,
            transition: `all ${transitions.fast}`,
            boxShadow: shadows.sm,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.surfaceHover;
            e.currentTarget.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.surface;
            e.currentTarget.style.color = theme.text.secondary;
          }}
        >
          <PanelLeft size={18} />
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              animation: 'fadeIn 200ms ease-out',
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              backgroundColor: theme.surface,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 51,
              animation: 'slideInLeft 300ms ease-out',
              boxShadow: shadows.xl,
            }}
          >
            <SidebarContent
              currentPage={currentPage}
              onNavigate={handleNavigate}
              isDark={isDark}
              theme={theme}
              onClose={() => setSidebarOpen(false)}
              role={role}
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        style={{
          marginLeft: isMobile ? 0 : desktopSidebarCollapsed ? 0 : '280px',
          paddingBottom: isMobile ? '80px' : spacing.xl,
          minHeight: '100vh',
          transition: `margin ${transitions.base}`,
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <header
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: theme.surface,
              borderBottom: `1px solid ${theme.border}`,
              padding: `${spacing.sm} ${spacing.md}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
              transition: `all ${transitions.base}`,
            }}
          >
            <button
              onClick={() => handleNavigate('leaderboard')}
              aria-label="Leaderboard"
              aria-current={isLeaderboardActive ? 'page' : undefined}
              style={{
                backgroundColor: isLeaderboardActive
                  ? (isDark ? `${colors.primary.main}33` : `${colors.primary.main}14`)
                  : 'transparent',
                border: 'none',
                padding: spacing.xs,
                color: isLeaderboardActive ? colors.primary.main : theme.text.secondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: borderRadius.full,
                boxShadow: isLeaderboardActive
                  ? (isDark
                    ? `0 0 0 1px ${colors.primary.main}66`
                    : `0 0 0 1px ${colors.primary.main}33`)
                  : 'none',
                transition: `all ${transitions.fast}`,
              }}
            >
              <Trophy size={22} strokeWidth={isLeaderboardActive ? 2.5 : 2} />
            </button>
            <h1
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.primary.main,
                margin: 0,
                textAlign: 'center',
                flex: 1,
              }}
            >
              Masjid Jami Nurut Taqwa
            </h1>
            <button
              onClick={() => handleNavigate('profil')}
              aria-label="Profil"
              aria-current={isProfilActive ? 'page' : undefined}
              style={{
                backgroundColor: isProfilActive
                  ? (isDark ? `${colors.primary.main}33` : `${colors.primary.main}14`)
                  : 'transparent',
                border: 'none',
                padding: spacing.xs,
                color: isProfilActive ? colors.primary.main : theme.text.secondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: borderRadius.full,
                boxShadow: isProfilActive
                  ? (isDark
                    ? `0 0 0 1px ${colors.primary.main}66`
                    : `0 0 0 1px ${colors.primary.main}33`)
                  : 'none',
                transition: `all ${transitions.fast}`,
              }}
            >
              <User size={22} strokeWidth={isProfilActive ? 2.5 : 2} />
            </button>
          </header>
        )}

        {/* Page Content */}
        <div style={{ padding: isMobile ? spacing.sm : spacing.lg }}>{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <ConvexBottomNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isDark={isDark}
          role={role}
          navWidth={navWidth}
        />
      )}
    </div>
  );
}

// Sidebar Content Component
interface SidebarContentProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isDark: boolean;
  theme: ReturnType<typeof getThemeColors>;
  onClose?: () => void;
  onCollapse?: () => void;
  showCollapseButton?: boolean;
  role?: string;
}

function SidebarContent({ currentPage, onNavigate, isDark, theme, onClose, onCollapse, showCollapseButton, role }: SidebarContentProps) {
  const headerButton = onClose ? (
    <button
      type="button"
      onClick={onClose}
      aria-label="Tutup menu"
      style={{
        padding: spacing.xs,
        borderRadius: borderRadius.md,
        border: 'none',
        backgroundColor: 'transparent',
        color: theme.text.secondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${transitions.fast}`,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.surfaceHover;
        e.currentTarget.style.color = theme.text.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = theme.text.secondary;
      }}
    >
      <X size={20} />
    </button>
  ) : showCollapseButton && onCollapse ? (
    <button
      type="button"
      onClick={onCollapse}
      aria-label="Sembunyikan sidebar"
      style={{
        padding: spacing.xs,
        borderRadius: borderRadius.md,
        border: 'none',
        backgroundColor: 'transparent',
        color: theme.text.secondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${transitions.fast}`,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.surfaceHover;
        e.currentTarget.style.color = theme.text.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = theme.text.secondary;
      }}
    >
      <PanelLeftClose size={20} />
    </button>
  ) : null;

  return (
    <>
      {/* Logo & Tombol Tutup/Collapse */}
      <div
        style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: borderRadius.lg,
            background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i
            className="fas fa-mosque"
            style={{ fontSize: '24px', color: '#ffffff' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: theme.primary,
              margin: 0,
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Masjid Jami
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: theme.text.secondary,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Nurut Taqwa
          </p>
        </div>

        {headerButton}
      </div>

      {/* Menu Items */}
      <nav
        style={{
          flex: 1,
          padding: spacing.md,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {menuItems.filter(item => item.id !== 'admin' || role === 'king_admin').map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: `${spacing.md} ${spacing.md}`,
                  borderRadius: borderRadius.lg,
                  border: 'none',
                  backgroundColor: isActive
                    ? isDark
                      ? colors.primary.light
                      : colors.primary.main
                    : 'transparent',
                  color: isActive ? '#ffffff' : theme.text.primary,
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  transition: `all ${transitions.fast}`,
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = theme.surfaceHover;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={() => onNavigate('custom')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              padding: `${spacing.md} ${spacing.md}`,
              borderRadius: borderRadius.lg,
              border: 'none',
              backgroundColor: currentPage === 'custom'
                ? isDark
                  ? colors.primary.light
                  : colors.primary.main
                : 'transparent',
              color: currentPage === 'custom' ? '#ffffff' : theme.text.primary,
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: currentPage === 'custom' ? 600 : 500,
              textAlign: 'left',
              transition: `all ${transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 'custom') {
                e.currentTarget.style.backgroundColor = theme.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 'custom') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Wrench size={20} strokeWidth={currentPage === 'custom' ? 2.5 : 2} />
            <span>Custom</span>
          </button>
        </div>
      </nav>

      {/* Footer Info */}
      <div
        style={{
          padding: spacing.lg,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            backgroundColor: isDark
              ? `${colors.primary.light}15`
              : `${colors.primary.main}10`,
            border: `1px solid ${isDark ? colors.primary.light : colors.primary.main}30`,
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              color: theme.text.secondary,
              margin: 0,
              textAlign: 'center',
            }}
          >
            Dashboard Absensi v2.0
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: theme.text.tertiary,
              margin: 0,
              marginTop: '4px',
              textAlign: 'center',
            }}
          >
            © 2026 DKM Nurut Taqwa
          </p>
        </div>
      </div>
    </>
  );
}

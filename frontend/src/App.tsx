
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PageType } from './lib/types';

import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterCompletion } from './components/auth/RegisterCompletion';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { useAuth } from './contexts/AuthContext';

import { DashboardMain } from './components/pages/Dashboard';
import { DataJamaah } from './components/pages/DataJamaah/index';
import { Leaderboard } from './components/pages/Leaderboard/index';
import { RiwayatAbsensi } from './components/pages/RiwayatAbsensi/index';
import { LaporanStatistik } from './components/pages/LaporanStatistik/index';
import { Profil } from './components/pages/Profil/index';
import { AdminManagement } from './components/pages/AdminManagement';
import { Pengaturan } from './components/pages/Pengaturan/index';
import { CustomEventPage } from './components/pages/CustomEvent';

const PAGE_TO_PATH: Record<PageType, string> = {
  dashboard: '/dashboard',
  jamaah: '/jamaah',
  leaderboard: '/leaderboard',
  riwayat: '/riwayat',
  laporan: '/laporan',
  profil: '/profil',
  admin: '/admin',
  pengaturan: '/pengaturan',
  custom: '/custom',
};

const PATH_TO_PAGE = new Map<string, PageType>(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as PageType])
);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

function getPageFromPath(pathname: string): PageType | null {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === '/') {
    return 'dashboard';
  }

  return PATH_TO_PAGE.get(normalizedPath) ?? null;
}

/* =========================
   APP
 ========================= */

export default function App() {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('dark-mode') === 'true';
    } catch {
      return false;
    }
  });

  const currentPage = useMemo(() => getPageFromPath(location.pathname), [location.pathname]);

  // Sync isDark with class on html element for global CSS styling
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDark]);

  /* =========================
     HANDLERS
  ========================= */

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleNavigate = useCallback((page: PageType) => {
    const targetPath = PAGE_TO_PATH[page];
    const currentPath = normalizePathname(location.pathname);

    if (targetPath !== currentPath) {
      navigate(targetPath, { replace: false });
    }
  }, [location.pathname, navigate]);

  const handleDarkModeChange = useCallback((dark: boolean) => {
    setIsDark(dark);
    try {
      localStorage.setItem('dark-mode', String(dark));
    } catch { /* quota exceeded or private mode */ }
  }, []);

  /* =========================
     PAGE RENDERER
  ========================= */

  const renderPage = (page: PageType) => {
    switch (page) {
      case 'dashboard':
        return <DashboardMain isDark={isDark} />;

      case 'jamaah':
        return <DataJamaah isDark={isDark} />;

      case 'leaderboard':
        return <Leaderboard isDark={isDark} />;

      case 'riwayat':
        return <RiwayatAbsensi isDark={isDark} />;

      case 'laporan':
        return <LaporanStatistik isDark={isDark} />;

      case 'profil':
        return (
          <Profil
            isDark={isDark}
            onLogout={handleLogout}
          />
        );

      case 'admin':
        return (
          <AdminRoute>
            <AdminManagement isDark={isDark} />
          </AdminRoute>
        );

      case 'pengaturan':
        return (
          <Pengaturan
            isDark={isDark}
            onDarkModeChange={handleDarkModeChange}
          />
        );

      case 'custom':
        return (
          <CustomEventPage
            isDark={isDark}
            currentPage={page}
            onNavigate={handleNavigate}
          />
        );

      default:
        return <DashboardMain isDark={isDark} />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage isDark={isDark} />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage isDark={isDark} />
        </PublicRoute>
      } />
      <Route path="/register-completion" element={
        <ProtectedRoute>
          <RegisterCompletion isDark={isDark} />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          {currentPage ? (
            <AppLayout
              currentPage={currentPage}
              onNavigate={handleNavigate}
              isDark={isDark}
              role={role || undefined}
            >
              {renderPage(currentPage)}
            </AppLayout>
          ) : (
            <Navigate to="/dashboard" replace />
          )}
        </ProtectedRoute>
      } />
    </Routes>
  );
}

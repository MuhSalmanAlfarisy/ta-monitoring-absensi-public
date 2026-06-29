import { useEffect, useMemo, useState } from 'react';
import {
    Home, Users, TrendingUp, FileText, Shield, Wrench, Settings
} from 'lucide-react';
import { colors } from '../../lib/theme';
import { PageType } from '../../lib/types';

/* ─── nav items ─── */
const bottomNavItems: { id: PageType; label: string; icon: typeof Home }[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'jamaah', label: 'Jamaah', icon: Users },
    { id: 'riwayat', label: 'Riwayat', icon: TrendingUp },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Shield },
    { id: 'custom', label: 'Custom', icon: Wrench },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

/* ─── Design Constants ─── */
const BAR_HEIGHT = 76;
const TOTAL_HEIGHT = BAR_HEIGHT + 16;

/* ─── props ─── */
interface ConvexBottomNavProps {
    currentPage: PageType;
    onNavigate: (page: PageType) => void;
    isDark: boolean;
    role?: string;
    navWidth: number;
}

export function ConvexBottomNav({
    currentPage,
    onNavigate,
    isDark,
    role,
    navWidth,
}: ConvexBottomNavProps) {
    const items = useMemo(
        () => bottomNavItems.filter((i) => i.id !== 'admin' || role === 'king_admin'),
        [role],
    );

    const [anchoredPage, setAnchoredPage] = useState<PageType>(() => items[0]?.id ?? 'dashboard');

    useEffect(() => {
        if (items.length === 0) return;
        if (!items.some((item) => item.id === anchoredPage)) {
            setAnchoredPage(items[0].id);
        }
    }, [items, anchoredPage]);

    const isCurrentInBottomNav = items.some((item) => item.id === currentPage);

    useEffect(() => {
        if (isCurrentInBottomNav) {
            setAnchoredPage(currentPage);
        }
    }, [currentPage, isCurrentInBottomNav]);

    const showBottomActive = isCurrentInBottomNav;
    const effectivePage = isCurrentInBottomNav ? currentPage : anchoredPage;

    // Colors
    const bgColor = isDark ? '#1a2332' : '#f5f5f7';
    const activeBg = isDark 
        ? `linear-gradient(145deg, ${colors.primary.dark}, ${colors.primary.main})` 
        : `linear-gradient(145deg, #ffffff, ${colors.primary.light})`;
    const activeIconColor = isDark ? '#ffffff' : colors.primary.dark;
    const inactiveIconColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const activeLabelColor = isDark ? '#ffffff' : colors.primary.dark;
    const inactiveLabelColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: TOTAL_HEIGHT,
                zIndex: 40,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 8,
            }}
        >
            {/* Main Container */}
            <div
                style={{
                    width: navWidth - 16,
                    height: BAR_HEIGHT,
                    backgroundColor: bgColor,
                    borderRadius: 28,
                    boxShadow: isDark 
                        ? 'inset 2px 2px 5px rgba(0,0,0,0.5), inset -2px -2px 5px rgba(255,255,255,0.05), 0 -4px 20px rgba(0,0,0,0.4)' 
                        : 'inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.8), 0 -4px 20px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                    padding: 6,
                }}
            >
                {/* Navigation Items */}
                <nav
                    style={{
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        gap: 4,
                        zIndex: 10,
                    }}
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = showBottomActive && item.id === effectivePage;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                style={{
                                    flex: 1,
                                    position: 'relative',
                                    height: '100%',
                                    background: isActive ? activeBg : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    padding: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    borderRadius: 22,
                                    boxShadow: isActive 
                                        ? isDark 
                                            ? '5px 5px 10px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.1), inset 1px 1px 2px rgba(255,255,255,0.2)' 
                                            : '5px 5px 10px rgba(0,0,0,0.15), -2px -2px 6px rgba(255,255,255,1), inset 1px 1px 2px rgba(255,255,255,0.8)'
                                        : 'none',
                                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                {/* Inner highlight untuk efek emboss lebih kuat */}
                                {isActive && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '50%',
                                            borderRadius: '22px 22px 0 0',
                                            background: isDark 
                                                ? 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)' 
                                                : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                )}

                                {/* Icon */}
                                <div
                                    style={{
                                        position: 'relative',
                                        zIndex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <Icon
                                        size={isActive ? 24 : 22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        color={isActive ? activeIconColor : inactiveIconColor}
                                        style={{
                                            filter: isActive 
                                                ? isDark 
                                                    ? `drop-shadow(0 2px 4px rgba(0,0,0,0.5))` 
                                                    : `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`
                                                : 'none',
                                            transition: 'all 0.25s ease',
                                        }}
                                    />
                                </div>

                                {/* Label */}
                                <span
                                    style={{
                                        position: 'relative',
                                        zIndex: 2,
                                        fontFamily: '"Poppins", sans-serif',
                                        fontSize: '0.6rem',
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? activeLabelColor : inactiveLabelColor,
                                        transition: 'all 0.25s ease',
                                        textShadow: isActive 
                                            ? isDark 
                                                ? '0 2px 4px rgba(0,0,0,0.5)' 
                                                : '0 1px 2px rgba(0,0,0,0.1)'
                                            : 'none',
                                    }}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
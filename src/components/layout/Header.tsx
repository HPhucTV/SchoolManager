'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BarChart3,
    Activity,
    Users,
    Settings,
    School,
    LogOut,
    Trophy,
    CalendarDays,
    HeartPulse,
    Swords,
    TrendingUp,
    MoreHorizontal,
    Search,
    Command,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import GlobalSearch from './GlobalSearch';

const mainNavItems = [
    { href: '/teacher', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/teacher/lop-hoc', label: 'Lớp học', icon: School },
    { href: '/teacher/thong-ke', label: 'Thống kê', icon: BarChart3 },
    { href: '/teacher/hoat-dong', label: 'Hoạt động', icon: Activity },
    { href: '/teacher/thoi-khoa-bieu', label: 'TKB', icon: CalendarDays },
    { href: '/teacher/hoc-sinh', label: 'Học sinh', icon: Users },
    { href: '/teacher/thi-dua', label: 'Thi đua', icon: Trophy },
];

const moreNavItems = [
    { href: '/teacher/phan-tich', label: 'Phân tích học tập', icon: TrendingUp },
    { href: '/teacher/suc-khoe', label: 'Sức khỏe tinh thần', icon: HeartPulse },
    { href: '/teacher/quiz-battle', label: 'Quiz Battle', icon: Swords },
    { href: '/teacher/cai-dat', label: 'Cài đặt', icon: Settings },
];

export default function Header() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [moreOpen, setMoreOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isMoreActive = moreNavItems.some(item => pathname === item.href);

    return (
        <header suppressHydrationWarning style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            width: '100%',
            borderBottom: '1px solid #334155',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                height: '52px',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
            }}>
                {/* Logo */}
                <Link href="/teacher" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{
                        display: 'flex',
                        height: '32px',
                        width: '32px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                        boxShadow: '0 2px 8px rgba(20, 184, 166, 0.4)',
                    }}>
                        <School style={{ height: '18px', width: '18px', color: 'white' }} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>SchoolManager</span>
                </Link>

                {/* Search Trigger */}
                <button
                    onClick={() => setSearchOpen(true)}
                    title="Tìm kiếm (Ctrl+K)"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 14px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: 'rgba(148,163,184,0.06)',
                        color: '#64748b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Search style={{ width: '14px', height: '14px' }} />
                    <span>Tìm kiếm...</span>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        marginLeft: '4px',
                        background: 'rgba(148,163,184,0.12)',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#475569',
                    }}>
                        <Command style={{ width: '10px', height: '10px' }} />K
                    </span>
                </button>

                {/* Navigation */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    background: isActive ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
                                    color: isActive ? 'white' : '#94a3b8',
                                    boxShadow: isActive ? '0 2px 6px rgba(20, 184, 166, 0.3)' : 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <Icon style={{ height: '15px', width: '15px', flexShrink: 0 }} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* More Dropdown */}
                    <div ref={moreRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setMoreOpen(!moreOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: isMoreActive
                                    ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
                                    : moreOpen
                                        ? 'rgba(148, 163, 184, 0.15)'
                                        : 'transparent',
                                color: isMoreActive ? 'white' : '#94a3b8',
                                boxShadow: isMoreActive ? '0 2px 6px rgba(20, 184, 166, 0.3)' : 'none',
                            }}
                        >
                            <MoreHorizontal style={{ height: '15px', width: '15px' }} />
                            <span>Thêm</span>
                        </button>

                        {moreOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                right: 0,
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '6px',
                                minWidth: '200px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                zIndex: 100,
                            }}>
                                {moreNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMoreOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                textDecoration: 'none',
                                                transition: 'all 0.15s ease',
                                                background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                                                color: isActive ? '#14b8a6' : '#cbd5e1',
                                            }}
                                        >
                                            <Icon style={{ height: '16px', width: '16px', flexShrink: 0 }} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: 'none',
                            backgroundColor: 'rgba(248, 113, 113, 0.12)',
                            color: '#f87171',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <LogOut style={{ height: '14px', width: '14px' }} />
                        Thoát
                    </button>
                </div>
            </div>

            {/* Global Search Modal */}
            {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
        </header>
    );
}

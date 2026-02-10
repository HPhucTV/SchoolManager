'use client';

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
    BookOpen,
    FileText,
    Trophy
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
    { href: '/teacher', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { href: '/teacher/lop-hoc', label: 'Lớp học', icon: School },
    { href: '/teacher/thong-ke', label: 'Thống kê', icon: BarChart3 },
    { href: '/teacher/hoat-dong', label: 'Hoạt động', icon: Activity },
    { href: '/teacher/bai-kiem-tra', label: 'Bài kiểm tra', icon: BookOpen },
    { href: '/teacher/bai-tap', label: 'Bài tập', icon: FileText },
    { href: '/teacher/hoc-sinh', label: 'Học sinh', icon: Users },
    { href: '/teacher/thi-dua', label: 'Thi đua', icon: Trophy },
    { href: '/teacher/cai-dat', label: 'Cài đặt', icon: Settings },
];

export default function Header() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <header style={{
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
                height: '56px',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
            }}>
                {/* Logo */}
                <Link href="/teacher" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        height: '36px',
                        width: '36px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                        boxShadow: '0 2px 8px rgba(20, 184, 166, 0.4)',
                    }}>
                        <School style={{ height: '20px', width: '20px', color: 'white' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Happy Schools</h1>
                        <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Quản lý học sinh trong Giáo dục</p>
                    </div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Navigation */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        background: isActive ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
                                        color: isActive ? 'white' : '#94a3b8',
                                        boxShadow: isActive ? '0 2px 8px rgba(20, 184, 166, 0.3)' : 'none',
                                    }}
                                >
                                    <Icon style={{ height: '16px', width: '16px' }} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>

                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            border: 'none',
                            backgroundColor: 'rgba(248, 113, 113, 0.15)',
                            color: '#f87171',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <LogOut style={{ height: '16px', width: '16px' }} />
                        Thoát
                    </button>
                </div>
            </div>
        </header>
    );
}

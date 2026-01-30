'use client';

import { useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, GraduationCap, BookOpen, LogOut } from 'lucide-react';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/giao-vien', label: 'Giáo viên', icon: Users },
    { href: '/admin/lop-hoc', label: 'Lớp học', icon: BookOpen },
    { href: '/admin/hoc-sinh', label: 'Học sinh', icon: GraduationCap },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
                {/* Sidebar */}
                <aside style={{
                    width: '260px',
                    backgroundColor: '#1f2937',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Logo */}
                    <div style={{ marginBottom: '32px', padding: '0 8px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>
                            🎓 Happy Schools
                        </h1>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            Admin Panel
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav style={{ flex: 1 }}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        marginBottom: '8px',
                                        backgroundColor: isActive ? '#22c55e' : 'transparent',
                                        color: isActive ? 'white' : '#9ca3af',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                    }}>
                                        <item.icon size={20} />
                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User & Logout */}
                    <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
                        <div style={{ padding: '8px 16px', marginBottom: '8px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: 'white', margin: 0 }}>
                                {user?.name}
                            </p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                                Administrator
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        >
                            <LogOut size={20} />
                            Đăng xuất
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, padding: '24px' }}>
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}

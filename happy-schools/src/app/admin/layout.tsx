'use client';

import { useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    LogOut, Settings, Menu, Bell, ChevronRight, X
} from 'lucide-react';
import styles from './admin.module.css';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/giao-vien', label: 'Giáo viên', icon: Users },
    { href: '/admin/lop-hoc', label: 'Lớp học', icon: BookOpen },
    { href: '/admin/hoc-sinh', label: 'Học sinh', icon: GraduationCap },
    { href: '/admin/cai-dat', label: 'Cài đặt', icon: Settings },
];

const pageTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/giao-vien': 'Giáo viên',
    '/admin/lop-hoc': 'Lớp học',
    '/admin/hoc-sinh': 'Học sinh',
    '/admin/cai-dat': 'Cài đặt',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentTitle = pageTitles[pathname] || 'Admin';
    const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className={styles.adminWrapper}>
                {/* Sidebar Overlay (mobile) */}
                {sidebarOpen && (
                    <div
                        className={styles.sidebarOverlay}
                        style={{ display: 'block' }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                    {/* Logo */}
                    <div className={styles.logo}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h1 className={styles.logoTitle}>🎓 Happy Schools</h1>
                            <button
                                className={styles.btnIcon}
                                onClick={() => setSidebarOpen(false)}
                                style={{ display: sidebarOpen ? 'flex' : 'none' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className={styles.logoSub}>Admin Panel</p>
                    </div>

                    {/* Navigation */}
                    <nav className={styles.nav}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={isActive ? styles.navItemActive : styles.navItem}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className={styles.sidebarFooter}>
                        <button onClick={logout} className={styles.logoutBtn}>
                            <LogOut size={20} />
                            Đăng xuất
                        </button>
                    </div>
                </aside>

                {/* Main Area */}
                <div className={styles.mainArea}>
                    {/* Header */}
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <Menu size={20} />
                            </button>
                            <div className={styles.breadcrumb}>
                                Admin <ChevronRight size={14} /> <span>{currentTitle}</span>
                            </div>
                        </div>
                        <div className={styles.headerRight}>
                            <button className={styles.headerIconBtn}>
                                <Bell size={20} />
                                <span className={styles.notifDot} />
                            </button>
                            <div className={styles.userMenu}>
                                <div className={styles.userAvatar}>{initials}</div>
                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>{user?.name}</div>
                                    <div className={styles.userRole}>Administrator</div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main className={styles.mainContent}>
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}

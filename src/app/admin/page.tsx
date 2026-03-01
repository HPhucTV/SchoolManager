'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
    Users, GraduationCap, BookOpen, FileQuestion,
    Activity, ArrowUpRight, ArrowRight, Database, Server
} from 'lucide-react';
import styles from './admin.module.css';

interface DashboardStats {
    total_teachers: number;
    total_students: number;
    total_classes: number;
    total_quizzes: number;
    recent_users: {
        id: number;
        name: string;
        email: string;
        role: string;
        class_id?: number;
    }[];
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminApi.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            label: 'Giáo viên',
            value: stats?.total_teachers || 0,
            icon: Users,
            colorClass: styles.statIconBlue,
        },
        {
            label: 'Học sinh',
            value: stats?.total_students || 0,
            icon: GraduationCap,
            colorClass: styles.statIconGreen,
        },
        {
            label: 'Lớp học',
            value: stats?.total_classes || 0,
            icon: BookOpen,
            colorClass: styles.statIconPurple,
        },
        {
            label: 'Bài kiểm tra',
            value: stats?.total_quizzes || 0,
            icon: FileQuestion,
            colorClass: styles.statIconCyan, // We need to add this class or reuse one
        },
    ];

    if (loading) {
        return (
            <div className={styles.adminWrapper}>
                <div style={{ width: '100%' }}>
                    <div className={styles.skeletonLine} style={{ width: '200px', height: '32px', marginBottom: '24px' }} />
                    <div className={styles.statsGrid}>
                        {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageSubtitle}>Tổng quan hệ thống trường học hạnh phúc</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p className={styles.greeting}>Hôm nay, {new Date().toLocaleDateString('vi-VN')}</p>
                    <p style={{ margin: 0, fontWeight: 600, color: '#10b981' }}>Hệ thống hoạt động tốt •</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {statCards.map((card, index) => (
                    <div key={index} className={styles.statCard}>
                        <div className={styles.statInfo}>
                            <h3>{card.label}</h3>
                            <p className={styles.statValue}>{card.value}</p>
                        </div>
                        <div className={card.colorClass}>
                            <card.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.twoColGrid}>
                {/* Recent Activity */}
                <div className={styles.card}>
                    <div className={styles.tableHeader} style={{ padding: '0 0 20px 0', border: 'none' }}>
                        <h3 className={styles.tableTitle}>Hoạt động gần đây</h3>
                        <Link href="/admin/hoc-sinh" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            Xem tất cả <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div>
                        {stats?.recent_users.map((u) => (
                            <div key={u.id} className={styles.activityItem}>
                                <div className={styles.activityDot} />
                                <div className={styles.activityText}>
                                    <strong>{u.name}</strong> ({u.role}) vừa tham gia hệ thống
                                </div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Mới đây</span>
                            </div>
                        ))}
                        {(!stats?.recent_users || stats.recent_users.length === 0) && (
                            <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Chưa có hoạt động nào</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions & System Health */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Actions */}
                    <div className={styles.card}>
                        <h3 className={styles.tableTitle} style={{ marginBottom: '16px' }}>Thao tác nhanh</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link href="/admin/giao-vien" className={styles.quickAction}>
                                <div className={styles.quickActionIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                    <Users size={20} />
                                </div>
                                <span>Thêm giáo viên</span>
                                <ArrowUpRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </Link>
                            <Link href="/admin/hoc-sinh" className={styles.quickAction}>
                                <div className={styles.quickActionIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <GraduationCap size={20} />
                                </div>
                                <span>Thêm học sinh</span>
                                <ArrowUpRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </Link>
                            <Link href="/admin/lop-hoc" className={styles.quickAction}>
                                <div className={styles.quickActionIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                    <BookOpen size={20} />
                                </div>
                                <span>Tạo lớp học mới</span>
                                <ArrowUpRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                            </Link>
                        </div>
                    </div>

                    {/* System Health */}
                    <div className={styles.card}>
                        <h3 className={styles.tableTitle} style={{ marginBottom: '16px' }}>Trạng thái hệ thống</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#e2e8f0' }}>
                                    <Server size={18} color="#94a3b8" /> Backend API
                                </div>
                                <span className={styles.badgeGreen}>Online</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#e2e8f0' }}>
                                    <Database size={18} color="#94a3b8" /> Database
                                </div>
                                <span className={styles.badgeGreen}>Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

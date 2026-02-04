'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface AdminStats {
    total_teachers: number;
    total_students: number;
    total_classes: number;
}

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchStats();
    }, [token]);

    const statCards = [
        {
            label: 'Giáo viên',
            value: stats?.total_teachers || 0,
            icon: Users,
            color: '#3b82f6',
            bg: '#dbeafe',
        },
        {
            label: 'Học sinh',
            value: stats?.total_students || 0,
            icon: GraduationCap,
            color: '#22c55e',
            bg: '#dcfce7',
        },
        {
            label: 'Lớp học',
            value: stats?.total_classes || 0,
            icon: BookOpen,
            color: '#8b5cf6',
            bg: '#ede9fe',
        },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
                Admin Dashboard
            </h1>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {statCards.map((card) => (
                    <div key={card.label} style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{card.label}</p>
                                <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                    {loading ? '...' : card.value}
                                </p>
                            </div>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                backgroundColor: card.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <card.icon size={28} color={card.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
                    Thao tác nhanh
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <a href="/admin/giao-vien" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#f0f9ff',
                        color: '#0369a1',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}>
                        <Users size={24} />
                        Thêm Giáo viên mới
                    </a>
                    <a href="/admin/lop-hoc" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#faf5ff',
                        color: '#7c3aed',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}>
                        <BookOpen size={24} />
                        Tạo Lớp học mới
                    </a>
                    <a href="/admin/hoc-sinh" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}>
                        <GraduationCap size={24} />
                        Thêm Học sinh mới
                    </a>
                </div>
            </div>
        </div>
    );
}

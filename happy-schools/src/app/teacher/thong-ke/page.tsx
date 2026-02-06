'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity, Calendar } from 'lucide-react';
import { statisticsApi, Statistics } from '@/lib/api';

export default function ThongKePage() {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await statisticsApi.getStatistics();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch statistics:', err);
                // Fallback data
                setStats({
                    total: 1247,
                    excellent: 450,
                    good: 500,
                    attention: 200,
                    warning: 97,
                    growth_rate: '+12%',
                    total_students: 1247,
                    total_activities: 48,
                    total_surveys: 156,
                    weekly_trend: [
                        { week: 'T1', score: 65 },
                        { week: 'T2', score: 72 },
                        { week: 'T3', score: 78 },
                        { week: 'T4', score: 82 },
                        { week: 'T5', score: 75 },
                        { week: 'T6', score: 85 },
                        { week: 'T7', score: 87 },
                    ],
                    class_comparison: [
                        { name: 'Lớp 10A', score: 95, color: '#22c55e' },
                        { name: 'Lớp 10B', score: 88, color: '#3b82f6' },
                        { name: 'Lớp 11A', score: 82, color: '#8b5cf6' },
                        { name: 'Lớp 11B', score: 79, color: '#f59e0b' },
                        { name: 'Lớp 12A', score: 91, color: '#ec4899' },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#22c55e',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Thống kê</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Phân tích dữ liệu sôi nổi học sinh</p>
                </div>
                <select style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    color: '#374151',
                    fontWeight: 500,
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}>
                    <option>Tuần này</option>
                    <option>Tháng này</option>
                    <option>Quý này</option>
                    <option>Năm học 2025-2026</option>
                </select>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                    { icon: TrendingUp, label: 'Tăng trưởng', value: stats?.growth_rate || '+12%', color: '#22c55e', bg: '#dcfce7' },
                    { icon: Users, label: 'Học sinh', value: stats?.total_students?.toLocaleString() || '1,247', color: '#3b82f6', bg: '#dbeafe' },
                    { icon: Activity, label: 'Hoạt động', value: stats?.total_activities || 48, color: '#8b5cf6', bg: '#f3e8ff' },
                    { icon: Calendar, label: 'Khảo sát', value: stats?.total_surveys || 156, color: '#f59e0b', bg: '#fef3c7' },
                ].map((stat) => (
                    <div key={stat.label} style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: stat.bg }}>
                                <stat.icon style={{ height: '24px', width: '24px', color: stat.color }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{stat.label}</p>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {/* Happiness Trend Chart */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>
                        Xu hướng Sôi nổi theo Tuần
                    </h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
                        {(stats?.weekly_trend || []).map((item, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '40px',
                                    height: `${item.score * 1.8}px`,
                                    borderRadius: '8px 8px 0 0',
                                    background: 'linear-gradient(to top, #22c55e, #4ade80)',
                                    transition: 'all 0.3s ease',
                                }} />
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.week}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Class Comparison */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>
                        So sánh giữa các Lớp
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(stats?.class_comparison || []).map((cls) => (
                            <div key={cls.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 500, color: '#374151' }}>{cls.name}</span>
                                    <span style={{ color: '#6b7280' }}>{cls.score}%</span>
                                </div>
                                <div style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${cls.score}%`,
                                        backgroundColor: cls.color,
                                        borderRadius: '5px',
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Stats Table */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>
                    Chi tiết theo Chỉ số
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Chỉ số</th>
                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Tuần trước</th>
                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Tuần này</th>
                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Thay đổi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(stats?.detailed_stats || [
                            { name: 'Mức độ Sôi nổi', prev: 0, curr: 0 },
                            { name: 'Mức độ Gắn kết', prev: 0, curr: 0 },
                            { name: 'Sức khỏe Tinh thần', prev: 0, curr: 0 },
                            { name: 'Tham gia Hoạt động', prev: 0, curr: 0 },
                            { name: 'Hài lòng với Giáo viên', prev: 0, curr: 0 },
                        ]).map((row) => {
                            const change = row.curr - row.prev;
                            return (
                                <tr key={row.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{row.name}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>{row.prev}%</td>
                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#111827', textAlign: 'center' }}>{row.curr}%</td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            backgroundColor: change >= 0 ? '#dcfce7' : '#fee2e2',
                                            color: change >= 0 ? '#16a34a' : '#dc2626',
                                        }}>
                                            {change >= 0 ? '+' : ''}{change}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

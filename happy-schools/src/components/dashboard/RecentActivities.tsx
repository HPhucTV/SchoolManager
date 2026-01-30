'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { activitiesApi, Activity } from '@/lib/api';

const statusStyles = {
    completed: {
        background: '#dcfce7',
        color: '#16a34a',
        border: '1px solid #bbf7d0',
    },
    'in-progress': {
        background: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fde68a',
    },
    scheduled: {
        background: '#f3f4f6',
        color: '#6b7280',
        border: '1px solid #e5e7eb',
    },
};

const statusLabels = {
    completed: 'Đã hoàn thành',
    'in-progress': 'Đang diễn ra',
    scheduled: 'Sắp tới',
};

export default function RecentActivities() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await activitiesApi.getActivities({ limit: 4 });
                setActivities(data);
            } catch (err) {
                console.error('Failed to fetch activities:', err);
                // Fallback data
                setActivities([
                    { id: 1, title: 'Khảo sát Thi đua Tuần 4', description: 'Khảo sát mức độ sôi nổi của học sinh', status: 'completed', progress: 100, participants_count: 245, created_at: '' },
                    { id: 2, title: 'Hoạt động Team Building', description: 'Xây dựng tinh thần đồng đội', status: 'completed', progress: 100, participants_count: 180, created_at: '' },
                    { id: 3, title: 'Workshop Kỹ năng Sống', description: 'Phát triển kỹ năng giao tiếp', status: 'in-progress', progress: 65, participants_count: 120, created_at: '' },
                    { id: 4, title: 'Khảo sát Sức khỏe Tinh thần', description: 'Đánh giá tâm lý học sinh', status: 'scheduled', progress: 0, participants_count: 0, created_at: '' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    return (
        <div style={{
            borderRadius: '16px',
            backgroundColor: 'white',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                Hoạt động Gần đây
            </h2>

            {loading ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        margin: '0 auto',
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#22c55e',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activities.map((activity) => {
                        const status = activity.status as keyof typeof statusStyles;
                        return (
                            <div
                                key={activity.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderRadius: '10px',
                                    border: '1px solid #f3f4f6',
                                    padding: '10px 12px',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.backgroundColor = '#fafafa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#f3f4f6';
                                    e.currentTarget.style.backgroundColor = 'white';
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '13px', margin: 0 }}>
                                        {activity.title}
                                    </h3>
                                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{activity.description}</p>
                                </div>

                                <span style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    borderRadius: '16px',
                                    ...statusStyles[status],
                                }}>
                                    {statusLabels[status]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                <button
                    onClick={() => window.location.href = '/thong-ke'}
                    style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        padding: '12px 14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s ease',
                    }}>
                    <FileText style={{ height: '16px', width: '16px' }} />
                    Xem Báo cáo Chi tiết
                </button>
            </div>
        </div>
    );
}

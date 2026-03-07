/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';
import { wellnessApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TeacherWellnessPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewingId, setReviewingId] = useState<number | null>(null);



    const loadAlerts = async () => {
        try {
            const data = await wellnessApi.getSOSAlerts(filter);
            setAlerts(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadAlerts(); }, [filter]);

    const updateAlert = async (id: number, status: string) => {
        try {
            await wellnessApi.updateSOS(id, { status, reviewer_note: reviewNote || undefined });
            setReviewingId(null);
            setReviewNote('');
            loadAlerts();
        } catch (e) { console.error(e); }
    };

    const statusColors: Record<string, string> = {
        pending: '#ef4444',
        reviewing: '#f59e0b',
        resolved: '#22c55e'
    };

    const statusLabels: Record<string, string> = {
        pending: '⏳ Chờ xử lý',
        reviewing: '👀 Đang xem xét',
        resolved: '✅ Đã giải quyết'
    };

    return (
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>💚 Sức khỏe tinh thần học sinh</h1>
                <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Quản lý tín hiệu SOS và theo dõi tâm trạng lớp</p>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {[
                        { val: undefined, label: '📋 Tất cả' },
                        { val: 'pending', label: '⏳ Chờ xử lý' },
                        { val: 'reviewing', label: '👀 Đang xem' },
                        { val: 'resolved', label: '✅ Đã xong' }
                    ].map(f => (
                        <button key={f.label} onClick={() => setFilter(f.val)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: filter === f.val ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#1e293b', color: filter === f.val ? 'white' : '#94a3b8' }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Pending count banner */}
                {alerts.filter(a => a.status === 'pending').length > 0 && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>🆘</span>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{alerts.filter(a => a.status === 'pending').length} tín hiệu SOS chưa xử lý!</span>
                    </div>
                )}

                {/* Alerts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>Đang tải...</p>
                    ) : alerts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px', background: '#1e293b', borderRadius: '16px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                            <p style={{ color: '#94a3b8' }}>Không có tín hiệu SOS</p>
                        </div>
                    ) : (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        alerts.map((a: any) => (
                            <div key={a.id} style={{ background: '#1e293b', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', borderLeft: `4px solid ${statusColors[a.status]}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#e2e8f0' }}>{a.student_name}</span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{new Date(a.created_at).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', background: `${statusColors[a.status]}20`, color: statusColors[a.status] }}>
                                        {statusLabels[a.status]}
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 12px', lineHeight: 1.5, background: '#0f172a', padding: '12px', borderRadius: '8px' }}>{a.message}</p>

                                {a.reviewer_note && (
                                    <div style={{ fontSize: '13px', color: '#86efac', background: 'rgba(34, 197, 94, 0.1)', padding: '10px 12px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <strong>Ghi chú:</strong> {a.reviewer_note}
                                    </div>
                                )}

                                {a.status !== 'resolved' && (
                                    <div>
                                        {reviewingId === a.id ? (
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                                <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Ghi chú (tùy chọn)..." style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '13px' }} />
                                                <button onClick={() => updateAlert(a.id, 'reviewing')} style={{ padding: '8px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>Đang xem</button>
                                                <button onClick={() => updateAlert(a.id, 'resolved')} style={{ padding: '8px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>Giải quyết</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setReviewingId(a.id)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                                📝 Xử lý
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

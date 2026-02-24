'use client';
import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ParentDashboard() {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [childReport, setChildReport] = useState<any>(null);
    const [childMoods, setChildMoods] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'report' | 'messages'>('overview');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [c, m, t] = await Promise.all([
                parentApi.getChildren(),
                parentApi.getMessages(),
                parentApi.getTeachers()
            ]);
            setChildren(c);
            setMessages(m);
            setTeachers(t);
            if (c.length > 0) selectChild(c[0]);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const selectChild = async (child: any) => {
        setSelectedChild(child);
        try {
            const [report, moods] = await Promise.all([
                parentApi.getChildReport(child.id),
                parentApi.getChildMood(child.id)
            ]);
            setChildReport(report);
            setChildMoods(moods);
        } catch (e) { console.error(e); }
    };

    const sendMsg = async () => {
        if (!newMessage.trim() || !selectedTeacher) return;
        try {
            await parentApi.sendMessage({ receiver_id: selectedTeacher, message: newMessage });
            setNewMessage('');
            const m = await parentApi.getMessages();
            setMessages(m);
        } catch (e) { console.error(e); }
    };

    const statusColors: Record<string, string> = { excellent: '#22c55e', good: '#3b82f6', attention: '#f59e0b', warning: '#ef4444' };
    const statusLabels: Record<string, string> = { excellent: 'Xuất sắc', good: 'Tốt', attention: 'Cần chú ý', warning: 'Cảnh báo' };

    if (loading) return (
        <ProtectedRoute allowedRoles={['parent']}>
            <div style={{ padding: '24px', textAlign: 'center', paddingTop: '100px' }}>
                <p style={{ color: '#64748b' }}>Đang tải...</p>
            </div>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['parent']}>
            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>👨‍👩‍👧 Cổng Phụ huynh</h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Theo dõi kết quả học tập và tâm lý con em</p>

                {/* Children selector */}
                {children.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        {children.map(c => (
                            <button key={c.id} onClick={() => selectChild(c)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: selectedChild?.id === c.id ? '#8b5cf6' : '#f1f5f9', color: selectedChild?.id === c.id ? 'white' : '#64748b' }}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {[
                        { key: 'overview' as const, label: '📊 Tổng quan' },
                        { key: 'report' as const, label: '📝 Kết quả' },
                        { key: 'messages' as const, label: '💬 Nhắn tin' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: tab === t.key ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#f1f5f9', color: tab === t.key ? 'white' : '#64748b' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {tab === 'overview' && selectedChild && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Hạnh phúc', value: selectedChild.happiness_score, icon: '😊', color: '#f59e0b' },
                                { label: 'Gắn kết', value: selectedChild.engagement_score, icon: '📚', color: '#3b82f6' },
                                { label: 'Tinh thần', value: selectedChild.mental_health_score, icon: '💚', color: '#22c55e' },
                                { label: 'Level', value: selectedChild.level, icon: '⭐', color: '#8b5cf6' }
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>{s.icon}</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '16px 20px', borderRadius: '14px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Trạng thái:</span>
                            <span style={{ padding: '4px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', background: `${statusColors[selectedChild.status]}15`, color: statusColors[selectedChild.status] }}>
                                {statusLabels[selectedChild.status]}
                            </span>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>• Lớp: {selectedChild.class_name}</span>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>• Streak: {selectedChild.streak} ngày 🔥</span>
                        </div>

                        {/* Recent moods */}
                        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>😊 Cảm xúc gần đây</h3>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {childMoods.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có dữ liệu</p>
                                ) : childMoods.slice(0, 14).map((m: any, i: number) => (
                                    <div key={i} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '10px', minWidth: '50px' }}>
                                        <div style={{ fontSize: '24px' }}>{m.mood_emoji}</div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(m.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Report */}
                {tab === 'report' && childReport && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📝 Quiz gần đây</h3>
                            {childReport.recent_quizzes?.map((q: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                                    <span>{q.title}</span>
                                    <span style={{ fontWeight: 600, color: q.score >= 70 ? '#22c55e' : q.score >= 50 ? '#f59e0b' : '#ef4444' }}>{q.score}%</span>
                                </div>
                            ))}
                            {(!childReport.recent_quizzes || childReport.recent_quizzes.length === 0) && <p style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có</p>}
                        </div>
                        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📚 Bài tập gần đây</h3>
                            {childReport.recent_assignments?.map((a: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                                    <span>{a.title}</span>
                                    <span style={{ fontWeight: 600 }}>{a.score}/{a.total}</span>
                                </div>
                            ))}
                            {(!childReport.recent_assignments || childReport.recent_assignments.length === 0) && <p style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có</p>}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {tab === 'messages' && (
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            {teachers.map(t => (
                                <button key={t.id} onClick={() => setSelectedTeacher(t.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: selectedTeacher === t.id ? '#8b5cf6' : '#f1f5f9', color: selectedTeacher === t.id ? 'white' : '#64748b' }}>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {messages.map((m: any) => (
                                <div key={m.id} style={{ padding: '10px 14px', borderRadius: '10px', background: m.direction === 'sent' ? '#eff6ff' : '#f8fafc', alignSelf: m.direction === 'sent' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{m.other_name} • {new Date(m.created_at).toLocaleString('vi-VN')}</div>
                                    <p style={{ fontSize: '14px', color: '#1e293b', margin: 0 }}>{m.message}</p>
                                </div>
                            ))}
                            {messages.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '13px' }}>Chưa có tin nhắn</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Nhập tin nhắn cho giáo viên..." style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px' }} />
                            <button onClick={sendMsg} disabled={!newMessage.trim() || !selectedTeacher} style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Gửi</button>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}

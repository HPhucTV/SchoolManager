'use client';
import { useState, useEffect } from 'react';
import { wellnessApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const MOODS = [
    { level: 1, emoji: '😢', label: 'Rất buồn', color: '#ef4444' },
    { level: 2, emoji: '😟', label: 'Buồn', color: '#f97316' },
    { level: 3, emoji: '😐', label: 'Bình thường', color: '#eab308' },
    { level: 4, emoji: '🙂', label: 'Vui', color: '#22c55e' },
    { level: 5, emoji: '😄', label: 'Rất vui', color: '#10b981' },
];

interface MoodEntry {
    id: number;
    mood_level: number;
    mood_emoji: string;
    note?: string;
    created_at: string;
}

interface MoodAnalytics {
    avg_week: number;
    avg_month: number;
    trend: string;
    total_entries: number;
    distribution: Record<number, number>;
    recent_entries: Array<{ mood_level: number; mood_emoji: string; created_at: string }>;
}

export default function MoodJournalPage() {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const [history, setHistory] = useState<MoodEntry[]>([]);
    const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [sosMessage, setSOSMessage] = useState('');
    const [sosAnon, setSOSAnon] = useState(true);
    const [sosSent, setSOSSent] = useState(false);
    const [tab, setTab] = useState<'log' | 'history' | 'analytics'>('log');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [h, a] = await Promise.all([
                wellnessApi.getMoodHistory(30),
                wellnessApi.getMoodAnalytics()
            ]);
            setHistory(h);
            setAnalytics(a);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const submitMood = async () => {
        if (!selectedMood) return;
        setSubmitting(true);
        try {
            const mood = MOODS.find(m => m.level === selectedMood)!;
            await wellnessApi.createMood({
                mood_level: selectedMood,
                mood_emoji: mood.emoji,
                note: note || undefined
            });
            setSelectedMood(null);
            setNote('');
            loadData();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const sendSOS = async () => {
        if (!sosMessage.trim()) return;
        try {
            await wellnessApi.createSOS({ message: sosMessage, is_anonymous: sosAnon });
            setSOSSent(true);
            setSOSMessage('');
        } catch (e) { console.error(e); }
    };

    const trendIcon = analytics?.trend === 'improving' ? '📈' : analytics?.trend === 'declining' ? '📉' : '➡️';
    const trendLabel = analytics?.trend === 'improving' ? 'Đang cải thiện' : analytics?.trend === 'declining' ? 'Cần chú ý' : 'Ổn định';

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: 0 }}>💚 Nhật ký cảm xúc</h1>
                        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Ghi lại cảm xúc mỗi ngày để hiểu bản thân hơn</p>
                    </div>
                    <button onClick={() => setShowSOS(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                        🆘 Cần giúp đỡ
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {[
                        { key: 'log' as const, label: '✏️ Ghi nhận', },
                        { key: 'history' as const, label: '📋 Lịch sử' },
                        { key: 'analytics' as const, label: '📊 Phân tích' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: tab === t.key ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#f1f5f9', color: tab === t.key ? 'white' : '#64748b', transition: 'all 0.2s' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Log */}
                {tab === 'log' && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#1e293b' }}>Hôm nay bạn cảm thấy thế nào?</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
                            {MOODS.map(mood => (
                                <button key={mood.level} onClick={() => setSelectedMood(mood.level)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 20px', borderRadius: '16px', border: selectedMood === mood.level ? `3px solid ${mood.color}` : '3px solid transparent', background: selectedMood === mood.level ? `${mood.color}15` : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', transform: selectedMood === mood.level ? 'scale(1.1)' : 'scale(1)' }}>
                                    <span style={{ fontSize: '40px' }}>{mood.emoji}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: mood.color }}>{mood.label}</span>
                                </button>
                            ))}
                        </div>
                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú thêm (tùy chọn)..." rows={3} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', resize: 'none', marginBottom: '16px', boxSizing: 'border-box' }} />
                        <button onClick={submitMood} disabled={!selectedMood || submitting} style={{ width: '100%', padding: '14px', background: selectedMood ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#e2e8f0', color: selectedMood ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: selectedMood ? 'pointer' : 'default' }}>
                            {submitting ? 'Đang lưu...' : '💾 Lưu cảm xúc'}
                        </button>
                    </div>
                )}

                {/* Tab: History */}
                {tab === 'history' && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Lịch sử 30 ngày qua</h2>
                        {history.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>Chưa có dữ liệu. Hãy bắt đầu ghi nhận cảm xúc! ✨</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {history.map(entry => (
                                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '32px' }}>{entry.mood_emoji}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{MOODS.find(m => m.level === entry.mood_level)?.label}</div>
                                            {entry.note && <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>{entry.note}</p>}
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(entry.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Analytics */}
                {tab === 'analytics' && analytics && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                            <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Trung bình tuần</h3>
                            <div style={{ fontSize: '36px', fontWeight: 700, color: '#8b5cf6' }}>{analytics.avg_week}/5</div>
                            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{trendIcon} {trendLabel}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                            <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Trung bình tháng</h3>
                            <div style={{ fontSize: '36px', fontWeight: 700, color: '#6d28d9' }}>{analytics.avg_month}/5</div>
                            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>📝 {analytics.total_entries} ghi nhận</div>
                        </div>
                        <div style={{ gridColumn: 'span 2', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Phân bổ cảm xúc</h3>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px' }}>
                                {MOODS.map(mood => {
                                    const count = analytics.distribution[mood.level] || 0;
                                    const maxCount = Math.max(...Object.values(analytics.distribution), 1);
                                    const height = (count / maxCount) * 100;
                                    return (
                                        <div key={mood.level} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{count}</span>
                                            <div style={{ width: '100%', height: `${height}%`, minHeight: '4px', background: `linear-gradient(to top, ${mood.color}, ${mood.color}99)`, borderRadius: '8px 8px 0 0', transition: 'height 0.5s' }} />
                                            <span style={{ fontSize: '20px' }}>{mood.emoji}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* SOS Modal */}
                {showSOS && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '90%' }}>
                            {sosSent ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💚</div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Đã gửi tín hiệu</h2>
                                    <p style={{ color: '#64748b', marginBottom: '24px' }}>Giáo viên sẽ liên hệ hỗ trợ bạn sớm nhất</p>
                                    <button onClick={() => { setShowSOS(false); setSOSSent(false); }} style={{ padding: '12px 32px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>Đóng</button>
                                </div>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🆘 Gửi tín hiệu cần giúp đỡ</h2>
                                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Tin nhắn sẽ được gửi đến giáo viên chủ nhiệm. Bạn không đơn độc!</p>
                                    <textarea value={sosMessage} onChange={e => setSOSMessage(e.target.value)} placeholder="Chia sẻ những gì bạn đang trải qua..." rows={4} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '14px', resize: 'none', marginBottom: '12px', boxSizing: 'border-box' }} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b', marginBottom: '16px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={sosAnon} onChange={e => setSOSAnon(e.target.checked)} /> Gửi ẩn danh
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setShowSOS(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>Hủy</button>
                                        <button onClick={sendSOS} disabled={!sosMessage.trim()} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>Gửi SOS</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}

'use client';
import { useState, useEffect } from 'react';
import { aiTutorApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AITutorPage() {
    const [analysis, setAnalysis] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [learningPath, setLearningPath] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'recommendations' | 'path'>('overview');

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const [a, r, lp] = await Promise.all([
                aiTutorApi.getAnalysis(),
                aiTutorApi.getRecommendations(),
                aiTutorApi.getLearningPath()
            ]);
            setAnalysis(a);
            setRecommendations(r);
            setLearningPath(lp);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e';

    if (loading) return (
        <ProtectedRoute allowedRoles={['student']}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>🤖</div>
                    <p style={{ color: '#64748b', fontWeight: 500 }}>AI đang phân tích dữ liệu...</p>
                </div>
            </div>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>🤖 AI Gia sư cá nhân</h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Phân tích thông minh và gợi ý học tập dành riêng cho bạn</p>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    {[
                        { label: 'Điểm TB', value: `${analysis?.overall_avg || 0}%`, icon: '📊', color: '#8b5cf6' },
                        { label: 'Bài kiểm tra', value: analysis?.total_quizzes || 0, icon: '📝', color: '#3b82f6' },
                        { label: 'Bài tập', value: analysis?.total_assignments || 0, icon: '📚', color: '#10b981' },
                        { label: 'Level', value: analysis?.level || 1, icon: '⭐', color: '#f59e0b' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{s.icon}</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {[
                        { key: 'overview' as const, label: '🎯 Tổng quan' },
                        { key: 'recommendations' as const, label: '💡 Gợi ý' },
                        { key: 'path' as const, label: '🛤️ Lộ trình' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: tab === t.key ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f1f5f9', color: tab === t.key ? 'white' : '#64748b' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Overview */}
                {tab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>💪 Điểm mạnh</h3>
                            {analysis?.strengths?.length > 0 ? analysis.strengths.map((s: string, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '6px', fontSize: '14px', color: '#16a34a' }}>
                                    ✅ {s}
                                </div>
                            )) : <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chưa đủ dữ liệu</p>}
                        </div>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎯 Cần cải thiện</h3>
                            {analysis?.weaknesses?.length > 0 ? analysis.weaknesses.map((w: string, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', marginBottom: '6px', fontSize: '14px', color: '#dc2626' }}>
                                    📍 {w}
                                </div>
                            )) : <p style={{ color: '#94a3b8', fontSize: '14px' }}>Tuyệt vời! Không có điểm yếu</p>}
                        </div>
                        <div style={{ gridColumn: 'span 2', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📚 Theo môn học</h3>
                            {analysis?.subjects?.map((s: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600, flex: 1, fontSize: '14px' }}>{s.subject}</div>
                                    <div style={{ width: '200px', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div style={{ width: `${s.avg_score}%`, height: '100%', background: s.avg_score >= 80 ? '#22c55e' : s.avg_score >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '5px', transition: 'width 0.5s' }} />
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '14px', color: s.avg_score >= 80 ? '#22c55e' : s.avg_score >= 60 ? '#f59e0b' : '#ef4444', minWidth: '45px', textAlign: 'right' }}>{s.avg_score}%</span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{s.trend === 'improving' ? '📈' : s.trend === 'declining' ? '📉' : '➡️'}</span>
                                </div>
                            ))}
                            {(!analysis?.subjects || analysis.subjects.length === 0) && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</p>}
                        </div>
                    </div>
                )}

                {/* Tab: Recommendations */}
                {tab === 'recommendations' && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        {recommendations?.ai_advice && (
                            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🤖</span>
                                    <strong style={{ color: '#1d4ed8' }}>Lời khuyên từ AI</strong>
                                </div>
                                <p style={{ fontSize: '14px', color: '#1e40af', lineHeight: 1.6 }}>{recommendations.ai_advice}</p>
                            </div>
                        )}
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📋 Gợi ý ôn tập</h3>
                        {recommendations?.recommendations?.map((r: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '8px', borderLeft: `4px solid ${priorityColor(r.priority)}` }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>{r.subject} - {r.topic}</div>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{r.suggestion}</p>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', background: `${priorityColor(r.priority)}15`, color: priorityColor(r.priority) }}>
                                    {r.priority === 'high' ? 'Ưu tiên' : r.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                </span>
                            </div>
                        ))}
                        <div style={{ textAlign: 'center', padding: '12px', marginTop: '12px' }}>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>🔥 Streak: {recommendations?.study_streak || 0} ngày | Đã phân tích: {recommendations?.total_analyzed || 0} bài</span>
                        </div>
                    </div>
                )}

                {/* Tab: Learning Path */}
                {tab === 'path' && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>🛤️ Lộ trình học tập</h3>
                            <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 500 }}>Master: {learningPath?.overall_mastery || 0}%</span>
                        </div>
                        {learningPath?.path?.map((p: any, i: number) => (
                            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{p.stage_icon} {p.subject}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{p.stage}</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}>
                                    <div style={{ width: `${p.progress}%`, height: '100%', background: p.progress >= 80 ? '#22c55e' : p.progress >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '4px', transition: 'width 0.5s' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                                    <span>{p.mastery_level}% thành thạo</span>
                                    <span>📝 {p.total_tests} bài</span>
                                    <span>➡️ {p.next_step}</span>
                                </div>
                            </div>
                        ))}
                        {(!learningPath?.path || learningPath.path.length === 0) && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>Hoàn thành thêm bài kiểm tra để AI phân tích lộ trình!</p>}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}

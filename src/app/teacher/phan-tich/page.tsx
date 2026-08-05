/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TeacherAnalyticsPage() {

    const [warnings, setWarnings] = useState<any>(null);
    const [loading, setLoading] = useState(true);


    const loadData = async () => {
        try {
            const w = await analyticsApi.getEarlyWarnings();
            setWarnings(w);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const riskColor = (level: string) => ({
        critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e'
    }[level] || '#94a3b8');

    const riskBg = (level: string) => ({
        critical: 'rgba(239, 68, 68, 0.15)', high: 'rgba(249, 115, 22, 0.12)', medium: 'rgba(234, 179, 8, 0.12)', low: 'rgba(34, 197, 94, 0.12)'
    }[level] || 'rgba(148, 163, 184, 0.1)');

    const riskLabel = (level: string) => ({
        critical: '🔴 Nghiêm trọng', high: '🟠 Cao', medium: '🟡 Trung bình', low: '🟢 Thấp'
    }[level] || level);

    if (loading) return (
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <div style={{ padding: '24px', textAlign: 'center', paddingTop: '100px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <p style={{ color: '#94a3b8' }}>Đang phân tích dữ liệu...</p>
            </div>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>📊 Phân tích học tập & Cảnh báo sớm</h1>
                <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Hệ thống AI phát hiện học sinh cần hỗ trợ</p>

                {/* Summary Cards */}
                {warnings && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', borderRadius: '14px', padding: '20px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>{warnings.critical}</div>
                            <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 500 }}>🔴 Nghiêm trọng</div>
                        </div>
                        <div style={{ background: 'rgba(249, 115, 22, 0.12)', borderRadius: '14px', padding: '20px', textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#f97316' }}>{warnings.high}</div>
                            <div style={{ fontSize: '12px', color: '#fdba74', fontWeight: 500 }}>🟠 Nguy cơ cao</div>
                        </div>
                        <div style={{ background: 'rgba(234, 179, 8, 0.12)', borderRadius: '14px', padding: '20px', textAlign: 'center', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#eab308' }}>{warnings.medium}</div>
                            <div style={{ fontSize: '12px', color: '#fde047', fontWeight: 500 }}>🟡 Cần chú ý</div>
                        </div>
                        <div style={{ background: 'rgba(34, 197, 94, 0.12)', borderRadius: '14px', padding: '20px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{warnings.total_warnings}</div>
                            <div style={{ fontSize: '12px', color: '#86efac', fontWeight: 500 }}>📋 Tổng cảnh báo</div>
                        </div>
                    </div>
                )}

                {/* Warnings List */}
                <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#e2e8f0' }}>⚠️ Danh sách học sinh cần hỗ trợ</h2>
                    {warnings?.warnings?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                            <p>Không có cảnh báo! Tất cả học sinh đều ổn.</p>
                        </div>
                    ) : (

                        warnings?.warnings?.map((w: any, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', background: riskBg(w.risk_level), borderRadius: '12px', marginBottom: '10px', borderLeft: `4px solid ${riskColor(w.risk_level)}` }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#e2e8f0' }}>{w.student_name}</span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>• {w.class_name}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: `${riskColor(w.risk_level)}20`, color: riskColor(w.risk_level) }}>
                                            {riskLabel(w.risk_level)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                                        <span>😊 {w.happiness_score}</span>
                                        <span>📚 {w.engagement_score}</span>
                                        <span>💚 {w.mental_health_score}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {w.risk_factors?.map((f: string, j: number) => (
                                            <span key={j} style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', color: '#94a3b8' }}>{f}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

export default function TeacherQuizBattlePage() {
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
    const [timePerQ, setTimePerQ] = useState(30);
    const [createdBattle, setCreatedBattle] = useState<any>(null);
    const [battleData, setBattleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => { if (token) loadQuizzes(); }, [token]);

    const loadQuizzes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/quizzes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const createBattle = async () => {
        if (!selectedQuiz) {
            toast.error('Vui lòng chọn một bài quiz');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/api/battle/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quiz_id: selectedQuiz, time_per_question: timePerQ })
            });
            if (res.ok) {
                const result = await res.json();
                setCreatedBattle(result);
                setBattleData({ status: 'waiting', participants: [] });
                toast.success('Đã tạo trận đấu!');
                pollBattle(result.id);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Lỗi tạo trận đấu');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối');
        }
        setCreating(false);
    };

    const pollBattle = (id: number) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/api/battle/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBattleData(data);
                    if (data.status === 'finished') clearInterval(interval);
                }
            } catch { clearInterval(interval); }
        }, 3000);
    };

    const startBattle = async () => {
        if (!createdBattle) return;
        try {
            const res = await fetch(`${API_URL}/api/battle/${createdBattle.id}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Trận đấu bắt đầu!');
                // Refresh status
                const statusRes = await fetch(`${API_URL}/api/battle/${createdBattle.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statusRes.ok) setBattleData(await statusRes.json());
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Lỗi bắt đầu');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối');
        }
    };

    const resetBattle = () => {
        setCreatedBattle(null);
        setBattleData(null);
        setSelectedQuiz(null);
    };

    const inputStyle = {
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid #334155',
        fontSize: '14px',
        background: '#0f172a',
        color: '#e2e8f0',
        outline: 'none',
    };

    return (
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                padding: '24px',
                color: '#e2e8f0',
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                        }}>⚔️</div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'white' }}>
                                Quiz Battle
                            </h1>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
                                Tạo trận đấu kiến thức cho học sinh
                            </p>
                        </div>
                    </div>

                    {!createdBattle ? (
                        <div style={{
                            background: '#131c31',
                            borderRadius: '16px',
                            padding: '28px',
                            border: '1px solid rgba(51, 65, 85, 0.6)',
                        }}>
                            {/* Quiz Selection */}
                            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#e2e8f0' }}>
                                📝 Chọn bài quiz
                            </h3>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                    Đang tải danh sách quiz...
                                </div>
                            ) : quizzes.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '32px',
                                    background: 'rgba(245, 158, 11, 0.06)',
                                    borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.15)',
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                                    <p style={{ color: '#fbbf24', fontWeight: 600, margin: '0 0 4px 0' }}>Chưa có quiz nào</p>
                                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                                        Hãy tạo quiz trong phần Kiểm tra trước
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                    maxHeight: '300px', overflowY: 'auto', marginBottom: '20px',
                                    paddingRight: '4px',
                                }}>
                                    {quizzes.map(q => {
                                        const isSelected = selectedQuiz === q.id;
                                        return (
                                            <button key={q.id}
                                                onClick={() => setSelectedQuiz(q.id)}
                                                style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '14px 16px', borderRadius: '12px',
                                                    border: isSelected ? '2px solid #8b5cf6' : '1px solid #334155',
                                                    cursor: 'pointer',
                                                    background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                                                    textAlign: 'left',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? '#c4b5fd' : '#e2e8f0' }}>
                                                        {q.title}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                                        {q.subject} {q.topic ? `• ${q.topic}` : ''}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div style={{
                                                        width: '22px', height: '22px', borderRadius: '50%',
                                                        background: '#8b5cf6',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '12px', color: 'white', fontWeight: 700, flexShrink: 0,
                                                    }}>✓</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Time per question */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'block',
                                    color: '#cbd5e1',
                                }}>
                                    ⏱️ Thời gian mỗi câu (giây)
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {[15, 20, 30, 45, 60].map(t => (
                                        <button key={t}
                                            onClick={() => setTimePerQ(t)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '8px',
                                                border: timePerQ === t ? '2px solid #8b5cf6' : '1px solid #334155',
                                                background: timePerQ === t ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                                color: timePerQ === t ? '#c4b5fd' : '#94a3b8',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {t}s
                                        </button>
                                    ))}
                                    <span style={{ color: '#475569', fontSize: '12px', marginLeft: '4px' }}>
                                        hoặc
                                    </span>
                                    <input
                                        type="number"
                                        value={timePerQ}
                                        onChange={e => setTimePerQ(Number(e.target.value))}
                                        min={10} max={120}
                                        style={{ ...inputStyle, width: '80px', textAlign: 'center' as const }}
                                    />
                                </div>
                            </div>

                            {/* Create button */}
                            <button
                                onClick={createBattle}
                                disabled={!selectedQuiz || creating}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: selectedQuiz
                                        ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                                        : 'rgba(51, 65, 85, 0.3)',
                                    color: selectedQuiz ? 'white' : '#475569',
                                    border: selectedQuiz ? 'none' : '1px solid #334155',
                                    borderRadius: '12px',
                                    fontSize: '15px', fontWeight: 700,
                                    cursor: selectedQuiz ? 'pointer' : 'default',
                                    boxShadow: selectedQuiz ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
                                    transition: 'all 0.2s',
                                    opacity: creating ? 0.7 : 1,
                                }}
                            >
                                {creating ? '⏳ Đang tạo...' : '⚔️ Tạo trận đấu'}
                            </button>
                        </div>
                    ) : (
                        /* Battle Created View */
                        <div>
                            <div style={{
                                background: '#131c31',
                                borderRadius: '16px', padding: '32px',
                                border: '1px solid rgba(51, 65, 85, 0.6)',
                                textAlign: 'center', marginBottom: '16px',
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚔️</div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
                                    {createdBattle.quiz_title}
                                </h2>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>
                                    {createdBattle.total_questions} câu • {createdBattle.time_per_question}s/câu
                                </div>

                                {/* Battle Code */}
                                <div style={{
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    borderRadius: '14px', padding: '24px',
                                    marginBottom: '20px', border: '1px solid rgba(139, 92, 246, 0.2)',
                                }}>
                                    <div style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Mã trận đấu
                                    </div>
                                    <div style={{
                                        fontSize: '40px', fontWeight: 800, color: '#c4b5fd',
                                        letterSpacing: '8px', fontFamily: 'monospace',
                                    }}>
                                        {createdBattle.battle_code}
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', marginBottom: 0 }}>
                                        Chia sẻ mã này cho học sinh để tham gia
                                    </p>
                                </div>

                                {/* Participants */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>
                                        Người chơi: <strong style={{ color: '#e2e8f0' }}>{battleData?.participants?.length || 0}</strong>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                                        {battleData?.participants?.map((p: any) => (
                                            <span key={p.id || p.user_id} style={{
                                                padding: '6px 14px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                                borderRadius: '20px', fontSize: '13px', color: '#a5b4fc',
                                            }}>
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Status-based actions */}
                                {(!battleData || battleData.status === 'waiting') && (
                                    <button onClick={startBattle} style={{
                                        padding: '14px 40px',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        cursor: 'pointer', fontWeight: 700, fontSize: '16px',
                                        width: '100%',
                                        boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                                        transition: 'all 0.2s',
                                    }}>
                                        🚀 Bắt đầu trận đấu
                                    </button>
                                )}

                                {battleData?.status === 'active' && (
                                    <div style={{
                                        background: 'rgba(245, 158, 11, 0.08)',
                                        padding: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                    }}>
                                        <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '15px' }}>
                                            ⚡ Trận đấu đang diễn ra!
                                        </span>
                                    </div>
                                )}

                                {battleData?.status === 'finished' && (
                                    <div style={{
                                        background: 'rgba(34, 197, 94, 0.08)',
                                        padding: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(34, 197, 94, 0.2)',
                                    }}>
                                        <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '15px' }}>
                                            ✅ Trận đấu kết thúc!
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button onClick={resetBattle} style={{
                                padding: '12px 24px',
                                background: 'rgba(51, 65, 85, 0.3)',
                                border: '1px solid #334155',
                                borderRadius: '10px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '14px', color: '#94a3b8',
                                transition: 'all 0.2s', width: '100%',
                            }}>
                                ← Tạo trận mới
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

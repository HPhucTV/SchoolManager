'use client';
import { useState, useEffect, useRef } from 'react';
import { quizBattleApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function QuizBattlePage() {
    const [activeBattles, setActiveBattles] = useState<any[]>([]);
    const [joinCode, setJoinCode] = useState('');
    const [battleId, setBattleId] = useState<number | null>(null);
    const [battleData, setBattleData] = useState<any>(null);
    const [question, setQuestion] = useState<any>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [view, setView] = useState<'lobby' | 'waiting' | 'playing' | 'result'>('lobby');
    const [loading, setLoading] = useState(true);
    const timerRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        loadActive();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const loadActive = async () => {
        try { const data = await quizBattleApi.getActive(); setActiveBattles(data); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        try {
            const res = await quizBattleApi.join(joinCode);
            setBattleId(res.battle_id);
            setView('waiting');
            pollBattle(res.battle_id);
        } catch (e) { console.error(e); }
    };

    const joinByClick = async (id: number, code: string) => {
        try {
            await quizBattleApi.join(code);
            setBattleId(id);
            setView('waiting');
            pollBattle(id);
        } catch (e) { console.error(e); }
    };

    const pollBattle = (id: number) => {
        const poll = setInterval(async () => {
            try {
                const data = await quizBattleApi.getStatus(id);
                setBattleData(data);
                if (data.status === 'active') {
                    clearInterval(poll);
                    setView('playing');
                    loadQuestion(id, 0);
                } else if (data.status === 'finished') {
                    clearInterval(poll);
                    showResults(id);
                }
            } catch (e) { clearInterval(poll); }
        }, 2000);
    };

    const loadQuestion = async (id: number, idx: number) => {
        try {
            const q = await quizBattleApi.getQuestion(id, idx);
            if (q.finished) {
                showResults(id);
                return;
            }
            setQuestion(q);
            setQuestionIndex(idx);
            setSelectedAnswer(null);
            setResult(null);
            setTimeLeft(q.time_limit);
            startTimeRef.current = Date.now();

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        submitAnswer(id, idx, '', (Date.now() - startTimeRef.current) / 1000);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (e) { console.error(e); }
    };

    const submitAnswer = async (id: number, idx: number, answer: string, timeTaken: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSelectedAnswer(answer);
        try {
            const res = await quizBattleApi.submitAnswer(id, { question_index: idx, answer, time_taken: timeTaken });
            setResult(res);
            if (res.battle_finished) {
                setTimeout(() => showResults(id), 2000);
            } else {
                setTimeout(() => loadQuestion(id, idx + 1), 2500);
            }
        } catch (e) { console.error(e); }
    };

    const handleChoose = (answer: string) => {
        if (selectedAnswer) return;
        const timeTaken = (Date.now() - startTimeRef.current) / 1000;
        submitAnswer(battleId!, questionIndex, answer, timeTaken);
    };

    const showResults = async (id: number) => {
        try {
            const lb = await quizBattleApi.getLeaderboard(id);
            setLeaderboard(lb);
            setView('result');
        } catch (e) { console.error(e); }
    };

    const optionColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                {/* Lobby */}
                {view === 'lobby' && (
                    <>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>⚔️ Quiz Battle</h1>
                        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Thi đấu kiến thức thời gian thực!</p>

                        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '1px solid #334155', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#e2e8f0' }}>🎫 Nhập mã trận đấu</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="VD: ABC123" maxLength={6} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '18px', fontWeight: 700, textAlign: 'center', letterSpacing: '4px', textTransform: 'uppercase' }} />
                                <button onClick={handleJoin} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '15px' }}>
                                    Tham gia
                                </button>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#e2e8f0' }}>🔥 Trận đấu đang diễn ra</h3>
                        {activeBattles.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px', background: '#1e293b', borderRadius: '16px', color: '#94a3b8', border: '1px solid #334155' }}>
                                Chưa có trận đấu nào
                            </div>
                        ) : (
                            activeBattles.map(b => (
                                <div key={b.id} style={{ background: '#1e293b', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#e2e8f0' }}>{b.quiz_title}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            {b.quiz_subject} • {b.participants_count} người • {b.time_per_question}s/câu • bởi {b.created_by}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', background: b.status === 'waiting' ? 'rgba(59,130,246,0.1)' : 'rgba(217,119,6,0.1)', color: b.status === 'waiting' ? '#60a5fa' : '#fbbf24' }}>
                                        {b.status === 'waiting' ? '⏳ Chờ' : '⚡ Đang chơi'}
                                    </span>
                                    {!b.joined && (
                                        <button onClick={() => joinByClick(b.id, b.battle_code)} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                            Tham gia
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Waiting Room */}
                {view === 'waiting' && (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>⏳</div>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#e2e8f0' }}>Đang chờ bắt đầu...</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Mã trận: <strong style={{ color: '#8b5cf6', fontSize: '20px' }}>{battleData?.battle_code}</strong></p>
                        <p style={{ color: '#94a3b8' }}>Người chơi: {battleData?.participants?.length || 0}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                            {battleData?.participants?.map((p: any) => (
                                <span key={p.id} style={{ padding: '6px 14px', background: p.is_me ? 'rgba(59,130,246,0.1)' : '#1e293b', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: p.is_me ? '2px solid #3b82f6' : '1px solid #334155', color: '#e2e8f0' }}>
                                    {p.name} {p.is_me ? '(Bạn)' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Playing */}
                {view === 'playing' && question && (
                    <div>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>Câu {questionIndex + 1}/{question.total_questions}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: timeLeft <= 5 ? '#ef4444' : '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', animation: timeLeft <= 5 ? 'pulse 0.5s infinite' : 'none' }}>
                                    {timeLeft}
                                </div>
                            </div>
                        </div>

                        {/* Question */}
                        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '28px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid #334155', textAlign: 'center' }}>
                            <p style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.5, color: '#e2e8f0' }}>{question.question_text}</p>
                        </div>

                        {/* Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[question.option_a, question.option_b, question.option_c, question.option_d].map((opt: string, i: number) => {
                                if (!opt) return null;
                                const letter = optionLabels[i];
                                const isSelected = selectedAnswer === letter;
                                const isCorrect = result && result.correct_answer === letter;
                                const isWrong = result && isSelected && !result.correct;

                                let bg = optionColors[i];
                                if (result) {
                                    if (isCorrect) bg = '#22c55e';
                                    else if (isWrong) bg = '#ef4444';
                                    else bg = '#334155';
                                }

                                return (
                                    <button key={i} onClick={() => handleChoose(letter)} disabled={!!selectedAnswer} style={{ padding: '20px', borderRadius: '14px', border: 'none', cursor: selectedAnswer ? 'default' : 'pointer', background: bg, color: result && !isCorrect && !isWrong ? '#94a3b8' : 'white', fontWeight: 600, fontSize: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', transform: isSelected ? 'scale(0.98)' : 'scale(1)' }}>
                                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{letter}</span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result feedback */}
                        {result && (
                            <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', borderRadius: '12px', background: result.correct ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                <span style={{ fontWeight: 700, color: result.correct ? '#22c55e' : '#ef4444' }}>
                                    {result.correct ? `✅ Chính xác! +${result.points_earned} điểm` : `❌ Sai rồi! Đáp án đúng: ${result.correct_answer}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {view === 'result' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏆</div>
                        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px', color: '#e2e8f0' }}>Kết quả trận đấu</h2>
                        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid #334155' }}>
                            {leaderboard.map((p: any) => (
                                <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: p.is_me ? 'rgba(245,158,11,0.1)' : '#0f172a', borderRadius: '10px', marginBottom: '8px', border: p.is_me ? '2px solid #f59e0b' : '1px solid #334155' }}>
                                    <span style={{ fontSize: '24px', minWidth: '32px' }}>
                                        {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                                    </span>
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.name} {p.is_me ? '(Bạn)' : ''}</span>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.correct}/{p.total} đúng</div>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#f59e0b' }}>{p.score}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => { setView('lobby'); setBattleId(null); loadActive(); }} style={{ marginTop: '20px', padding: '12px 32px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                            Quay lại sảnh
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
        </ProtectedRoute>
    );
}

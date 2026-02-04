'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Brain, Clock, CheckCircle, AlertCircle, ArrowRight, Save, Lock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Question {
    id: number;
    question_text: string;
    difficulty: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    order_num: number;
}

interface Quiz {
    id: number;
    title: string;
    subject: string;
    topic: string;
    total_questions: number;
    deadline: string | null;
    status: string;
    questions: Question[];
}

export default function QuizTakingPage({ params }: { params: { id: string } }) {
    const { token } = useAuth();
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [result, setResult] = useState<any>(null);

    // Fetch Quiz
    useEffect(() => {
        if (token && params.id) {
            // First check if already attempted
            fetch(`${API_URL}/api/quizzes/${params.id}/my-result`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.attempted) {
                        setResult(data);
                        setLoading(false);
                    } else {
                        // Fetch quiz details
                        fetchQuiz();
                    }
                })
                .catch(err => {
                    console.error('Failed to check result:', err);
                    setLoading(false);
                });
        }
    }, [token, params.id]);

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setQuiz(data);

                // Calculate time left if deadline exists
                if (data.deadline) {
                    const deadline = new Date(data.deadline).getTime();
                    const now = new Date().getTime();
                    const diff = Math.floor((deadline - now) / 1000);
                    if (diff > 0) {
                        setTimeLeft(diff);
                    } else {
                        alert('Đã hết thời gian làm bài!');
                        router.push('/student');
                    }
                }
            } else {
                const error = await response.json();
                alert(error.detail || 'Không thể tải bài kiểm tra');
                router.push('/student');
            }
        } catch (err) {
            console.error('Failed to fetch quiz:', err);
        } finally {
            setLoading(false);
        }
    };

    // Timer Logic
    useEffect(() => {
        if (timeLeft === null || result) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    handleSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, result]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswer = (questionId: number, option: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleSubmit = async () => {
        if (submitting || result) return;

        if (!confirm('Bạn có chắc muốn nộp bài? Hành động này không thể hoàn tác.')) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/quizzes/${params.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ answers }),
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
                // Scroll to top
                window.scrollTo(0, 0);
            } else {
                const error = await response.json();
                alert(`Lỗi: ${error.detail}`);
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Lỗi kết nối khi nộp bài');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{
                        width: '48px', height: '48px',
                        border: '4px solid #e5e7eb', borderTop: '4px solid #8b5cf6',
                        borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6b7280' }}>Đang tải đề...</p>
                </div>
                <style jsx global>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (result) {
        return (
            <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '40px 20px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>

                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dcfce7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={40} color="#16a34a" />
                    </div>

                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                        Hoàn thành bài kiểm tra!
                    </h1>
                    <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                        Dưới đây là kết quả của bạn
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Điểm số</p>
                            <p style={{ fontSize: '32px', fontWeight: 800, color: '#111827' }}>
                                {result.score} <span style={{ fontSize: '16px', color: '#9ca3af', fontWeight: 500 }}>/ {result.total_questions}</span>
                            </p>
                        </div>
                        <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Tỷ lệ đúng</p>
                            <p style={{ fontSize: '32px', fontWeight: 800, color: result.percentage >= 50 ? '#16a34a' : '#ef4444' }}>
                                {result.percentage}%
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/student')}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '14px',
                            backgroundColor: '#111827', color: 'white', fontWeight: 600, fontSize: '16px',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (!quiz) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            {/* Header / Sticky Timer */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb',
                padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>{quiz.title}</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{quiz.subject} - {quiz.total_questions} câu hỏi</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {timeLeft !== null && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '20px',
                            backgroundColor: timeLeft < 300 ? '#fee2e2' : '#eff6ff',
                            color: timeLeft < 300 ? '#dc2626' : '#2563eb', fontWeight: 700
                        }}>
                            <Clock size={18} />
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            padding: '10px 24px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                            color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
                            opacity: submitting ? 0.7 : 1
                        }}
                    >
                        {submitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 20px', paddingBottom: '80px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {quiz.questions.map((q, index) => (
                        <div key={q.id} style={{
                            backgroundColor: 'white', borderRadius: '16px', padding: '24px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{
                                    minWidth: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f3f4f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 700, color: '#4b5563'
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#111827', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                                        {q.question_text}
                                    </p>

                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {['A', 'B', 'C', 'D'].map((opt) => {
                                            const optionText = q[`option_${opt.toLowerCase()}` as keyof Question] as string;
                                            const isSelected = answers[q.id] === opt;

                                            return (
                                                <div
                                                    key={opt}
                                                    onClick={() => handleAnswer(q.id, opt)}
                                                    style={{
                                                        padding: '12px 16px', borderRadius: '12px', border: '1px solid',
                                                        borderColor: isSelected ? '#8b5cf6' : '#e5e7eb',
                                                        backgroundColor: isSelected ? '#f5f3ff' : 'white',
                                                        cursor: 'pointer', transition: 'all 0.2s',
                                                        display: 'flex', alignItems: 'center', gap: '12px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '50%', border: '2px solid',
                                                        borderColor: isSelected ? '#8b5cf6' : '#d1d5db',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: isSelected ? '#8b5cf6' : '#9ca3af', fontWeight: 600, fontSize: '12px'
                                                    }}>
                                                        {opt}
                                                    </div>
                                                    <span style={{ fontSize: '14px', color: '#374151' }}>{optionText}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Clock, CheckCircle, Send, FileText } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Question {
    id: number;
    question_type: 'multiple_choice' | 'essay';
    question_text: string;
    points: number;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    order_num: number;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    subject: string;
    deadline: string;
    status: string;
    total_points: number;
    questions: Question[];
}

interface Submission {
    id: number;
    status: string;
    total_score: number;
    submitted_at: string;
    graded_at: string;
    answers: {
        id: number;
        question_id: number;
        answer_text: string;
        is_correct: boolean | null;
        score: number;
        feedback: string;
    }[];
}

export default function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { token } = useAuth();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (token) {
            fetchAssignment();
            fetchMySubmission();
        }
    }, [token]);

    const fetchAssignment = async () => {
        try {
            const response = await fetch(`${API_URL}/api/assignments/${resolvedParams.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAssignment(data);
            }
        } catch (err) {
            console.error('Failed to fetch assignment:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMySubmission = async () => {
        try {
            const response = await fetch(`${API_URL}/api/assignments/${resolvedParams.id}/my-submission`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSubmission(data);
            }
        } catch (err) {
            console.error('Failed to fetch submission:', err);
        }
    };

    const handleSubmit = async () => {
        if (!assignment) return;

        // Check all questions answered
        const unanswered = assignment.questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            alert(`Vui lòng trả lời ${unanswered.length} câu còn lại`);
            return;
        }

        if (!confirm('Bạn có chắc muốn nộp bài? Không thể sửa sau khi nộp.')) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/api/assignments/${resolvedParams.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    answers: Object.entries(answers).map(([qId, text]) => ({
                        question_id: parseInt(qId),
                        answer_text: text,
                    })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSubmission(data);
                alert('✅ Nộp bài thành công!');
            } else {
                const error = await response.json();
                alert(`❌ Lỗi: ${error.detail}`);
            }
        } catch (err) {
            alert('❌ Lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    const isDeadlinePassed = assignment?.deadline && new Date(assignment.deadline) < new Date();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
            }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTop: '4px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px',
                    }}></div>
                    Đang tải...
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
            }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <h2>Không tìm thấy bài tập</h2>
                    <Link href="/student" style={{ color: 'white' }}>← Quay lại</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)',
            padding: '24px',
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <Link href="/student" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        color: 'white', textDecoration: 'none', marginBottom: '16px',
                    }}>
                        <ArrowLeft size={20} />
                        Quay lại
                    </Link>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', padding: '20px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                    {assignment.title}
                                </h1>
                                {assignment.description && (
                                    <p style={{ color: '#6b7280', marginTop: '8px' }}>{assignment.description}</p>
                                )}
                                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                        {assignment.questions.length} câu • {assignment.total_points} điểm
                                    </span>
                                    {assignment.deadline && (
                                        <span style={{
                                            fontSize: '14px',
                                            color: isDeadlinePassed ? '#dc2626' : '#6b7280',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                        }}>
                                            <Clock size={14} />
                                            Hạn: {new Date(assignment.deadline).toLocaleString('vi-VN')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {submission && (
                                <div style={{
                                    padding: '12px 16px', borderRadius: '12px',
                                    backgroundColor: submission.status === 'graded' ? '#d1fae5' : '#dbeafe',
                                    textAlign: 'center',
                                }}>
                                    <p style={{
                                        fontSize: '12px', fontWeight: 600, margin: 0,
                                        color: submission.status === 'graded' ? '#059669' : '#2563eb',
                                    }}>
                                        {submission.status === 'graded' ? 'Đã chấm' : 'Đã nộp'}
                                    </p>
                                    <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: '#111827' }}>
                                        {submission.total_score}/{assignment.total_points}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {assignment.questions
                        .sort((a, b) => a.order_num - b.order_num)
                        .map((q, index) => {
                            const submittedAnswer = submission?.answers.find(a => a.question_id === q.id);
                            const isEssay = q.question_type === 'essay';

                            return (
                                <div key={q.id} style={{
                                    backgroundColor: 'white', borderRadius: '16px', padding: '20px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', marginBottom: '12px',
                                    }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                            backgroundColor: isEssay ? '#fef3c7' : '#dbeafe',
                                            color: isEssay ? '#d97706' : '#2563eb',
                                        }}>
                                            Câu {index + 1} ({q.points} điểm)
                                        </span>
                                        {submittedAnswer && (
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                                backgroundColor: submittedAnswer.is_correct === true ? '#d1fae5' :
                                                    submittedAnswer.is_correct === false ? '#fee2e2' : '#f3f4f6',
                                                color: submittedAnswer.is_correct === true ? '#059669' :
                                                    submittedAnswer.is_correct === false ? '#dc2626' : '#6b7280',
                                            }}>
                                                {submittedAnswer.is_correct === true ? '✓ Đúng' :
                                                    submittedAnswer.is_correct === false ? '✗ Sai' :
                                                        `${submittedAnswer.score}/${q.points}`}
                                            </span>
                                        )}
                                    </div>

                                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#111827', marginBottom: '16px' }}>
                                        {q.question_text}
                                    </p>

                                    {submission ? (
                                        // Show submitted answer
                                        <div>
                                            <div style={{
                                                padding: '12px', borderRadius: '8px',
                                                backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                                            }}>
                                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Câu trả lời của bạn:</p>
                                                <p style={{ color: '#111827', whiteSpace: 'pre-wrap' }}>
                                                    {submittedAnswer?.answer_text || '(Chưa trả lời)'}
                                                </p>
                                            </div>
                                            {submittedAnswer?.feedback && (
                                                <div style={{
                                                    marginTop: '12px', padding: '12px', borderRadius: '8px',
                                                    backgroundColor: '#dbeafe', border: '1px solid #93c5fd',
                                                }}>
                                                    <p style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600, marginBottom: '4px' }}>
                                                        Nhận xét của giáo viên:
                                                    </p>
                                                    <p style={{ color: '#1e40af' }}>{submittedAnswer.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Input form
                                        isEssay ? (
                                            <textarea
                                                value={answers[q.id] || ''}
                                                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                placeholder="Nhập câu trả lời của bạn..."
                                                rows={4}
                                                style={{
                                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                                    border: '2px solid #e5e7eb', fontSize: '14px', resize: 'vertical',
                                                }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {['A', 'B', 'C', 'D'].map(opt => {
                                                    const optionText = (q as any)[`option_${opt.toLowerCase()}`];
                                                    if (!optionText) return null;
                                                    return (
                                                        <label
                                                            key={opt}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                                padding: '12px 14px', borderRadius: '10px',
                                                                border: `2px solid ${answers[q.id] === opt ? '#8b5cf6' : '#e5e7eb'}`,
                                                                backgroundColor: answers[q.id] === opt ? '#f5f3ff' : 'white',
                                                                cursor: 'pointer', transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`q_${q.id}`}
                                                                checked={answers[q.id] === opt}
                                                                onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                                                                style={{ display: 'none' }}
                                                            />
                                                            <span style={{
                                                                width: '28px', height: '28px', borderRadius: '50%',
                                                                backgroundColor: answers[q.id] === opt ? '#8b5cf6' : '#f3f4f6',
                                                                color: answers[q.id] === opt ? 'white' : '#6b7280',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 600, fontSize: '14px',
                                                            }}>
                                                                {opt}
                                                            </span>
                                                            <span style={{ color: '#374151' }}>{optionText}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                </div>

                {/* Submit Button */}
                {!submission && !isDeadlinePassed && (
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '16px 32px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                color: 'white', fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            <Send size={20} />
                            {submitting ? 'Đang nộp...' : 'Nộp bài'}
                        </button>
                    </div>
                )}

                {isDeadlinePassed && !submission && (
                    <div style={{
                        marginTop: '24px', textAlign: 'center',
                        padding: '16px', backgroundColor: '#fee2e2', borderRadius: '12px',
                        color: '#dc2626', fontWeight: 600,
                    }}>
                        ⏰ Đã hết hạn nộp bài
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

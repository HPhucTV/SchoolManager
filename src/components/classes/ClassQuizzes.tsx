/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { quizzesApi, Quiz } from '@/lib/api';
import {
    Plus, Brain, BookOpen, Clock, Calendar, CheckCircle,
    Trash2, Play, Eye, X, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassQuizzesProps {
    classId: number;
}

export default function ClassQuizzes({ classId }: ClassQuizzesProps) {
    const { token, isTeacher } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [quizData, setQuizData] = useState({
        title: '',
        subject: '',
        topic: '',
        class_id: classId,
        easy_count: 5,
        medium_count: 3,
        hard_count: 2,
        deadline: '',
        allow_retake: false,
        show_answers: true,
    });

    // New state for modes
    const [creationMode, setCreationMode] = useState<'ai' | 'upload' | 'manual'>('ai');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

    // Manual questions
    const [manualQuestions, setManualQuestions] = useState<any[]>([{
        question_text: '',
        difficulty: 'medium',
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_answer: 'A'
    }]);

    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Student quiz-taking state
    const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState<{ correct: number; total: number; showAnswers: boolean } | null>(null);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const allQuizzes = await quizzesApi.getQuizzes();
            const classQuizzes = allQuizzes.filter((q: Quiz) => q.class_id === classId);
            setQuizzes(classQuizzes);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách bài kiểm tra');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && classId) {
            fetchData();
        }
    }, [token, classId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Call the new docx upload endpoint
            // We need to use fetch directly here since we haven't added it to quizzesApi yet
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/quizzes/upload-docx`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setParsedQuestions(data);
                toast.success(`Đã trích xuất ${data.length} câu hỏi`);
            } else {
                toast.error('Lỗi khi đọc file. Vui lòng kiểm tra định dạng.');
                setUploadFile(null);
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kết nối khi tải file.');
            setUploadFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddManualQuestion = () => {
        setManualQuestions([...manualQuestions, {
            question_text: '',
            difficulty: 'medium',
            option_a: '', option_b: '', option_c: '', option_d: '',
            correct_answer: 'A'
        }]);
    };

    const handleUpdateManualQuestion = (index: number, field: string, value: string) => {
        const newQs = [...manualQuestions];
        newQs[index][field] = value;
        setManualQuestions(newQs);
    };

    const handleRemoveManualQuestion = (index: number) => {
        if (manualQuestions.length <= 1) return;
        setManualQuestions(manualQuestions.filter((_, i) => i !== index));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation based on mode
        if (creationMode === 'ai') {
            const total = parseInt(String(quizData.easy_count)) +
                parseInt(String(quizData.medium_count)) +
                parseInt(String(quizData.hard_count));
            if (total <= 0) {
                toast.error('Số lượng câu hỏi phải lớn hơn 0');
                return;
            }
        } else if (creationMode === 'upload') {
            if (parsedQuestions.length === 0) {
                toast.error('Vui lòng tải lên file chứa ít nhất 1 câu hỏi');
                return;
            }
        } else if (creationMode === 'manual') {
            if (manualQuestions.length === 0) {
                toast.error('Vui lòng thêm ít nhất 1 câu hỏi');
                return;
            }
            // Check if any question is empty
            const hasEmpty = manualQuestions.some(q => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d);
            if (hasEmpty) {
                toast.error('Vui lòng điền đầy đủ nội dung các câu hỏi');
                return;
            }
        }

        setCreating(true);
        try {
            const payload: any = {
                title: quizData.title,
                subject: quizData.subject || (creationMode !== 'ai' ? 'Tự chọn' : ''),
                topic: quizData.topic || (creationMode !== 'ai' ? 'Chủ đề tùy chọn' : ''),
                class_id: classId,
                deadline: quizData.deadline || null,
                allow_retake: quizData.allow_retake,
                show_answers: quizData.show_answers,
            };

            if (creationMode === 'ai') {
                payload.easy_count = parseInt(String(quizData.easy_count));
                payload.medium_count = parseInt(String(quizData.medium_count));
                payload.hard_count = parseInt(String(quizData.hard_count));
            } else if (creationMode === 'upload') {
                payload.questions = parsedQuestions;
                payload.easy_count = 0; payload.medium_count = 0; payload.hard_count = 0;
            } else if (creationMode === 'manual') {
                payload.questions = manualQuestions;
                payload.easy_count = 0; payload.medium_count = 0; payload.hard_count = 0;
            }

            // Fallback for empty subject/topic in non-ai modes
            if (!payload.subject) payload.subject = 'Văn bản / Tự nhập';
            if (!payload.topic) payload.topic = 'Tổng hợp';

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/quizzes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Tạo bài kiểm tra thành công!');
                setShowCreateModal(false);
                // Reset states
                setQuizData({
                    title: '', subject: '', topic: '', class_id: classId,
                    easy_count: 5, medium_count: 3, hard_count: 2,
                    deadline: '', allow_retake: false, show_answers: true,
                });
                setParsedQuestions([]);
                setUploadFile(null);
                setManualQuestions([{
                    question_text: '', difficulty: 'medium',
                    option_a: '', option_b: '', option_c: '', option_d: '',
                    correct_answer: 'A'
                }]);
                fetchData();
            } else {
                toast.error('Lỗi khi tạo bài kiểm tra');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kết nối');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) return;
        try {
            await quizzesApi.deleteQuiz(id);
            toast.success('Đã xóa bài kiểm tra');
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Không thể xóa bài kiểm tra');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'completed': return '#3b82f6';
            case 'closed': return '#ef4444';
            default: return '#fbbf24';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Đang mở';
            case 'completed': return 'Hoàn thành';
            case 'closed': return 'Đã đóng';
            default: return 'Nháp';
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div />
                {isTeacher && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                            color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.2)',
                        }}
                    >
                        <Plus size={18} />
                        Tạo bài kiểm tra AI
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {quizzes.map((quiz) => (
                    <div key={quiz.id} style={{
                        backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px',
                        border: '1px solid #334155', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, right: 0, padding: '6px 12px',
                            backgroundColor: getStatusColor(quiz.status) + '20',
                            color: getStatusColor(quiz.status),
                            borderBottomLeftRadius: '12px', fontSize: '12px', fontWeight: 600
                        }}>
                            {getStatusLabel(quiz.status)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Brain size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: '0 0 4px 0' }}>{quiz.title}</h3>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{quiz.subject} • {quiz.topic}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={16} color="#64748b" />
                                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{quiz.total_questions} câu hỏi</span>
                            </div>
                            {quiz.deadline && (
                                <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} color="#64748b" />
                                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                                        {new Date(quiz.deadline).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(!isTeacher && quiz.status === 'closed') ? null : (
                                <button
                                    onClick={() => {
                                        setSelectedQuiz(quiz);
                                        setShowDetailModal(true);
                                        // Reset student quiz-taking state
                                        setStudentAnswers({});
                                        setCurrentQuestion(0);
                                        setQuizSubmitted(false);
                                        setQuizScore(null);
                                    }}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '10px',
                                        backgroundColor: '#3b82f6', color: 'white',
                                        border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    <Eye size={16} /> {isTeacher ? 'Chi tiết' : 'Làm bài'}
                                </button>
                            )}
                            {isTeacher && (
                                <button
                                    onClick={() => handleDelete(quiz.id)}
                                    style={{
                                        padding: '10px', borderRadius: '10px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                        border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {quizzes.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
                        <Brain size={48} color="#475569" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#94a3b8', margin: 0 }}>Chưa có bài kiểm tra nào</h3>
                        {isTeacher && (
                            <p style={{ color: '#64748b', fontSize: '14px' }}>Tạo bài kiểm tra mới để AI giúp bạn sinh câu hỏi</p>
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '24px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #1e293b, #0f172a)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'white' }}>Tạo bài kiểm tra</h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#94a3b8" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
                            <button
                                onClick={() => setCreationMode('ai')}
                                style={{
                                    flex: 1, padding: '16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'ai' ? '#6366f1' : '#64748b',
                                    borderBottom: creationMode === 'ai' ? '2px solid #6366f1' : 'none',
                                }}
                            >   ✨ Tạo tự động
                            </button>
                            <button
                                onClick={() => setCreationMode('manual')}
                                style={{
                                    flex: 1, padding: '16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'manual' ? '#6366f1' : '#64748b',
                                    borderBottom: creationMode === 'manual' ? '2px solid #6366f1' : 'none',
                                }}
                            >   ✍️ Nhập thủ công
                            </button>
                            <button
                                onClick={() => setCreationMode('upload')}
                                style={{
                                    flex: 1, padding: '16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'upload' ? '#6366f1' : '#64748b',
                                    borderBottom: creationMode === 'upload' ? '2px solid #6366f1' : 'none',
                                }}
                            >   📤 Tải lên Word
                            </button>
                        </div>

                        <form onSubmit={handleCreate} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '6px' }}>Tên bài kiểm tra <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={quizData.title}
                                        onChange={e => setQuizData({ ...quizData, title: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="Ví dụ: Kiểm tra 15 phút"
                                        style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {creationMode === 'ai' && (
                                        <>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '6px' }}>Môn học <span style={{ color: '#ef4444' }}>*</span></label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={quizData.subject}
                                                    onChange={e => setQuizData({ ...quizData, subject: e.target.value })}
                                                    placeholder="Toán, Lý..."
                                                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '6px' }}>Chủ đề <span style={{ color: '#ef4444' }}>*</span></label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={quizData.topic}
                                                    onChange={e => setQuizData({ ...quizData, topic: e.target.value })}
                                                    placeholder="Đại số, Hình học..."
                                                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white' }}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ gridColumn: creationMode === 'ai' ? 'span 2' : 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '6px' }}>Hạn nộp (Tùy chọn)</label>
                                        <input
                                            type="datetime-local"
                                            value={quizData.deadline}
                                            onChange={e => setQuizData({ ...quizData, deadline: e.target.value })}
                                            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                {/* Show answers toggle */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: '12px',
                                    border: '1px solid #334155',
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Hiện đáp án sau khi nộp bài</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Tắt nếu muốn tránh chia sẻ đáp án giữa học sinh</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setQuizData({ ...quizData, show_answers: !quizData.show_answers })}
                                        style={{
                                            width: '48px', height: '26px', borderRadius: '13px',
                                            backgroundColor: quizData.show_answers ? '#8b5cf6' : '#475569',
                                            border: 'none', cursor: 'pointer', position: 'relative',
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute', top: '3px',
                                            left: quizData.show_answers ? '24px' : '3px',
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            backgroundColor: 'white', transition: 'left 0.2s',
                                        }} />
                                    </button>
                                </div>

                                {creationMode === 'ai' && (
                                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid #1e3a8a' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#93c5fd' }}>
                                            Phân bố độ khó (Tổng: {quizData.easy_count + quizData.medium_count + quizData.hard_count} câu)
                                        </h4>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>Dễ</label>
                                                <input
                                                    type="number" min={0}
                                                    value={quizData.easy_count}
                                                    onChange={e => setQuizData({ ...quizData, easy_count: parseInt(e.target.value) || 0 })}
                                                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: 'white' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>Trung bình</label>
                                                <input
                                                    type="number" min={0}
                                                    value={quizData.medium_count}
                                                    onChange={e => setQuizData({ ...quizData, medium_count: parseInt(e.target.value) || 0 })}
                                                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: 'white' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>Khó</label>
                                                <input
                                                    type="number" min={0}
                                                    value={quizData.hard_count}
                                                    onChange={e => setQuizData({ ...quizData, hard_count: parseInt(e.target.value) || 0 })}
                                                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px', color: 'white' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {creationMode === 'manual' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', color: '#93c5fd' }}>Danh sách câu hỏi ({manualQuestions.length})</h4>
                                            <button
                                                type="button"
                                                onClick={handleAddManualQuestion}
                                                style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={14} /> Thêm câu hỏi
                                            </button>
                                        </div>
                                        {manualQuestions.map((q, idx) => (
                                            <div key={idx} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155', position: 'relative' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveManualQuestion(idx)}
                                                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Câu hỏi {idx + 1}</p>

                                                <input
                                                    placeholder="Nội dung câu hỏi..." required
                                                    value={q.question_text} onChange={e => handleUpdateManualQuestion(idx, 'question_text', e.target.value)}
                                                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', color: 'white', marginBottom: '12px', fontSize: '14px' }}
                                                />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, width: '20px' }}>A.</span>
                                                        <input required value={q.option_a} onChange={e => handleUpdateManualQuestion(idx, 'option_a', e.target.value)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '13px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, width: '20px' }}>B.</span>
                                                        <input required value={q.option_b} onChange={e => handleUpdateManualQuestion(idx, 'option_b', e.target.value)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '13px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, width: '20px' }}>C.</span>
                                                        <input required value={q.option_c} onChange={e => handleUpdateManualQuestion(idx, 'option_c', e.target.value)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '13px' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, width: '20px' }}>D.</span>
                                                        <input required value={q.option_d} onChange={e => handleUpdateManualQuestion(idx, 'option_d', e.target.value)} style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: 'white', fontSize: '13px' }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '12px', color: '#94a3b8', marginRight: '8px' }}>Đáp án đúng:</label>
                                                        <select value={q.correct_answer} onChange={e => handleUpdateManualQuestion(idx, 'correct_answer', e.target.value)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '13px' }}>
                                                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '12px', color: '#94a3b8', marginRight: '8px' }}>Độ khó:</label>
                                                        <select value={q.difficulty} onChange={e => handleUpdateManualQuestion(idx, 'difficulty', e.target.value)} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '6px', color: 'white', fontSize: '13px' }}>
                                                            <option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {creationMode === 'upload' && (
                                    <>
                                        <div style={{
                                            border: '2px dashed #475569', borderRadius: '12px', padding: '32px',
                                            textAlign: 'center', backgroundColor: '#0f172a', cursor: 'pointer'
                                        }} onClick={() => document.getElementById('file-upload-class')?.click()}>
                                            <input id="file-upload-class" type="file" accept=".docx" style={{ display: 'none' }} onChange={handleFileSelect} />
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#6366f1' }}>
                                                <BookOpen size={24} />
                                            </div>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px 0' }}>
                                                {uploadFile ? uploadFile.name : 'Nhấn để chọn file Word (.docx)'}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Hệ thống sẽ tự động đọc câu hỏi và đáp án</p>
                                        </div>

                                        {isUploading && (
                                            <div style={{ textAlign: 'center', padding: '12px', color: '#6366f1' }}>
                                                <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 8px' }} />
                                                <p style={{ fontSize: '13px' }}>Đang phân tích file...</p>
                                            </div>
                                        )}

                                        {parsedQuestions.length > 0 && (
                                            <div>
                                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#93c5fd' }}>Đã tìm thấy {parsedQuestions.length} câu hỏi</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                                    {parsedQuestions.map((q, idx) => (
                                                        <div key={idx} style={{ padding: '12px', border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#1e293b' }}>
                                                            <p style={{ fontWeight: 600, fontSize: '13px', margin: '0 0 6px 0', color: '#e2e8f0' }}>Câu {idx + 1}: {q.question_text}</p>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                                                                <div style={{ color: q.correct_answer === 'A' ? '#10b981' : '#64748b' }}>A. {q.option_a}</div>
                                                                <div style={{ color: q.correct_answer === 'B' ? '#10b981' : '#64748b' }}>B. {q.option_b}</div>
                                                                <div style={{ color: q.correct_answer === 'C' ? '#10b981' : '#64748b' }}>C. {q.option_c}</div>
                                                                <div style={{ color: q.correct_answer === 'D' ? '#10b981' : '#64748b' }}>D. {q.option_d}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: '12px 20px', borderRadius: '10px',
                                        border: '1px solid #475569', backgroundColor: 'transparent',
                                        color: '#cbd5e1', fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    style={{
                                        padding: '12px 24px', borderRadius: '10px',
                                        backgroundColor: '#3b82f6', color: 'white',
                                        fontWeight: 600, border: 'none', cursor: creating ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    {creating ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
                                    {creating ? 'Đang tạo...' : 'Tạo bài kiểm tra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedQuiz && (() => {
                const questions = selectedQuiz.questions || [];
                const totalQs = questions.length;
                const currentQ = questions[currentQuestion];

                const handleSelectAnswer = (qIdx: number, answer: string) => {
                    if (quizSubmitted) return;
                    setStudentAnswers(prev => ({ ...prev, [qIdx]: answer }));
                };

                const handleSubmitQuiz = async () => {
                    if (Object.keys(studentAnswers).length < totalQs) {
                        toast.error(`Bạn chưa trả lời hết! Còn ${totalQs - Object.keys(studentAnswers).length} câu chưa chọn.`);
                        return;
                    }
                    setSubmittingQuiz(true);
                    try {
                        // Submit answers to backend
                        const answersPayload = questions.map((q, idx) => ({
                            question_id: q.id,
                            selected_answer: studentAnswers[idx] || '',
                        }));
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/quizzes/${selectedQuiz.id}/submit`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ answers: answersPayload }),
                        });
                        if (response.ok) {
                            const result = await response.json();
                            setQuizScore({ correct: result.correct_count ?? result.score ?? 0, total: result.total_questions ?? totalQs, showAnswers: result.show_answers ?? selectedQuiz.show_answers ?? true });
                            toast.success('Đã nộp bài kiểm tra!');
                        } else {
                            // Fallback: calculate client-side
                            let correct = 0;
                            questions.forEach((q, idx) => { if (studentAnswers[idx] === q.correct_answer) correct++; });
                            setQuizScore({ correct, total: totalQs, showAnswers: selectedQuiz.show_answers ?? true });
                            toast.success('Đã nộp bài!');
                        }
                    } catch {
                        // Fallback: calculate client-side
                        let correct = 0;
                        questions.forEach((q, idx) => { if (studentAnswers[idx] === q.correct_answer) correct++; });
                        setQuizScore({ correct, total: totalQs, showAnswers: selectedQuiz.show_answers ?? true });
                        toast.success('Đã nộp bài!');
                    } finally {
                        setQuizSubmitted(true);
                        setSubmittingQuiz(false);
                    }
                };

                return (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                        padding: '20px',
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '24px', width: '100%', maxWidth: '800px',
                            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'white' }}>{selectedQuiz.title}</h2>
                                    {!isTeacher && totalQs > 0 && !quizSubmitted && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                                            Câu {currentQuestion + 1} / {totalQs} • Đã chọn {Object.keys(studentAnswers).length}/{totalQs}
                                        </p>
                                    )}
                                    {quizSubmitted && quizScore && (
                                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: quizScore.correct / quizScore.total >= 0.5 ? '#10b981' : '#ef4444' }}>
                                            Kết quả: {quizScore.correct}/{quizScore.total} câu đúng ({Math.round(quizScore.correct / quizScore.total * 100)}%)
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} color="#94a3b8" />
                                </button>
                            </div>

                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                {/* Info bar */}
                                <div style={{ marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', flex: 1 }}>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>Môn học</p>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'white' }}>{selectedQuiz.subject}</p>
                                    </div>
                                    <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', flex: 1 }}>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>Chủ đề</p>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'white' }}>{selectedQuiz.topic}</p>
                                    </div>
                                    <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', flex: 1 }}>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>Số câu hỏi</p>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'white' }}>{selectedQuiz.total_questions}</p>
                                    </div>
                                </div>

                                {/* TEACHER VIEW: show all questions with correct answers */}
                                {isTeacher && (
                                    <>
                                        <h3 style={{ color: '#e2e8f0', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>Danh sách câu hỏi (Preview)</h3>
                                        {questions.length > 0 ? (
                                            <div style={{ display: 'grid', gap: '16px' }}>
                                                {questions.map((q, idx) => (
                                                    <div key={q.id || idx} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>Câu {idx + 1}</span>
                                                            <span style={{
                                                                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                                                backgroundColor: q.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' : q.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                color: q.difficulty === 'easy' ? '#10b981' : q.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
                                                            }}>
                                                                {q.difficulty}
                                                            </span>
                                                        </div>
                                                        <p style={{ margin: '0 0 12px 0', color: '#cbd5e1' }}>{q.question_text}</p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            {['A', 'B', 'C', 'D'].map(opt => {
                                                                const optKey = `option_${opt.toLowerCase()}` as keyof typeof q;
                                                                const isCorrect = q.correct_answer === opt;
                                                                return (
                                                                    <div key={opt} style={{
                                                                        padding: '8px', borderRadius: '6px',
                                                                        backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                                                                        border: isCorrect ? '1px solid #10b981' : '1px solid #334155',
                                                                        color: isCorrect ? '#10b981' : '#94a3b8'
                                                                    }}>
                                                                        {opt}. {q[optKey] as string}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chi tiết câu hỏi sẽ hiển thị sau khi tạo xong...</p>
                                        )}
                                    </>
                                )}

                                {/* STUDENT VIEW: interactive quiz-taking */}
                                {!isTeacher && (
                                    <>
                                        {totalQs === 0 ? (
                                            <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>Bài kiểm tra chưa có câu hỏi...</p>
                                        ) : !quizSubmitted ? (
                                            /* One question at a time */
                                            <>
                                                {/* Question number dots */}
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px', justifyContent: 'center' }}>
                                                    {questions.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setCurrentQuestion(idx)}
                                                            style={{
                                                                width: '36px', height: '36px', borderRadius: '8px',
                                                                border: currentQuestion === idx ? '2px solid #8b5cf6' : '1px solid #334155',
                                                                backgroundColor: studentAnswers[idx] ? '#8b5cf6' : '#0f172a',
                                                                color: studentAnswers[idx] ? 'white' : '#94a3b8',
                                                                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    ))}
                                                </div>

                                                {currentQ && (
                                                    <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>Câu {currentQuestion + 1}</span>
                                                            <span style={{
                                                                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                                                backgroundColor: currentQ.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' : currentQ.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                color: currentQ.difficulty === 'easy' ? '#10b981' : currentQ.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
                                                            }}>
                                                                {currentQ.difficulty === 'easy' ? 'Dễ' : currentQ.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                                            </span>
                                                        </div>
                                                        <p style={{ margin: '0 0 20px 0', color: '#e2e8f0', fontSize: '16px', lineHeight: 1.6 }}>{currentQ.question_text}</p>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {['A', 'B', 'C', 'D'].map(opt => {
                                                                const optKey = `option_${opt.toLowerCase()}` as keyof typeof currentQ;
                                                                const isSelected = studentAnswers[currentQuestion] === opt;
                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => handleSelectAnswer(currentQuestion, opt)}
                                                                        style={{
                                                                            padding: '14px 16px', borderRadius: '12px', textAlign: 'left',
                                                                            backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : '#1e293b',
                                                                            border: isSelected ? '2px solid #8b5cf6' : '1px solid #334155',
                                                                            color: isSelected ? '#c4b5fd' : '#cbd5e1',
                                                                            cursor: 'pointer', fontSize: '14px', fontWeight: isSelected ? 600 : 400,
                                                                            transition: 'all 0.2s',
                                                                            display: 'flex', alignItems: 'center', gap: '12px',
                                                                        }}
                                                                    >
                                                                        <span style={{
                                                                            width: '28px', height: '28px', borderRadius: '50%',
                                                                            backgroundColor: isSelected ? '#8b5cf6' : '#0f172a',
                                                                            color: isSelected ? 'white' : '#64748b',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontWeight: 700, fontSize: '12px', flexShrink: 0,
                                                                            border: isSelected ? 'none' : '1px solid #334155',
                                                                        }}>
                                                                            {opt}
                                                                        </span>
                                                                        {currentQ[optKey] as string}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Navigation + Submit */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '12px' }}>
                                                    <button
                                                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                                        disabled={currentQuestion === 0}
                                                        style={{
                                                            padding: '12px 20px', borderRadius: '10px',
                                                            border: '1px solid #475569', backgroundColor: 'transparent',
                                                            color: currentQuestion === 0 ? '#475569' : '#cbd5e1',
                                                            fontWeight: 600, cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                                                        }}
                                                    >
                                                        ← Trước
                                                    </button>

                                                    {currentQuestion < totalQs - 1 ? (
                                                        <button
                                                            onClick={() => setCurrentQuestion(prev => Math.min(totalQs - 1, prev + 1))}
                                                            style={{
                                                                padding: '12px 20px', borderRadius: '10px',
                                                                backgroundColor: '#8b5cf6', color: 'white',
                                                                fontWeight: 600, border: 'none', cursor: 'pointer',
                                                            }}
                                                        >
                                                            Tiếp →
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={handleSubmitQuiz}
                                                            disabled={submittingQuiz}
                                                            style={{
                                                                padding: '12px 24px', borderRadius: '10px',
                                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                color: 'white', fontWeight: 700, border: 'none',
                                                                cursor: submittingQuiz ? 'not-allowed' : 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                            }}
                                                        >
                                                            {submittingQuiz ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                            {submittingQuiz ? 'Đang nộp...' : 'Nộp bài'}
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            /* After submission: show results */
                                            <>
                                                {quizScore && (
                                                    <div style={{
                                                        textAlign: 'center', padding: '24px', marginBottom: '24px',
                                                        backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155',
                                                    }}>
                                                        <div style={{
                                                            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                                                            background: quizScore.correct / quizScore.total >= 0.5
                                                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                                                : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '24px', fontWeight: 800, color: 'white',
                                                        }}>
                                                            {Math.round(quizScore.correct / quizScore.total * 10)}/10
                                                        </div>
                                                        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '18px', margin: '0 0 8px 0' }}>
                                                            {quizScore.correct / quizScore.total >= 0.8 ? 'Xuất sắc! 🎉' :
                                                                quizScore.correct / quizScore.total >= 0.5 ? 'Tốt lắm! 👍' : 'Cần cố gắng thêm! 💪'}
                                                        </p>
                                                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                                                            Trả lời đúng {quizScore.correct}/{quizScore.total} câu
                                                        </p>
                                                    </div>
                                                )}

                                                <h3 style={{ color: '#e2e8f0', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>Chi tiết kết quả</h3>
                                                {quizScore && !quizScore.showAnswers && (
                                                    <div style={{ padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid #f59e0b', marginBottom: '16px' }}>
                                                        <p style={{ margin: 0, fontSize: '14px', color: '#fbbf24' }}>⚠️ Giáo viên đã tắt hiện đáp án cho bài kiểm tra này.</p>
                                                    </div>
                                                )}
                                                <div style={{ display: 'grid', gap: '12px' }}>
                                                    {questions.map((q, idx) => {
                                                        const myAnswer = studentAnswers[idx];
                                                        const isCorrect = myAnswer === q.correct_answer;
                                                        const canShow = quizScore?.showAnswers !== false;
                                                        return (
                                                            <div key={q.id || idx} style={{
                                                                backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px',
                                                                border: `1px solid ${canShow ? (isCorrect ? '#10b981' : '#ef4444') : '#334155'}`,
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: canShow ? (isCorrect ? '#10b981' : '#ef4444') : '#94a3b8' }}>
                                                                        {canShow ? (isCorrect ? '✓' : '✗') : '•'} Câu {idx + 1}
                                                                    </span>
                                                                </div>
                                                                <p style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '14px' }}>{q.question_text}</p>
                                                                <p style={{ margin: 0, fontSize: '13px', color: canShow ? (isCorrect ? '#10b981' : '#ef4444') : '#94a3b8' }}>
                                                                    Bạn chọn: {myAnswer || 'Chưa chọn'}{canShow && !isCorrect ? ` • Đáp án đúng: ${q.correct_answer}` : ''}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

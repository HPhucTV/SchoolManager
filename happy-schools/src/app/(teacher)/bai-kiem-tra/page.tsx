'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, Users, CheckCircle, Trash2, Eye, Play, Sparkles, ChevronLeft } from 'lucide-react';
import { quizzesApi, Quiz, classesApi } from '@/lib/api';

const difficultyColors = {
    easy: { bg: '#dcfce7', color: '#16a34a', label: 'Dễ' },
    medium: { bg: '#fef3c7', color: '#d97706', label: 'Trung bình' },
    hard: { bg: '#fee2e2', color: '#dc2626', label: 'Khó' },
};

const statusConfig = {
    draft: { label: 'Nháp', bg: '#f3f4f6', color: '#6b7280' },
    active: { label: 'Đang mở', bg: '#dcfce7', color: '#16a34a' },
    closed: { label: 'Đã đóng', bg: '#fee2e2', color: '#dc2626' },
};

export default function QuizPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        topic: '',
        class_id: 0,
        easy_count: 3,
        medium_count: 4,
        hard_count: 3,
        deadline: '',
        allow_retake: false,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch quizzes and classes in parallel
            const [quizzesData, classesData] = await Promise.all([
                quizzesApi.getQuizzes().catch(() => []),
                classesApi.getClasses().catch(() => []),
            ]);
            setQuizzes(quizzesData);
            setClasses(classesData);
            if (classesData.length > 0 && formData.class_id === 0) {
                setFormData(prev => ({ ...prev, class_id: classesData[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.topic.trim()) return;

        setCreating(true);
        try {
            const quiz = await quizzesApi.createQuiz({
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
            });
            setQuizzes([quiz, ...quizzes]);
            setShowCreateModal(false);
            setSelectedQuiz(quiz);
            setShowDetailModal(true);
            resetForm();
        } catch (err: any) {
            alert('❌ Lỗi khi tạo bài kiểm tra: ' + (err.message || 'Unknown error'));
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subject: '',
            topic: '',
            class_id: classes[0]?.id || 0,
            easy_count: 3,
            medium_count: 4,
            hard_count: 3,
            deadline: '',
            allow_retake: false,
        });
    };

    const handleUpdateStatus = async (quiz: Quiz, newStatus: string) => {
        try {
            await quizzesApi.updateQuiz(quiz.id, { status: newStatus as any });
            setQuizzes(quizzes.map(q => q.id === quiz.id ? { ...q, status: newStatus as any } : q));
            if (selectedQuiz?.id === quiz.id) {
                setSelectedQuiz({ ...selectedQuiz, status: newStatus as any });
            }
        } catch (err) {
            alert('❌ Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (quizId: number) => {
        if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;
        try {
            await quizzesApi.deleteQuiz(quizId);
            setQuizzes(quizzes.filter(q => q.id !== quizId));
            setShowDetailModal(false);
        } catch (err) {
            alert('❌ Lỗi khi xóa bài kiểm tra');
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Không có hạn';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>
                        <Sparkles style={{ display: 'inline', marginRight: '12px', color: '#fbbf24' }} />
                        Bài Kiểm Tra AI
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Tạo bài trắc nghiệm tự động bằng AI</p>
                </div>
                <button onClick={() => { resetForm(); setShowCreateModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)' }}>
                    <Plus style={{ height: '20px', width: '20px' }} /> Tạo Bài Kiểm Tra
                </button>
            </div>

            {/* Quizzes Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : quizzes.length === 0 ? (
                <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}>
                    <BookOpen style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Chưa có bài kiểm tra nào</p>
                    <button onClick={() => setShowCreateModal(true)} style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                        Tạo bài kiểm tra đầu tiên
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {quizzes.map((quiz) => {
                        const status = statusConfig[quiz.status] || statusConfig.draft;
                        return (
                            <div key={quiz.id} onClick={() => { setSelectedQuiz(quiz); setShowDetailModal(true); }}
                                style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: '#f3e8ff', color: '#7c3aed' }}>{quiz.subject}</span>
                                    <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{quiz.title}</h3>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{quiz.topic}</p>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <span style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', backgroundColor: difficultyColors.easy.bg, color: difficultyColors.easy.color }}>{quiz.easy_count} Dễ</span>
                                    <span style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', backgroundColor: difficultyColors.medium.bg, color: difficultyColors.medium.color }}>{quiz.medium_count} TB</span>
                                    <span style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', backgroundColor: difficultyColors.hard.bg, color: difficultyColors.hard.color }}>{quiz.hard_count} Khó</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                                    <span><Clock style={{ display: 'inline', width: '14px', height: '14px', marginRight: '4px' }} />{formatDate(quiz.deadline)}</span>
                                    <span><BookOpen style={{ display: 'inline', width: '14px', height: '14px', marginRight: '4px' }} />{quiz.total_questions} câu</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
                            <Sparkles style={{ display: 'inline', marginRight: '8px', color: '#8b5cf6' }} />
                            Tạo Bài Kiểm Tra AI
                        </h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Tên bài kiểm tra *</label>
                                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="VD: Kiểm tra 15 phút - Toán" required
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Môn học *</label>
                                        <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="VD: Toán" required
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Lớp</label>
                                        <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px' }}>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Chủ đề / Nội dung *</label>
                                    <textarea value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        placeholder="VD: Phương trình bậc 2, công thức nghiệm, định lý Viète" required rows={3}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', resize: 'vertical' }} />
                                </div>
                                <div style={{ backgroundColor: '#f9fafb', borderRadius: '16px', padding: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Số câu hỏi theo độ khó</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', color: difficultyColors.easy.color, marginBottom: '4px' }}>🟢 Dễ</label>
                                            <input type="number" min="0" max="20" value={formData.easy_count} onChange={(e) => setFormData({ ...formData, easy_count: parseInt(e.target.value) || 0 })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `2px solid ${difficultyColors.easy.color}`, fontSize: '16px', fontWeight: 600, textAlign: 'center' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', color: difficultyColors.medium.color, marginBottom: '4px' }}>🟡 Trung bình</label>
                                            <input type="number" min="0" max="20" value={formData.medium_count} onChange={(e) => setFormData({ ...formData, medium_count: parseInt(e.target.value) || 0 })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `2px solid ${difficultyColors.medium.color}`, fontSize: '16px', fontWeight: 600, textAlign: 'center' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', color: difficultyColors.hard.color, marginBottom: '4px' }}>🔴 Khó</label>
                                            <input type="number" min="0" max="20" value={formData.hard_count} onChange={(e) => setFormData({ ...formData, hard_count: parseInt(e.target.value) || 0 })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `2px solid ${difficultyColors.hard.color}`, fontSize: '16px', fontWeight: 600, textAlign: 'center' }} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', textAlign: 'center' }}>
                                        Tổng: <strong>{formData.easy_count + formData.medium_count + formData.hard_count}</strong> câu hỏi
                                    </p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Hạn làm bài</label>
                                        <input type="datetime-local" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                                        <input type="checkbox" id="allowRetake" checked={formData.allow_retake} onChange={(e) => setFormData({ ...formData, allow_retake: e.target.checked })}
                                            style={{ width: '20px', height: '20px', marginRight: '10px', accentColor: '#8b5cf6' }} />
                                        <label htmlFor="allowRetake" style={{ fontSize: '14px', color: '#374151' }}>Cho phép làm lại</label>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                                    Hủy
                                </button>
                                <button type="submit" disabled={creating || !formData.title.trim() || !formData.topic.trim() || (formData.easy_count + formData.medium_count + formData.hard_count) === 0}
                                    style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: creating ? '#d1d5db' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer' }}>
                                    {creating ? '⏳ Đang tạo câu hỏi bằng AI...' : '✨ Tạo bài kiểm tra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedQuiz && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: statusConfig[selectedQuiz.status].bg, color: statusConfig[selectedQuiz.status].color }}>{statusConfig[selectedQuiz.status].label}</span>
                                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginTop: '12px' }}>{selectedQuiz.title}</h2>
                                <p style={{ color: '#6b7280', marginTop: '4px' }}>{selectedQuiz.subject} • {selectedQuiz.topic}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', cursor: 'pointer' }}>✕</button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{selectedQuiz.total_questions}</p>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>Câu hỏi</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: difficultyColors.easy.bg, borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: difficultyColors.easy.color }}>{selectedQuiz.easy_count}</p>
                                <p style={{ fontSize: '13px', color: difficultyColors.easy.color }}>Dễ</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: difficultyColors.medium.bg, borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: difficultyColors.medium.color }}>{selectedQuiz.medium_count}</p>
                                <p style={{ fontSize: '13px', color: difficultyColors.medium.color }}>Trung bình</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: difficultyColors.hard.bg, borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: difficultyColors.hard.color }}>{selectedQuiz.hard_count}</p>
                                <p style={{ fontSize: '13px', color: difficultyColors.hard.color }}>Khó</p>
                            </div>
                        </div>

                        {/* Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Hạn làm bài</p>
                                <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{formatDate(selectedQuiz.deadline)}</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Cho phép làm lại</p>
                                <p style={{ fontSize: '16px', fontWeight: 600, color: selectedQuiz.allow_retake ? '#16a34a' : '#dc2626' }}>
                                    {selectedQuiz.allow_retake ? '✓ Có' : '✕ Không'}
                                </p>
                            </div>
                        </div>

                        {/* Questions Preview */}
                        {selectedQuiz.questions && selectedQuiz.questions.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Xem trước câu hỏi</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedQuiz.questions.map((q, idx) => (
                                        <div key={q.id} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: 600, color: '#111827' }}>Câu {idx + 1}</span>
                                                <span style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: difficultyColors[q.difficulty].bg, color: difficultyColors[q.difficulty].color }}>{difficultyColors[q.difficulty].label}</span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>{q.question_text}</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                                <div style={{ padding: '8px', backgroundColor: q.correct_answer === 'A' ? '#dcfce7' : 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>A. {q.option_a}</div>
                                                <div style={{ padding: '8px', backgroundColor: q.correct_answer === 'B' ? '#dcfce7' : 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>B. {q.option_b}</div>
                                                <div style={{ padding: '8px', backgroundColor: q.correct_answer === 'C' ? '#dcfce7' : 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>C. {q.option_c}</div>
                                                <div style={{ padding: '8px', backgroundColor: q.correct_answer === 'D' ? '#dcfce7' : 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>D. {q.option_d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {selectedQuiz.status === 'draft' && (
                                <button onClick={() => handleUpdateStatus(selectedQuiz, 'active')}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                    <Play size={18} /> Mở bài kiểm tra
                                </button>
                            )}
                            {selectedQuiz.status === 'active' && (
                                <button onClick={() => handleUpdateStatus(selectedQuiz, 'closed')}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                    <CheckCircle size={18} /> Đóng bài kiểm tra
                                </button>
                            )}
                            <button onClick={() => handleDelete(selectedQuiz.id)}
                                style={{ padding: '14px 20px', borderRadius: '12px', border: '2px solid #ef4444', backgroundColor: 'white', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

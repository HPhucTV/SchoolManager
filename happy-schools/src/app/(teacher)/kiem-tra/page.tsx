'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Plus, Search, Filter, MoreVertical, FileText, Brain, Clock, Trash2, Eye, RefreshCw, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Quiz {
    id: number;
    title: string;
    subject: string;
    topic: string;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    total_questions: number;
    deadline: string | null;
    status: 'draft' | 'active' | 'closed';
    created_at: string;
}

interface Class {
    id: number;
    name: string;
}

export default function QuizPage() {
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        topic: '',
        class_id: 0,
        easy_count: 5,
        medium_count: 3,
        hard_count: 2,
        deadline: '',
        allow_retake: false,
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (token) {
            fetchQuizzes();
            fetchClasses();
        }
    }, [token]);

    const fetchQuizzes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            }
        } catch (err) {
            console.error('Failed to fetch quizzes:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/classes`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setClasses(data);
            }
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.class_id || !formData.subject || !formData.topic) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setCreating(true);
        try {
            // Send raw deadline string or null
            const deadlineToSend = formData.deadline || null;

            const response = await fetch(`${API_URL}/api/quizzes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    deadline: deadlineToSend
                }),
            });

            if (response.ok) {
                setShowCreateModal(false);
                fetchQuizzes();
                // Reset form
                setFormData({
                    title: '',
                    subject: '',
                    topic: '',
                    class_id: 0,
                    easy_count: 5,
                    medium_count: 3,
                    hard_count: 2,
                    deadline: '',
                    allow_retake: false,
                });
                alert('Tạo bài kiểm tra thành công! AI đã sinh câu hỏi.');
            } else {
                const error = await response.json();
                alert(`Lỗi: ${error.detail}`);
            }
        } catch (err) {
            console.error('Failed to create quiz:', err);
            alert('Lỗi kết nối khi tạo bài kiểm tra');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;

        try {
            const response = await fetch(`${API_URL}/api/quizzes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                setQuizzes(quizzes.filter(q => q.id !== id));
            } else {
                alert('Không thể xóa bài kiểm tra');
            }
        } catch (err) {
            console.error('Failed to delete quiz:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#dcfce7', text: '#16a34a', label: 'Đang mở' };
            case 'closed': return { bg: '#fee2e2', text: '#dc2626', label: 'Đã đóng' };
            default: return { bg: '#f3f4f6', text: '#6b7280', label: 'Nháp' };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                    Đang tải...
                </div>
                <style jsx global>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Bài kiểm tra</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Tạo đề kiểm tra tự động với AI</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '14px 24px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                    }}
                >
                    <Plus size={20} />
                    Tạo đề mới
                </button>
            </div>

            {/* Quiz List */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {quizzes.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px', padding: '60px',
                        textAlign: 'center', color: '#6b7280', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                        <Brain size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ fontSize: '16px' }}>Chưa có bài kiểm tra nào.</p>
                        <p style={{ fontSize: '14px' }}>Bấm nút "Tạo đề mới" để AI giúp bạn soạn đề nhé!</p>
                    </div>
                ) : (
                    quizzes.map(quiz => {
                        const statusColor = getStatusColor(quiz.status);
                        return (
                            <div key={quiz.id} style={{
                                backgroundColor: 'white', borderRadius: '16px', padding: '24px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s',
                            }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '14px',
                                        backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#4b5563'
                                    }}>
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>
                                            {quiz.title}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Brain size={14} />
                                                {quiz.subject} - {quiz.topic}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                {quiz.total_questions} câu hỏi
                                            </span>
                                            {quiz.deadline && (
                                                <span style={{ color: new Date(quiz.deadline) < new Date() ? '#dc2626' : '#6b7280' }}>
                                                    Hạn: {new Date(quiz.deadline).toLocaleString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                                        backgroundColor: statusColor.bg, color: statusColor.text
                                    }}>
                                        {statusColor.label}
                                    </span>

                                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 8px' }}></div>

                                    <a href={`/kiem-tra/${quiz.id}`} style={{
                                        padding: '8px', borderRadius: '10px', color: '#6b7280',
                                        border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        <Eye size={20} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(quiz.id)}
                                        style={{
                                            padding: '8px', borderRadius: '10px', color: '#ef4444',
                                            border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '24px', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'linear-gradient(to right, #f9fafb, white)'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                    Tạo bài kiểm tra AI
                                </h2>
                                <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>
                                    Nhập chủ đề và AI sẽ tạo câu hỏi cho bạn
                                </p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Title & Subject */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Tên bài kiểm tra <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="VD: Kiểm tra 15 phút"
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Môn học <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="VD: Vật Lý"
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                        />
                                    </div>
                                </div>

                                {/* Class & Deadline */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Dành cho lớp <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            value={formData.class_id}
                                            onChange={e => setFormData({ ...formData, class_id: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}
                                        >
                                            <option value={0}>Chọn lớp học</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Hạn chót (Tùy chọn)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.deadline}
                                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                        />
                                    </div>
                                </div>

                                {/* Topic for AI */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Chủ đề / Nội dung <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', color: '#8b5cf6' }}>
                                            <Brain size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.topic}
                                            onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                            placeholder="VD: Định luật Newton, Chuyển động thẳng đều..."
                                            style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px' }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                                        AI sẽ dựa vào chủ đề này để sinh câu hỏi tự động.
                                    </p>
                                </div>

                                {/* Question Counts */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                                        Cấu trúc đề ({formData.easy_count + formData.medium_count + formData.hard_count} câu)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '10px', border: '1px solid #d1fae5' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#059669', marginBottom: '4px', fontWeight: 600 }}>Dễ</label>
                                            <input
                                                type="number"
                                                min={0} max={20}
                                                value={formData.easy_count}
                                                onChange={e => setFormData({ ...formData, easy_count: parseInt(e.target.value) || 0 })}
                                                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #10b981', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}
                                            />
                                        </div>
                                        <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#d97706', marginBottom: '4px', fontWeight: 600 }}>Trung bình</label>
                                            <input
                                                type="number"
                                                min={0} max={20}
                                                value={formData.medium_count}
                                                onChange={e => setFormData({ ...formData, medium_count: parseInt(e.target.value) || 0 })}
                                                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #f59e0b', fontSize: '16px', fontWeight: 'bold', color: '#d97706' }}
                                            />
                                        </div>
                                        <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#dc2626', marginBottom: '4px', fontWeight: 600 }}>Khó</label>
                                            <input
                                                type="number"
                                                min={0} max={20}
                                                value={formData.hard_count}
                                                onChange={e => setFormData({ ...formData, hard_count: parseInt(e.target.value) || 0 })}
                                                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Settings */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id="allow_retake"
                                        checked={formData.allow_retake}
                                        onChange={e => setFormData({ ...formData, allow_retake: e.target.checked })}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="allow_retake" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                                        Cho phép học sinh làm lại nhiều lần
                                    </label>
                                </div>

                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '24px', borderTop: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px',
                            backgroundColor: '#f9fafb'
                        }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    border: '1px solid #e5e7eb', backgroundColor: 'white',
                                    color: '#374151', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                style={{
                                    padding: '12px 24px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: creating ? 0.7 : 1,
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {creating ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Đang tạo đề với AI...
                                    </>
                                ) : (
                                    <>
                                        <Brain size={18} />
                                        Tạo đề kiểm tra
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

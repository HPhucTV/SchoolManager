'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import {
    Plus, FileText, Calendar, Users, CheckCircle, Trash2,
    Edit, Eye, X, RefreshCw, Lock, Upload
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
    id?: number;
    question_type: 'multiple_choice' | 'essay';
    question_text: string;
    points: number;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_answer?: string;
    order_num?: number;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    subject: string;
    class_id: number;
    deadline: string;
    status: string;
    total_points: number;
    created_at: string;
    questions: Question[];
    submission_count: number;
}

interface Submission {
    id: number;
    student_id: number;
    student_name: string;
    status: string;
    total_score: number;
    submitted_at: string;
    graded_at: string;
    answers: Answer[];
}

interface Answer {
    id: number;
    question_id: number;
    answer_text: string;
    is_correct: boolean | null;
    score: number;
    feedback: string;
}

interface ClassAssignmentsProps {
    classId: number;
}

export default function ClassAssignments({ classId }: ClassAssignmentsProps) {
    const { token } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Create form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        deadline: '',
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [saving, setSaving] = useState(false);

    // Upload state
    const [creationMode, setCreationMode] = useState<'manual' | 'upload'>('manual');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Grading state
    const [grades, setGrades] = useState<{ [key: number]: { score: number; feedback: string } }>({});

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);

        await parseFile(file);
    };

    const parseFile = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/api/assignments/upload-docx`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (response.ok) {
                const parsedQuestions: Question[] = await response.json();
                setQuestions(prev => [...prev, ...parsedQuestions]);
                toast.success(`Đã thêm ${parsedQuestions.length} câu hỏi từ file!`);
                setCreationMode('manual');
            } else {
                toast.error('Không thể đọc file. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Lỗi kết nối khi tải file.');
        } finally {
            setIsUploading(false);
        }
    };

    const fetchAssignments = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data: Assignment[] = await response.json();
                // Filter by classId
                const classAssignments = data.filter(a => a.class_id === classId);
                setAssignments(classAssignments);
            }
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
        }
    }, [token, classId]);

    useEffect(() => {
        if (token && classId) {
            fetchAssignments();
        }
    }, [token, classId, fetchAssignments]);

    const fetchSubmissions = async (assignmentId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/assignments/${assignmentId}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data);
            }
        } catch (err) {
            console.error('Failed to fetch submissions:', err);
        }
    };

    const addQuestion = (type: 'multiple_choice' | 'essay') => {
        setQuestions([...questions, {
            question_type: type,
            question_text: '',
            points: 1,
            option_a: type === 'multiple_choice' ? '' : undefined,
            option_b: type === 'multiple_choice' ? '' : undefined,
            option_c: type === 'multiple_choice' ? '' : undefined,
            option_d: type === 'multiple_choice' ? '' : undefined,
            correct_answer: type === 'multiple_choice' ? 'A' : undefined,
        }]);
    };

    const updateQuestion = (index: number, field: string, value: string | number) => {
        const updated = [...questions];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!formData.title || questions.length === 0) {
            toast.error('Vui lòng điền tiêu đề và thêm ít nhất 1 câu hỏi');
            return;
        }

        setSaving(true);
        try {
            const deadlineToSend = formData.deadline || null;

            const url = editingId
                ? `${API_URL}/api/assignments/${editingId}`
                : `${API_URL}/api/assignments`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    class_id: classId, // FORCE CLASS ID
                    deadline: deadlineToSend,
                    questions,
                }),
            });

            if (response.ok) {
                toast.success(editingId ? 'Cập nhật bài tập thành công!' : 'Tạo bài tập thành công!');
                setShowCreateModal(false);
                resetForm();
                fetchAssignments();
            } else {
                const text = await response.text();
                try {
                    const error = JSON.parse(text);
                    toast.error(`Lỗi: ${error.detail || JSON.stringify(error)}`);
                } catch (_e) {
                    toast.error(`Lỗi Server: ${text.substring(0, 100)}...`);
                }
            }
        } catch (err) {
            console.error('Network Error:', err);
            toast.error(`Lỗi kết nối: ${(err as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;

        try {
            const response = await fetch(`${API_URL}/api/assignments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                fetchAssignments();
                toast.success('Đã xóa bài tập');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            toast.error('Không thể xóa bài tập');
        }
    };

    const handleClose = async (id: number) => {
        if (!confirm('Bạn có chắc muốn kết thúc bài tập này sớm? Học sinh sẽ không thể nộp bài nữa.')) return;

        try {
            const response = await fetch(`${API_URL}/api/assignments/${id}/close`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                toast.success('Đã kết thúc bài tập!');
                fetchAssignments();
            } else {
                toast.error('Không thể kết thúc bài tập');
            }
        } catch (err) {
            console.error('Failed to close:', err);
            toast.error('Lỗi khi kết thúc bài tập');
        }
    };

    const handleGrade = async () => {
        if (!selectedSubmission) return;

        try {
            const gradeData = Object.entries(grades).map(([answerId, grade]) => ({
                answer_id: parseInt(answerId),
                score: grade.score,
                feedback: grade.feedback,
            }));

            const response = await fetch(`${API_URL}/api/assignments/submissions/${selectedSubmission.id}/grade`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ grades: gradeData }),
            });

            if (response.ok) {
                toast.success('Chấm điểm thành công!');
                setShowGradeModal(false);
                if (selectedAssignment) {
                    fetchSubmissions(selectedAssignment.id);
                }
            }
        } catch (_err) {
            toast.error('Lỗi khi chấm điểm');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', subject: '', deadline: '' });
        setQuestions([]);
        setCreationMode('manual');
        setUploadFile(null);
        setEditingId(null);
    };

    const handleEdit = (assignment: Assignment) => {
        setFormData({
            title: assignment.title,
            description: assignment.description || '',
            subject: assignment.subject || '',
            deadline: assignment.deadline || '',
        });

        const mappedQuestions: Question[] = assignment.questions.map(q => ({
            id: q.id,
            question_type: q.question_type as 'multiple_choice' | 'essay',
            question_text: q.question_text,
            points: q.points,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer,
            order_num: q.order_num
        }));

        setQuestions(mappedQuestions);
        setEditingId(assignment.id);
        setShowCreateModal(true);
    };

    const viewSubmissions = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        fetchSubmissions(assignment.id);
        setShowViewModal(true);
    };

    const startGrading = (submission: Submission) => {
        setSelectedSubmission(submission);
        const initialGrades: { [key: number]: { score: number; feedback: string } } = {};
        submission.answers.forEach(a => {
            initialGrades[a.id] = { score: a.score, feedback: a.feedback || '' };
        });
        setGrades(initialGrades);
        setShowGradeModal(true);
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: { bg: string; color: string; label: string } } = {
            draft: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', label: 'Nháp' },
            active: { bg: '#d1fae5', color: '#059669', label: 'Đang mở' },
            closed: { bg: 'rgba(248, 113, 113, 0.15)', color: '#f87171', label: 'Đã đóng' },
            submitted: { bg: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', label: 'Đã nộp' },
            graded: { bg: '#d1fae5', color: '#059669', label: 'Đã chấm' },
        };
        const s = styles[status] || styles.draft;
        return (
            <span style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                backgroundColor: s.bg, color: s.color,
            }}>
                {s.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#cbd5e1' }}>
                Đang tải bài tập...
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    {/* Optional Header Text */}
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.2)',
                    }}
                >
                    <Plus size={18} />
                    Tạo bài tập
                </button>
            </div>

            {/* Assignment List */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {assignments.length === 0 ? (
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '16px', padding: '40px',
                        textAlign: 'center', border: '1px dashed #334155'
                    }}>
                        <FileText size={48} color="#475569" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#94a3b8', margin: 0, fontSize: '16px' }}>Lớp này chưa có bài tập</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Bấm &quot;Tạo bài tập&quot; để thêm mới</p>
                    </div>
                ) : (
                    assignments.map(a => (
                        <div key={a.id} style={{
                            backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px',
                            border: '1px solid #334155',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FileText size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{a.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            {a.questions.length} câu • {a.total_points} điểm
                                        </span>
                                        {a.deadline && (
                                            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} />
                                                {new Date(a.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Users size={12} />
                                            {a.submission_count} bài nộp
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {getStatusBadge(a.status)}
                                <button
                                    onClick={() => viewSubmissions(a)}
                                    title="Xem bài nộp"
                                    style={{
                                        padding: '8px', borderRadius: '8px',
                                        backgroundColor: '#0f172a', color: '#cbd5e1',
                                        border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <Eye size={16} />
                                </button>
                                {a.status === 'active' && (
                                    <button
                                        onClick={() => handleClose(a.id)}
                                        title="Kết thúc sớm"
                                        style={{
                                            padding: '8px', borderRadius: '8px',
                                            backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24',
                                            border: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        <Lock size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEdit(a)}
                                    title="Chỉnh sửa"
                                    style={{
                                        padding: '8px', borderRadius: '8px',
                                        backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa',
                                        border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(a.id)}
                                    title="Xóa"
                                    style={{
                                        padding: '8px', borderRadius: '8px',
                                        backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#f87171',
                                        border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '20px', width: '100%', maxWidth: '800px',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #334155',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                    {editingId ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
                                </h2>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                                    {creationMode === 'manual' ? 'Nhập thông tin và câu hỏi' : 'Tải lên từ file Word'}
                                </p>
                            </div>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #334155', padding: '0 24px' }}>
                            <button
                                onClick={() => setCreationMode('manual')}
                                style={{
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'manual' ? '#3b82f6' : '#6b7280',
                                    borderBottom: creationMode === 'manual' ? '2px solid #3b82f6' : 'none',
                                }}
                            >
                                ✍️ Nhập thủ công
                            </button>
                            <button
                                onClick={() => setCreationMode('upload')}
                                style={{
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'upload' ? '#3b82f6' : '#6b7280',
                                    borderBottom: creationMode === 'upload' ? '2px solid #3b82f6' : 'none',
                                }}
                            >
                                📤 Tải file Word
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {/* Basic Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '6px' }}>Tiêu đề *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Bài tập Toán chương 1"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '14px', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '6px' }}>Môn học</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Toán"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '14px', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '6px' }}>Hạn nộp</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '14px', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#cbd5e1', marginBottom: '6px' }}>Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Hướng dẫn làm bài..."
                                        rows={2}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '14px', backgroundColor: '#0f172a', color: 'white', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            {/* Questions Section */}
                            {creationMode === 'upload' ? (
                                <div style={{
                                    border: '2px dashed #475569', borderRadius: '16px', padding: '40px',
                                    textAlign: 'center', backgroundColor: '#0f172a', cursor: 'pointer',
                                    marginBottom: '20px', transition: 'border-color 0.2s'
                                }}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#475569'}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".docx"
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1e293b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                                        color: '#6366f1'
                                    }}>
                                        <Upload size={32} />
                                    </div>
                                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 4px 0' }}>
                                        {uploadFile ? uploadFile.name : 'Nhấn để chọn file Word (.docx)'}
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                        Hệ thống sẽ tự động đọc câu hỏi trắc nghiệm
                                    </p>

                                    {isUploading && (
                                        <div style={{ marginTop: '16px', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <RefreshCw className="animate-spin" size={20} />
                                            <span>Đang phân tích...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Câu hỏi ({questions.length})</h3>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => addQuestion('multiple_choice')}
                                                style={{
                                                    padding: '8px 14px', borderRadius: '8px',
                                                    backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa',
                                                    border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                <Plus size={16} /> Trắc nghiệm
                                            </button>
                                            <button
                                                onClick={() => addQuestion('essay')}
                                                style={{
                                                    padding: '8px 14px', borderRadius: '8px',
                                                    backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24',
                                                    border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                <Plus size={16} /> Tự luận
                                            </button>
                                        </div>
                                    </div>

                                    {questions.map((q, index) => (
                                        <div key={index} style={{
                                            padding: '16px', borderRadius: '12px', border: '1px solid #334155',
                                            marginBottom: '12px', backgroundColor: '#0f172a',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                                    backgroundColor: q.question_type === 'multiple_choice' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(217, 119, 6, 0.2)',
                                                    color: q.question_type === 'multiple_choice' ? '#60a5fa' : '#fbbf24',
                                                }}>
                                                    Câu {index + 1} - {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="number"
                                                        value={q.points}
                                                        onChange={e => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                        style={{ width: '50px', padding: '6px', borderRadius: '6px', border: '1px solid #334155', fontSize: '12px', backgroundColor: '#1e293b', color: 'white' }}
                                                    />
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>điểm</span>
                                                    <button
                                                        onClick={() => removeQuestion(index)}
                                                        style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <textarea
                                                value={q.question_text}
                                                onChange={e => updateQuestion(index, 'question_text', e.target.value)}
                                                placeholder="Nội dung câu hỏi..."
                                                rows={2}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '14px', marginBottom: '12px', resize: 'vertical', backgroundColor: '#1e293b', color: 'white' }}
                                            />

                                            {q.question_type === 'multiple_choice' && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                    {['A', 'B', 'C', 'D'].map(opt => (
                                                        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="radio"
                                                                name={`correct_${index}`}
                                                                checked={q.correct_answer === opt}
                                                                onChange={() => updateQuestion(index, 'correct_answer', opt)}
                                                                style={{ accentColor: '#3b82f6' }}
                                                            />
                                                            <input
                                                                type="text"
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                value={(q as any)[`option_${opt.toLowerCase()}`] || ''}
                                                                onChange={e => updateQuestion(index, `option_${opt.toLowerCase()}`, e.target.value)}
                                                                placeholder={`Đáp án ${opt}`}
                                                                style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', fontSize: '13px', backgroundColor: '#1e293b', color: 'white' }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {questions.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', border: '1px dashed #334155', borderRadius: '12px' }}>
                                            Chưa có câu hỏi. Bấm nút ở trên để thêm.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '20px 24px', borderTop: '1px solid #334155',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px'
                        }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                disabled={saving}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    border: '1px solid #475569', backgroundColor: 'transparent',
                                    color: '#cbd5e1', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                style={{
                                    padding: '12px 24px', borderRadius: '10px',
                                    backgroundColor: '#3b82f6', color: 'white',
                                    fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {saving ? <RefreshCw className="animate-spin" size={18} /> : (editingId ? <CheckCircle size={18} /> : <Plus size={18} />)}
                                {editingId ? 'Cập nhật' : 'Tạo bài tập'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Submissions Modal */}
            {showViewModal && selectedAssignment && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '20px', width: '100%', maxWidth: '900px',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white' }}>
                                Bài nộp: {selectedAssignment.title}
                            </h2>
                            <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#94a3b8" />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {submissions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    Chưa có học sinh nào nộp bài.
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                            <th style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>Học sinh</th>
                                            <th style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>Ngày nộp</th>
                                            <th style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>Điểm</th>
                                            <th style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>Trạng thái</th>
                                            <th style={{ padding: '12px', fontSize: '13px', color: '#94a3b8' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '12px' }}>{sub.student_name}</td>
                                                <td style={{ padding: '12px', fontSize: '14px' }}>
                                                    {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: 600 }}>
                                                    {sub.status === 'graded' ? `${sub.total_score}đ` : '--'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {getStatusBadge(sub.status)}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <button
                                                        onClick={() => startGrading(sub)}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '6px',
                                                            backgroundColor: '#3b82f6', color: 'white',
                                                            border: 'none', cursor: 'pointer', fontSize: '12px'
                                                        }}
                                                    >
                                                        {sub.status === 'graded' ? 'Xem lại' : 'Chấm điểm'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Grading Modal */}
            {showGradeModal && selectedSubmission && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '20px', width: '100%', maxWidth: '800px',
                        maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white' }}>
                                Chấm bài: {selectedSubmission.student_name}
                            </h3>
                            <button onClick={() => setShowGradeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#94a3b8" />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {selectedSubmission.answers.map((ans, idx) => {
                                const question = selectedAssignment?.questions.find(q => q.id === ans.question_id);
                                return (
                                    <div key={ans.id} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #334155' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600, color: '#e2e8f0', marginRight: '8px' }}>Câu {idx + 1}:</span>
                                            <span style={{ color: '#cbd5e1' }}>{question?.question_text}</span>
                                        </div>
                                        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '12px', color: '#e2e8f0' }}>
                                            <strong>Bài làm:</strong> {ans.answer_text}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Điểm</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="number"
                                                        value={grades[ans.id]?.score ?? ans.score}
                                                        onChange={e => setGrades({
                                                            ...grades,
                                                            [ans.id]: { ...grades[ans.id], score: parseFloat(e.target.value) || 0 }
                                                        })}
                                                        style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }}
                                                    />
                                                    <span style={{ color: '#64748b' }}>/ {question?.points}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Nhận xét</label>
                                                <input
                                                    type="text"
                                                    value={grades[ans.id]?.feedback ?? (ans.feedback || '')}
                                                    onChange={e => setGrades({
                                                        ...grades,
                                                        [ans.id]: { ...grades[ans.id], feedback: e.target.value }
                                                    })}
                                                    placeholder="Nhập nhận xét..."
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid #334155', textAlign: 'right' }}>
                            <button
                                onClick={handleGrade}
                                style={{
                                    padding: '12px 24px', borderRadius: '10px',
                                    backgroundColor: '#16a34a', color: 'white',
                                    fontWeight: 600, border: 'none', cursor: 'pointer',
                                }}
                            >
                                Lưu điểm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

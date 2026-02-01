'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
    Plus, FileText, Calendar, Users, CheckCircle, Clock, Trash2,
    Edit, Eye, Send, X, Save, GripVertical, MessageSquare, Upload, RefreshCw
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

interface Class {
    id: number;
    name: string;
}

export default function BaiTapPage() {
    const { token } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    // Create form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        class_id: 0,
        deadline: '',
    });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [saving, setSaving] = useState(false);

    // Upload state
    const [creationMode, setCreationMode] = useState<'manual' | 'upload'>('manual');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
                // Append parsed questions to existing ones, or replace?
                // For now, let's append to allow mixing manual + upload
                setQuestions(prev => [...prev, ...parsedQuestions]);
                alert(`Đã thêm ${parsedQuestions.length} câu hỏi từ file!`);
                // Switch back to manual mode to review
                setCreationMode('manual');
            } else {
                alert('Không thể đọc file. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Lỗi kết nối khi tải file.');
        } finally {
            setIsUploading(false);
        }
    };

    // Grading state
    const [grades, setGrades] = useState<{ [key: number]: { score: number; feedback: string } }>({});

    useEffect(() => {
        if (token) {
            fetchAssignments();
            fetchClasses();
        }
    }, [token]);

    const fetchAssignments = async () => {
        try {
            const response = await fetch(`${API_URL}/api/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAssignments(data);
            }
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
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
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.class_id || questions.length === 0) {
            alert('Vui lòng điền đầy đủ thông tin và thêm ít nhất 1 câu hỏi');
            return;
        }

        setSaving(true);
        try {
            // Send raw deadline string (YYYY-MM-DDTHH:mm) to preserve local time
            // Backend will parse it as naive datetime
            const deadlineToSend = formData.deadline || null;

            console.log('Sending assignment data:', {
                ...formData,
                deadline: deadlineToSend,
                questions,
            });

            const response = await fetch(`${API_URL}/api/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    deadline: deadlineToSend,
                    questions,
                }),
            });

            if (response.ok) {
                alert('✅ Tạo bài tập thành công!');
                setShowCreateModal(false);
                resetForm();
                fetchAssignments();
            } else {
                const text = await response.text();
                try {
                    const error = JSON.parse(text);
                    console.error('API Error:', error);
                    alert(`❌ Lỗi API: ${error.detail || JSON.stringify(error)}`);
                } catch (e) {
                    console.error('API Error (Non-JSON):', text);
                    alert(`❌ Lỗi Server: ${text.substring(0, 100)}...`);
                }
            }
        } catch (err) {
            console.error('Network Error:', err);
            alert(`❌ Lỗi kết nối: ${(err as Error).message}`);
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
            }
        } catch (err) {
            console.error('Failed to delete:', err);
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
                alert('✅ Chấm điểm thành công!');
                setShowGradeModal(false);
                if (selectedAssignment) {
                    fetchSubmissions(selectedAssignment.id);
                }
            }
        } catch (err) {
            alert('❌ Lỗi khi chấm điểm');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', subject: '', class_id: 0, deadline: '' });
        setQuestions([]);
        setCreationMode('manual');
        setUploadFile(null);
    };

    const viewSubmissions = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        fetchSubmissions(assignment.id);
        setShowViewModal(true);
    };

    const startGrading = (submission: Submission) => {
        setSelectedSubmission(submission);
        // Initialize grades from existing scores
        const initialGrades: { [key: number]: { score: number; feedback: string } } = {};
        submission.answers.forEach(a => {
            initialGrades[a.id] = { score: a.score, feedback: a.feedback || '' };
        });
        setGrades(initialGrades);
        setShowGradeModal(true);
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: { bg: string; color: string; label: string } } = {
            draft: { bg: '#fef3c7', color: '#d97706', label: 'Nháp' },
            active: { bg: '#d1fae5', color: '#059669', label: 'Đang mở' },
            closed: { bg: '#fee2e2', color: '#dc2626', label: 'Đã đóng' },
            submitted: { bg: '#dbeafe', color: '#2563eb', label: 'Đã nộp' },
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                    Đang tải...
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Bài tập</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Giao và quản lý bài tập cho học sinh</p>
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
                    Tạo bài tập
                </button>
            </div>

            {/* Assignment List */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {assignments.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px', padding: '60px',
                        textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}>
                        <FileText size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#6b7280', margin: 0 }}>Chưa có bài tập nào</h3>
                        <p style={{ color: '#9ca3af' }}>Bấm &quot;Tạo bài tập&quot; để bắt đầu</p>
                    </div>
                ) : (
                    assignments.map(a => (
                        <div key={a.id} style={{
                            backgroundColor: 'white', borderRadius: '16px', padding: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FileText size={24} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>{a.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                            {a.questions.length} câu • {a.total_points} điểm
                                        </span>
                                        {a.deadline && (
                                            <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={14} />
                                                {new Date(a.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Users size={14} />
                                            {a.submission_count} bài nộp
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {getStatusBadge(a.status)}
                                <button
                                    onClick={() => viewSubmissions(a)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '10px',
                                        backgroundColor: '#f3f4f6', color: '#374151',
                                        border: 'none', cursor: 'pointer', fontWeight: 500,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <Eye size={16} />
                                    Xem bài nộp
                                </button>
                                <button
                                    onClick={() => handleDelete(a.id)}
                                    style={{
                                        padding: '8px', borderRadius: '10px',
                                        backgroundColor: '#fee2e2', color: '#dc2626',
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
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '800px',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Tạo bài tập mới</h2>
                                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
                                    {creationMode === 'manual' ? 'Nhập thông tin và câu hỏi' : 'Tải lên từ file Word'}
                                </p>
                            </div>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
                            <button
                                onClick={() => setCreationMode('manual')}
                                style={{
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'manual' ? '#2563eb' : '#6b7280',
                                    borderBottom: creationMode === 'manual' ? '2px solid #2563eb' : 'none',
                                }}
                            >
                                ✍️ Nhập thủ công
                            </button>
                            <button
                                onClick={() => setCreationMode('upload')}
                                style={{
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    color: creationMode === 'upload' ? '#2563eb' : '#6b7280',
                                    borderBottom: creationMode === 'upload' ? '2px solid #2563eb' : 'none',
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
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Tiêu đề *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Bài tập Toán chương 1"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Môn học</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Toán"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Lớp *</label>
                                    <select
                                        value={formData.class_id}
                                        onChange={e => setFormData({ ...formData, class_id: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                    >
                                        <option value={0}>Chọn lớp</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Hạn nộp</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Hướng dẫn làm bài..."
                                        rows={2}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            {/* Questions Section */}
                            {creationMode === 'upload' ? (
                                <div style={{
                                    border: '2px dashed #9ca3af', borderRadius: '16px', padding: '40px',
                                    textAlign: 'center', backgroundColor: '#f9fafb', cursor: 'pointer',
                                    marginBottom: '20px'
                                }}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".docx"
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eef2ff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                                        color: '#6366f1'
                                    }}>
                                        <Upload size={32} />
                                    </div>
                                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>
                                        {uploadFile ? uploadFile.name : 'Nhấn để chọn file Word (.docx)'}
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
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
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Câu hỏi ({questions.length})</h3>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => addQuestion('multiple_choice')}
                                                style={{
                                                    padding: '8px 14px', borderRadius: '8px',
                                                    backgroundColor: '#dbeafe', color: '#2563eb',
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
                                                    backgroundColor: '#fef3c7', color: '#d97706',
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
                                            padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb',
                                            marginBottom: '12px', backgroundColor: '#f9fafb',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    backgroundColor: q.question_type === 'multiple_choice' ? '#dbeafe' : '#fef3c7',
                                                    color: q.question_type === 'multiple_choice' ? '#2563eb' : '#d97706',
                                                }}>
                                                    Câu {index + 1} - {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="number"
                                                        value={q.points}
                                                        onChange={e => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                                                        min={1}
                                                        style={{ width: '60px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                                    />
                                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>điểm</span>
                                                    <button
                                                        onClick={() => removeQuestion(index)}
                                                        style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}
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
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '12px', resize: 'vertical' }}
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
                                                            />
                                                            <input
                                                                type="text"
                                                                value={(q as any)[`option_${opt.toLowerCase()}`] || ''}
                                                                onChange={e => updateQuestion(index, `option_${opt.toLowerCase()}`, e.target.value)}
                                                                placeholder={`Đáp án ${opt}`}
                                                                style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {questions.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
                                            Chưa có câu hỏi. Bấm nút ở trên để thêm.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px', borderTop: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px',
                        }}>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    backgroundColor: '#f3f4f6', color: '#374151',
                                    border: 'none', cursor: 'pointer', fontWeight: 500,
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                <Send size={16} />
                                {saving ? 'Đang tạo...' : 'Giao bài tập'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Submissions Modal */}
            {showViewModal && selectedAssignment && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '700px',
                        maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{selectedAssignment.title}</h2>
                                <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>
                                    {submissions.length} bài nộp • {selectedAssignment.total_points} điểm tối đa
                                </p>
                            </div>
                            <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {submissions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                    Chưa có học sinh nào nộp bài
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {submissions.map(s => (
                                        <div key={s.id} style={{
                                            padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <div>
                                                <h4 style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{s.student_name}</h4>
                                                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                                                    Nộp lúc: {new Date(s.submitted_at).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontWeight: 600, color: '#111827' }}>
                                                    {s.total_score}/{selectedAssignment.total_points}
                                                </span>
                                                {getStatusBadge(s.status)}
                                                <button
                                                    onClick={() => startGrading(s)}
                                                    style={{
                                                        padding: '8px 14px', borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                                        color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                                                    }}
                                                >
                                                    Chấm điểm
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Grade Modal */}
            {showGradeModal && selectedSubmission && selectedAssignment && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '700px',
                        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Chấm bài: {selectedSubmission.student_name}</h2>
                            </div>
                            <button onClick={() => setShowGradeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {selectedAssignment.questions.map((q, index) => {
                                const answer = selectedSubmission.answers.find(a => a.question_id === q.id);
                                const isEssay = q.question_type === 'essay';

                                return (
                                    <div key={q.id} style={{
                                        padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb',
                                        marginBottom: '16px', backgroundColor: '#f9fafb',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                backgroundColor: isEssay ? '#fef3c7' : '#dbeafe',
                                                color: isEssay ? '#d97706' : '#2563eb',
                                            }}>
                                                Câu {index + 1} ({q.points} điểm)
                                            </span>
                                            {!isEssay && answer && (
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    backgroundColor: answer.is_correct ? '#d1fae5' : '#fee2e2',
                                                    color: answer.is_correct ? '#059669' : '#dc2626',
                                                }}>
                                                    {answer.is_correct ? '✓ Đúng' : '✗ Sai'}
                                                </span>
                                            )}
                                        </div>

                                        <p style={{ fontWeight: 500, color: '#111827', marginBottom: '8px' }}>{q.question_text}</p>

                                        {answer && (
                                            <div style={{
                                                padding: '12px', borderRadius: '8px', backgroundColor: 'white',
                                                border: '1px solid #e5e7eb', marginBottom: '12px',
                                            }}>
                                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Câu trả lời:</p>
                                                <p style={{ color: '#111827', whiteSpace: 'pre-wrap' }}>{answer.answer_text}</p>
                                            </div>
                                        )}

                                        {isEssay && answer && (
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '100px' }}>
                                                    <label style={{ fontSize: '12px', color: '#6b7280' }}>Điểm (/{q.points})</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={q.points}
                                                        value={grades[answer.id]?.score || 0}
                                                        onChange={e => setGrades({
                                                            ...grades,
                                                            [answer.id]: { ...grades[answer.id], score: parseInt(e.target.value) || 0 }
                                                        })}
                                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '12px', color: '#6b7280' }}>Nhận xét</label>
                                                    <textarea
                                                        value={grades[answer.id]?.feedback || ''}
                                                        onChange={e => setGrades({
                                                            ...grades,
                                                            [answer.id]: { ...grades[answer.id], feedback: e.target.value }
                                                        })}
                                                        placeholder="Nhận xét cho học sinh..."
                                                        rows={2}
                                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', resize: 'vertical' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{
                            padding: '16px 24px', borderTop: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px',
                        }}>
                            <button
                                onClick={() => setShowGradeModal(false)}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    backgroundColor: '#f3f4f6', color: '#374151',
                                    border: 'none', cursor: 'pointer', fontWeight: 500,
                                }}
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleGrade}
                                style={{
                                    padding: '12px 20px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                <CheckCircle size={16} />
                                Lưu điểm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Plus, Edit2, X } from 'lucide-react';

interface ClassData {
    id: number;
    name: string;
    grade: string;
    teacher_id?: number;
    teacher_name?: string;
    student_count: number;
}

interface Teacher {
    id: number;
    name: string;
}

export default function ClassesManagement() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassData | null>(null);
    const [formData, setFormData] = useState({ name: '', grade: '', teacher_id: '' });

    const fetchData = async () => {
        try {
            const [classesRes, teachersRes] = await Promise.all([
                adminApi.getClasses(),
                adminApi.getUsers('teacher'),
            ]);

            setClasses(classesRes);
            setTeachers(teachersRes);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = {
                name: formData.name,
                grade: formData.grade,
                teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
            };

            if (editingClass) {
                await adminApi.updateClass(editingClass.id, data);
            } else {
                await adminApi.createClass(data);
            }

            setShowModal(false);
            setEditingClass(null);
            setFormData({ name: '', grade: '', teacher_id: '' });
            fetchData();
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Lưu lớp học thất bại');
        }
    };

    const openEditModal = (cls: ClassData) => {
        setEditingClass(cls);
        setFormData({
            name: cls.name,
            grade: cls.grade,
            teacher_id: cls.teacher_id?.toString() || '',
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingClass(null);
        setFormData({ name: '', grade: '', teacher_id: '' });
        setShowModal(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Quản lý Lớp học</h1>
                <button
                    onClick={openCreateModal}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    <Plus size={20} />
                    Tạo Lớp mới
                </button>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {loading ? (
                    <p style={{ color: '#6b7280' }}>Đang tải...</p>
                ) : classes.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>Chưa có lớp học nào</p>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                        {cls.name}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                                        Khối {cls.grade}
                                    </p>
                                </div>
                                <button
                                    onClick={() => openEditModal(cls)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f3f4f6',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Edit2 size={16} color="#6b7280" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>Giáo viên</p>
                                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                        {cls.teacher_name || 'Chưa phân công'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>Học sinh</p>
                                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                        {cls.student_count} em
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        width: '400px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                                {editingClass ? 'Sửa Lớp học' : 'Tạo Lớp mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                    Tên lớp
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Lớp 10A"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                    Khối
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: 10"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                    Giáo viên phụ trách
                                </label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px',
                                    }}
                                >
                                    <option value="">-- Chọn giáo viên --</option>
                                    {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                }}
                            >
                                {editingClass ? 'Cập nhật' : 'Tạo Lớp'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import {
    Plus, Search, Edit2, Trash2, X, Filter,
    BookOpen, User, Users, GraduationCap
} from 'lucide-react';
import styles from '../admin.module.css';

interface ClassData {
    id: number;
    name: string;
    grade: string;
    teacher_id?: number | null;
    teacher_name?: string | null;
    student_count: number;
}

interface Teacher {
    id: number;
    name: string;
    email: string;
}

export default function ClassesManagement() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassData | null>(null);

    // Form data
    const [formData, setFormData] = useState({ name: '', grade: '', teacher_id: '' });

    // Toast & Confirm
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Note: Delete class is not explicitly in api.ts or auth.py yet?
    // Let's check api.ts. It has createClass, updateClass, getClasses.
    // It does NOT have deleteClass.
    // So we won't implement delete for now, or just leave it out.
    // The requirement didn't explicitly ask for delete class, just "manage".
    // I'll skip delete for now to be safe.

    const fetchData = async () => {
        try {
            const [classesData, teachersData] = await Promise.all([
                adminApi.getClasses(),
                adminApi.getUsers('teacher')
            ]);
            setClasses(classesData);
            setTeachers(teachersData);
        } catch (err) {
            console.error(err);
            showToast('Lỗi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                grade: formData.grade,
                teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null,
            };

            if (editingClass) {
                // Update
                await adminApi.updateClass(editingClass.id, payload);
                showToast('Cập nhật lớp học thành công!', 'success');
            } else {
                // Create
                await adminApi.createClass(payload);
                showToast('Tạo lớp học thành công!', 'success');
            }
            setShowModal(false);
            setEditingClass(null);
            setFormData({ name: '', grade: '', teacher_id: '' });
            fetchData();
        } catch (err) {
            showToast('Có lỗi xảy ra', 'error');
        }
    };

    const openCreateModal = () => {
        setEditingClass(null);
        setFormData({ name: '', grade: '', teacher_id: '' });
        setShowModal(true);
    };

    const openEditModal = (cls: ClassData) => {
        setEditingClass(cls);
        setFormData({
            name: cls.name,
            grade: cls.grade,
            teacher_id: cls.teacher_id ? cls.teacher_id.toString() : ''
        });
        setShowModal(true);
    };

    // Filter
    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div className={styles.toastContainer}>
                    <div className={toast.type === 'success' ? styles.toastSuccess : styles.toastError}>
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Quản lý Lớp học</h1>
                    <p className={styles.pageSubtitle}>{classes.length} lớp học đang hoạt động</p>
                </div>
                <button className={styles.btnPrimary} onClick={openCreateModal}>
                    <Plus size={18} /> Tạo Lớp học
                </button>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm lớp học..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.searchWrapper} style={{ maxWidth: '140px', marginLeft: 'auto' }}>
                    {/* View switch placeholder if needed */}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className={styles.adminWrapper}><p style={{ padding: '20px', color: '#94a3b8' }}>Đang tải...</p></div>
            ) : filteredClasses.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><BookOpen /></div>
                    <p className={styles.emptyTitle}>Không tìm thấy lớp học nào</p>
                    <p className={styles.emptyMessage}>Hãy tạo lớp học mới để bắt đầu</p>
                </div>
            ) : (
                <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {filteredClasses.map((cls) => (
                        <div key={cls.id} className={styles.classCard} onClick={() => openEditModal(cls)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <span className={styles.badgePurple} style={{ marginBottom: '8px' }}>Khối {cls.grade}</span>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', margin: '8px 0 0' }}>{cls.name}</h3>
                                </div>
                                <div className={styles.statIconCyan} style={{ width: '40px', height: '40px' }}>
                                    <BookOpen size={20} />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className={styles.avatarBlue} style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                                        {cls.teacher_name ? cls.teacher_name[0].toUpperCase() : '?'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                        {cls.teacher_name || 'Chưa có GV'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
                                    <GraduationCap size={16} /> {cls.student_count} HS
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Create/Edit */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingClass ? 'Cập nhật Lớp học' : 'Tạo Lớp học mới'}
                            </h2>
                            <button className={styles.btnIcon} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tên lớp</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.formInput}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ví dụ: 10A1"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Khối lớp</label>
                                <select
                                    className={styles.formSelect}
                                    required
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                >
                                    <option value="">-- Chọn khối --</option>
                                    <option value="10">Khối 10</option>
                                    <option value="11">Khối 11</option>
                                    <option value="12">Khối 12</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Giáo viên chủ nhiệm</label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                >
                                    <option value="">-- Chọn giáo viên --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnPrimary}>
                                    {editingClass ? 'Lưu thay đổi' : 'Tạo lớp học'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

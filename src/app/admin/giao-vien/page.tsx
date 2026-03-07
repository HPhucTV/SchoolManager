/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { adminApi, classesApi } from '@/lib/api';
import {
    Plus, Search, Edit2, Trash2, X, Filter,
    Mail, User, BookOpen, Users, KeyRound
} from 'lucide-react';
import styles from '../admin.module.css';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    class_id?: number;
    class_name?: string;
}

interface ClassData {
    id: number;
    name: string;
}

export default function TeachersManagement() {
    const [teachers, setTeachers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form data
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    // Toast & Confirm
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showConfirm, setShowConfirm] = useState<{ id: number; name: string } | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState<{ id: number; name: string } | null>(null);

    const fetchData = async () => {
        try {
            const data = await adminApi.getUsers('teacher');
            setTeachers(data);
        } catch (err) {
            console.error(err);
            showToast('Lỗi tải danh sách giáo viên', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                await adminApi.updateUser(editingUser.id, {
                    name: formData.name,
                    email: formData.email,
                });
                showToast('Cập nhật thành công!', 'success');
            } else {
                // Create
                await adminApi.createUser({ ...formData, role: 'teacher' });
                showToast('Thêm giáo viên thành công!', 'success');
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '' });
            fetchData();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error');
        }
    };

    const handleDelete = async () => {
        if (!showConfirm) return;
        try {
            await adminApi.deleteUser(showConfirm.id);
            showToast('Đã xoá giáo viên', 'success');
            fetchData();
        } catch (err) {
            showToast('Lỗi khi xoá giáo viên', 'error');
        } finally {
            setShowConfirm(null);
        }
    };

    const handleResetPassword = async () => {
        if (!showResetConfirm) return;
        try {
            const result = await adminApi.resetPassword(showResetConfirm.id);
            showToast(result.message, 'success');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi khi đặt lại mật khẩu', 'error');
        } finally {
            setShowResetConfirm(null);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '' });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, password: '' }); // Don't fill password
        setShowModal(true);
    };

    // Filter
    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className={styles.pageTitle}>Quản lý Giáo viên</h1>
                    <p className={styles.pageSubtitle}>{teachers.length} giáo viên trong hệ thống</p>
                </div>
                <button className={styles.btnPrimary} onClick={openCreateModal}>
                    <Plus size={18} /> Thêm Giáo viên
                </button>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Giáo viên</th>
                            <th>Liên hệ</th>
                            <th>Lớp phụ trách</th>
                            <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className={styles.emptyState}>Đang tải...</td></tr>
                        ) : filteredTeachers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className={styles.emptyState}>
                                    <div className={styles.emptyIcon}><Users /></div>
                                    <p className={styles.emptyTitle}>Không tìm thấy giáo viên nào</p>
                                    <p className={styles.emptyMessage}>Hãy thử tìm kiếm từ khóa khác hoặc thêm mới</p>
                                </td>
                            </tr>
                        ) : (
                            filteredTeachers.map((teacher) => {
                                const initials = teacher.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                    <tr key={teacher.id}>
                                        <td>
                                            <div className={styles.userRow}>
                                                <div className={styles.avatarBlue}>{initials}</div>
                                                <div>
                                                    <div className={styles.userRowName}>{teacher.name}</div>
                                                    <div className={styles.badgeBlue} style={{ marginTop: '4px', fontSize: '10px' }}>Teacher</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Mail size={14} /> {teacher.email}
                                            </div>
                                        </td>
                                        <td style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                            {teacher.class_name ? (
                                                <span className={styles.badgePurple}>{teacher.class_name}</span>
                                            ) : (
                                                <span className={styles.badgeMuted}>Chưa phân công</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    onClick={() => openEditModal(teacher)}
                                                    title="Sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.btnIcon} ${styles.btnIconWarning}`}
                                                    onClick={() => setShowResetConfirm({ id: teacher.id, name: teacher.name })}
                                                    title="Đặt lại mật khẩu"
                                                >
                                                    <KeyRound size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                                                    onClick={() => setShowConfirm({ id: teacher.id, name: teacher.name })}
                                                    title="Xoá"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Create/Edit */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingUser ? 'Cập nhật Giáo viên' : 'Thêm Giáo viên mới'}
                            </h2>
                            <button className={styles.btnIcon} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Họ và tên</label>
                                <div className={styles.searchWrapper} style={{ maxWidth: '100%' }}>
                                    <User className={styles.searchIcon} size={18} />
                                    <input
                                        type="text"
                                        required
                                        className={styles.formInput}
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <div className={styles.searchWrapper} style={{ maxWidth: '100%' }}>
                                    <Mail className={styles.searchIcon} size={18} />
                                    <input
                                        type="email"
                                        required
                                        className={styles.formInput}
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            {!editingUser && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mật khẩu</label>
                                    <input
                                        type="password"
                                        required
                                        className={styles.formInput}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnPrimary}>
                                    {editingUser ? 'Lưu thay đổi' : 'Tạo giáo viên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            {showConfirm && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <h3 className={styles.confirmTitle}>Xác nhận xoá?</h3>
                        <p className={styles.confirmMessage}>
                            Bạn có chắc chắn muốn xoá giáo viên <strong>{showConfirm.name}</strong>?<br />
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className={styles.confirmActions}>
                            <button className={styles.btnSecondary} onClick={() => setShowConfirm(null)}>
                                Hủy
                            </button>
                            <button className={styles.btnDanger} onClick={handleDelete}>
                                Xoá vĩnh viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Reset Password */}
            {showResetConfirm && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <KeyRound size={24} />
                        </div>
                        <h3 className={styles.confirmTitle}>Đặt lại mật khẩu?</h3>
                        <p className={styles.confirmMessage}>
                            Mật khẩu của <strong>{showResetConfirm.name}</strong> sẽ được đặt lại thành <strong>test123</strong>.
                        </p>
                        <div className={styles.confirmActions}>
                            <button className={styles.btnSecondary} onClick={() => setShowResetConfirm(null)}>
                                Hủy
                            </button>
                            <button className={styles.btnPrimary} onClick={handleResetPassword}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

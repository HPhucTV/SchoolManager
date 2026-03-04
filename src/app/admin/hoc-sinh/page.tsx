'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import {
    Plus, Search, Edit2, Trash2, X, Filter,
    Mail, GraduationCap, Upload, FileSpreadsheet, Download, KeyRound
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

export default function StudentsManagement() {
    const [students, setStudents] = useState<User[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form data
    const [formData, setFormData] = useState({ name: '', email: '', password: '', class_id: '' });

    // Import data
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importClassId, setImportClassId] = useState<string>('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

    // Toast & Confirm
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showConfirm, setShowConfirm] = useState<{ id: number; name: string } | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState<{ id: number; name: string } | null>(null);

    const fetchData = async () => {
        try {
            const [studentsData, classesData] = await Promise.all([
                adminApi.getUsers('student'),
                adminApi.getClasses()
            ]);
            setStudents(studentsData);
            setClasses(classesData);
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
                ...formData,
                role: 'student',
                class_id: formData.class_id ? parseInt(formData.class_id) : null,
            };

            if (editingUser) {
                // Update
                await adminApi.updateUser(editingUser.id, {
                    name: formData.name,
                    email: formData.email,
                    class_id: payload.class_id,
                });
                showToast('Cập nhật thành công!', 'success');
            } else {
                // Create
                await adminApi.createUser(payload);
                showToast('Thêm học sinh thành công!', 'success');
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', class_id: '' });
            fetchData();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error');
        }
    };

    const handleDelete = async () => {
        if (!showConfirm) return;
        try {
            await adminApi.deleteUser(showConfirm.id);
            showToast('Đã xoá học sinh', 'success');
            fetchData();
        } catch (err) {
            showToast('Lỗi khi xoá học sinh', 'error');
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

    const handleDownloadTemplate = async () => {
        try {
            await adminApi.downloadStudentTemplate();
        } catch (err) {
            showToast('Lỗi tải mẫu file', 'error');
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile || !importClassId) {
            showToast('Vui lòng chọn file và lớp học', 'error');
            return;
        }

        setImporting(true);
        try {
            const result = await adminApi.importStudents(parseInt(importClassId), importFile);
            setImportResult({
                success: result.success_count,
                errors: result.errors
            });
            if (result.success_count > 0) {
                showToast(`Đã import ${result.success_count} học sinh`, 'success');
                fetchData();
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi import', 'error');
        } finally {
            setImporting(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', class_id: '' });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            class_id: user.class_id ? user.class_id.toString() : ''
        });
        setShowModal(true);
    };

    // Filter
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = filterClass === 'all' || (s.class_id && s.class_id.toString() === filterClass);
        return matchesSearch && matchesClass;
    });

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
                    <h1 className={styles.pageTitle}>Quản lý Học sinh</h1>
                    <p className={styles.pageSubtitle}>{students.length} học sinh trong hệ thống</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className={styles.btnSecondary} onClick={() => setShowImportModal(true)}>
                        <Upload size={18} /> Import Excel
                    </button>
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={18} /> Thêm Học sinh
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm học sinh..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.searchWrapper} style={{ maxWidth: '200px' }}>
                    <Filter className={styles.searchIcon} size={18} />
                    <select
                        className={styles.filterSelect}
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="all">Tất cả các lớp</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Học sinh</th>
                            <th>Lớp học</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className={styles.emptyState}>Đang tải...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={4} className={styles.emptyState}>
                                    <div className={styles.emptyIcon}><GraduationCap /></div>
                                    <p className={styles.emptyTitle}>Không tìm thấy học sinh nào</p>
                                    <p className={styles.emptyMessage}>Hãy thử tìm kiếm từ khóa khác hoặc thêm mới</p>
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((student) => {
                                const initials = student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                    <tr key={student.id}>
                                        <td>
                                            <div className={styles.userRow}>
                                                <div className={styles.avatarGreen}>{initials}</div>
                                                <div>
                                                    <div className={styles.userRowName}>{student.name}</div>
                                                    <div className={styles.badgeGreen} style={{ marginTop: '4px', fontSize: '10px' }}>Student</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {student.class_name ? (
                                                <span className={styles.badgePurple}>{student.class_name}</span>
                                            ) : (
                                                <span className={styles.badgeMuted}>Chưa xếp lớp</span>
                                            )}
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Mail size={14} /> {student.email}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    onClick={() => openEditModal(student)}
                                                    title="Sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.btnIcon} ${styles.btnIconWarning}`}
                                                    onClick={() => setShowResetConfirm({ id: student.id, name: student.name })}
                                                    title="Đặt lại mật khẩu"
                                                >
                                                    <KeyRound size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                                                    onClick={() => setShowConfirm({ id: student.id, name: student.name })}
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
                                {editingUser ? 'Cập nhật Học sinh' : 'Thêm Học sinh mới'}
                            </h2>
                            <button className={styles.btnIcon} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Họ và tên</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.formInput}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Họ tên học sinh"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input
                                    type="email"
                                    required
                                    className={styles.formInput}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Lớp học</label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                >
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
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
                                    {editingUser ? 'Lưu thay đổi' : 'Tạo học sinh'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import Excel */}
            {showImportModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ width: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Import Học sinh từ Excel</h2>
                            <button className={styles.btnIcon} onClick={() => { setShowImportModal(false); setImportResult(null); }}>
                                <X size={20} />
                            </button>
                        </div>

                        {!importResult ? (
                            <form onSubmit={handleImport}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>1. Tải mẫu file import</label>
                                    <button type="button" className={styles.btnSecondary} onClick={handleDownloadTemplate} style={{ width: '100%', justifyContent: 'center' }}>
                                        <Download size={18} /> Tải file mẫu .xlsx
                                    </button>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>2. Chọn lớp học cần import</label>
                                    <select
                                        className={styles.formSelect}
                                        required
                                        value={importClassId}
                                        onChange={(e) => setImportClassId(e.target.value)}
                                    >
                                        <option value="">-- Chọn lớp học --</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>3. Upload file danh sách</label>
                                    <div className={styles.uploadArea} onClick={() => document.getElementById('fileInput')?.click()}>
                                        <input
                                            id="fileInput"
                                            type="file"
                                            accept=".xlsx, .xls"
                                            style={{ display: 'none' }}
                                            onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                        <FileSpreadsheet className={styles.uploadIcon} />
                                        {importFile ? (
                                            <div className={styles.uploadFileSelected}>
                                                <span style={{ fontWeight: 500 }}>{importFile.name}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className={styles.uploadText}>Click để chọn file Excel</p>
                                                <p className={styles.uploadSubtext}>Chỉ chấp nhận file .xlsx</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                    <button type="button" className={styles.btnSecondary} onClick={() => setShowImportModal(false)}>
                                        Hủy
                                    </button>
                                    <button type="submit" className={styles.btnPrimary} disabled={importing}>
                                        {importing ? 'Đang xử lý...' : 'Tiến hành Import'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                                        {importResult.success > 0 ? '🎉' : '⚠️'}
                                    </div>
                                    <h3 className={styles.modalTitle}>Kết quả Import</h3>
                                    <p style={{ color: '#94a3b8' }}>
                                        Đã thêm thành công <strong style={{ color: '#10b981' }}>{importResult.success}</strong> học sinh.
                                    </p>
                                </div>

                                {importResult.errors.length > 0 && (
                                    <div className={styles.importResults}>
                                        <h4 style={{ fontSize: '14px', margin: '0 0 8px', color: '#ef4444' }}>Lỗi chi tiết:</h4>
                                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                            {importResult.errors.map((err, idx) => (
                                                <div key={idx} className={styles.importError}>• {err}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                                    <button className={styles.btnPrimary} onClick={() => { setShowImportModal(false); setImportResult(null); }}>
                                        Hoàn tất
                                    </button>
                                </div>
                            </div>
                        )}
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
                            Bạn có chắc chắn muốn xoá học sinh <strong>{showConfirm.name}</strong>?<br />
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

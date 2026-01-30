'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Plus, Trash2, X } from 'lucide-react';

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
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', class_id: '' });

    const fetchData = async () => {
        try {
            const [usersRes, classesRes] = await Promise.all([
                adminApi.getUsers('student'),
                adminApi.getClasses(),
            ]);

            setStudents(usersRes);
            setClasses(classesRes);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'student',
                class_id: formData.class_id ? parseInt(formData.class_id) : null,
            });

            setShowModal(false);
            setFormData({ name: '', email: '', password: '', class_id: '' });
            fetchData();
        } catch (err) {
            console.error('Failed to create:', err);
            alert(err instanceof Error ? err.message : 'Tạo học sinh thất bại');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;

        try {
            await adminApi.deleteUser(id);
            fetchData();
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Xóa học sinh thất bại');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Quản lý Học sinh</h1>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    <Plus size={20} />
                    Thêm Học sinh
                </button>
            </div>

            {/* Table */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Tên</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Email</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Lớp</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    Đang tải...
                                </td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                    Chưa có học sinh nào
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                                        {student.name}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                                        {student.email}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                                        {student.class_name || <span style={{ color: '#d1d5db' }}>Chưa phân lớp</span>}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(student.id)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                backgroundColor: '#fee2e2',
                                                color: '#dc2626',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Thêm Học sinh mới</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                    Họ tên
                                </label>
                                <input
                                    type="text"
                                    required
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
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                    Lớp
                                </label>
                                <select
                                    required
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px',
                                    }}
                                >
                                    <option value="">-- Chọn lớp --</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                }}
                            >
                                Tạo Học sinh
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Smile, Meh, Frown, Users, Mail, X, Check, Send, UserPlus } from 'lucide-react';
import { studentsApi, Student, StudentStats } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const statusConfig = {
    excellent: { label: 'Xuất sắc', bg: '#dcfce7', color: '#16a34a', Icon: Smile },
    good: { label: 'Tốt', bg: '#dbeafe', color: '#2563eb', Icon: Smile },
    attention: { label: 'Cần chú ý', bg: '#fef3c7', color: '#d97706', Icon: Meh },
    warning: { label: 'Cảnh báo', bg: '#fee2e2', color: '#dc2626', Icon: Frown },
};

export default function HocSinhPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStudentName, setInviteStudentName] = useState('');
    const [inviteClassId, setInviteClassId] = useState(1);
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [inviteError, setInviteError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const [studentsData, statsData, classesRes] = await Promise.all([
                    studentsApi.getStudents({ page, page_size: 8, search: search || undefined }),
                    studentsApi.getStats(),
                    fetch(`${API_URL}/api/classes`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                setStudents(studentsData.students);
                setTotal(studentsData.total);
                setStats(statsData);

                if (classesRes.ok) {
                    const classesData = await classesRes.json();
                    setClasses(classesData);
                    if (classesData.length > 0 && inviteClassId === 1) {
                        setInviteClassId(classesData[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setStudents([]);
                setStats({ total: 0, excellent: 0, good: 0, attention: 0, warning: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [page, search]);

    const [classes, setClasses] = useState<any[]>([]);

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setInviting(true);
        setInviteError('');
        setInviteSuccess(false);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/invitations/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    class_id: inviteClassId,
                    student_name: inviteStudentName || null,
                }),
            });

            console.log('Sending invite with token:', token ? token.substring(0, 20) + '...' : 'NONE');

            const data = await response.json();

            if (response.ok) {
                setInviteSuccess(true);
                setTimeout(() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteStudentName('');
                    setInviteSuccess(false);
                }, 2000);
            } else {
                console.error('Invite failed:', data);
                setInviteError(data.detail || `Lỗi server: ${response.status} ${response.statusText}`);
            }
        } catch (err: any) {
            console.error('Failed to send invite:', err);
            setInviteError(`Lỗi kết nối đến ${API_URL}: ${err.message || 'Không thể kết nối'}`);
        } finally {
            setInviting(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Học sinh</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Theo dõi và quản lý học sinh</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '14px 24px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white', fontWeight: 600, fontSize: '14px',
                        border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                    }}
                >
                    <UserPlus style={{ height: '20px', width: '20px' }} />
                    Mời học sinh
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { icon: Users, label: 'Tổng số', value: stats?.total || 0, color: '#3b82f6', bg: '#dbeafe' },
                    { icon: Smile, label: 'Sôi nổi', value: (stats?.excellent || 0) + (stats?.good || 0), color: '#22c55e', bg: '#dcfce7' },
                    { icon: Meh, label: 'Cần chú ý', value: stats?.attention || 0, color: '#f59e0b', bg: '#fef3c7' },
                    { icon: Frown, label: 'Cảnh báo', value: stats?.warning || 0, color: '#ef4444', bg: '#fee2e2' },
                ].map((stat) => (
                    <div key={stat.label} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: stat.bg }}>
                                <stat.icon style={{ height: '24px', width: '24px', color: stat.color }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{stat.label}</p>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', height: '20px', width: '20px', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm học sinh theo tên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: '48px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' }}
                    />
                </div>
            </div>

            {/* Students Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', margin: '0 auto', border: '4px solid #e5e7eb', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : students.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <Users style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 16px' }} />
                        <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>Chưa có học sinh nào trong lớp</p>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                            Mời học sinh đầu tiên
                        </button>
                    </div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb' }}>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Học sinh</th>
                                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Lớp</th>
                                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Sôi nổi</th>
                                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Gắn kết</th>
                                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Tinh thần</th>
                                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>Trạng thái</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const status = statusConfig[student.status];
                                    const StatusIcon = status.Icon;
                                    return (
                                        <tr key={student.id} style={{ borderTop: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                                        {getInitials(student.name)}
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: '#111827' }}>{student.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#374151' }}>
                                                    {student.class_id === 1 ? '10A' : student.class_id === 2 ? '10B' : student.class_id === 3 ? '11A' : student.class_id === 4 ? '11B' : '12A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: getScoreColor(student.happiness_score) }}>{student.happiness_score}%</td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: getScoreColor(student.engagement_score) }}>{student.engagement_score}%</td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: getScoreColor(student.mental_health_score) }}>{student.mental_health_score}%</td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: status.bg, color: status.color }}>
                                                    <StatusIcon style={{ height: '14px', width: '14px' }} /> {status.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                                                    <MoreVertical style={{ height: '16px', width: '16px', color: '#9ca3af' }} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Hiển thị {(page - 1) * 8 + 1}-{Math.min(page * 8, total)} của {total} học sinh</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: page === 1 ? '#d1d5db' : '#6b7280', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                                    Trước
                                </button>
                                <button style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: 'white', backgroundColor: '#22c55e', border: 'none', borderRadius: '8px' }}>{page}</button>
                                <button onClick={() => setPage(p => p + 1)} disabled={page * 8 >= total}
                                    style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, color: page * 8 >= total ? '#d1d5db' : '#6b7280', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: page * 8 >= total ? 'not-allowed' : 'pointer' }}>
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                                    <Mail style={{ width: '24px', height: '24px', color: 'white' }} />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Mời học sinh</h2>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', cursor: 'pointer' }}>
                                <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                            </button>
                        </div>

                        {inviteSuccess ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Check style={{ width: '32px', height: '32px', color: 'white' }} />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Đã gửi lời mời!</h3>
                                <p style={{ color: '#6b7280' }}>Link tham gia đã được gửi đến <strong>{inviteEmail}</strong></p>
                            </div>
                        ) : (
                            <form onSubmit={handleInvite}>
                                <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>
                                    Nhập email của học sinh để gửi lời mời tham gia lớp học. Họ sẽ nhận được link để đăng ký tài khoản.
                                </p>

                                {inviteError && (
                                    <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', marginBottom: '20px', fontSize: '14px' }}>
                                        {inviteError}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Email học sinh <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="example@gmail.com"
                                            required
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Tên học sinh <span style={{ color: '#9ca3af', fontWeight: 400 }}>(tùy chọn)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={inviteStudentName}
                                            onChange={(e) => setInviteStudentName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                            Lớp
                                        </label>
                                        <select
                                            value={inviteClassId}
                                            onChange={(e) => setInviteClassId(parseInt(e.target.value))}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', cursor: 'pointer' }}
                                        >
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                            {classes.length === 0 && <option value={0}>Không có lớp</option>}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                                    <button type="button" onClick={() => setShowInviteModal(false)}
                                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: 'white', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={inviting || !inviteEmail.trim()}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: inviting || !inviteEmail.trim() ? '#d1d5db' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: inviting || !inviteEmail.trim() ? 'not-allowed' : 'pointer' }}>
                                        <Send size={18} />
                                        {inviting ? 'Đang gửi...' : 'Gửi lời mời'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

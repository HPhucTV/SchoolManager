'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Video, Users, Calendar, Bell, Upload, X, Check, Copy, LayoutDashboard, FileText, Brain } from 'lucide-react';
import MoodBoard from '@/components/class-details/MoodBoard';
import ClassTemperature from '@/components/class-details/ClassTemperature';
import ActivityTimeline from '@/components/class-details/ActivityTimeline';
import ClassAssignments from '@/components/classes/ClassAssignments';
import ClassQuizzes from '@/components/classes/ClassQuizzes';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

import { API_URL } from '@/lib/api';

export default function ClassDetailsPage() {
    const params = useParams();

    const { token } = useAuth();
    const classId = params.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [classData, setClassData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [students, setStudents] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Tabs state
    const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'quizzes'>('overview');

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ name: '', grade: '', online_enabled: false });
    const [saving, setSaving] = useState(false);

    // Notification Modal State
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [notifData, setNotifData] = useState({ title: '', message: '', type: 'system', recipient_type: 'class' });
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [notifFile, setNotifFile] = useState<File | null>(null);
    const [sendingNotif, setSendingNotif] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [classRes, studentsRes, timelineRes] = await Promise.all([
                fetch(`${API_URL}/api/classes/${classId}`, { headers }),
                fetch(`${API_URL}/api/classes/${classId}/students`, { headers }),
                fetch(`${API_URL}/api/classes/${classId}/timeline`, { headers })
            ]);

            if (classRes.ok) {
                const data = await classRes.json();
                setClassData(data);
            }
            if (studentsRes.ok) setStudents(await studentsRes.json());
            if (timelineRes.ok) setTimeline(await timelineRes.json());

        } catch (error) {
            console.error('Failed to fetch class data:', error);
        } finally {
            setLoading(false);
        }
    }, [token, classId]);

    useEffect(() => {
        if (token && classId) {
            fetchData();
        }
    }, [token, classId, fetchData]);

    const handleEditClick = () => {
        if (classData) {
            setEditData({
                name: classData.name,
                grade: classData.grade,
                online_enabled: classData.online_enabled || false
            });
            setShowEditModal(true);
        }
    };

    const handleUpdateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editData.name) return;

        try {
            setSaving(true);
            const response = await fetch(`${API_URL}/api/classes/${classId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            if (response.ok) {
                const updatedClass = await response.json();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setClassData((prev: any) => ({ ...prev, ...updatedClass }));
                setShowEditModal(false);
                toast.success('Cập nhật thành công!');
            } else {
                toast.error('Không thể cập nhật lớp học');
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Lỗi kết nối');
        } finally {
            setSaving(false);
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSendingNotif(true);
            const formData = new FormData();
            formData.append('title', notifData.title);
            formData.append('message', notifData.message);
            formData.append('type', notifData.type);
            formData.append('class_id', classId as string);
            formData.append('recipient_type', notifData.recipient_type);

            if (notifData.recipient_type === 'specific') {
                if (selectedStudents.length === 0) {
                    toast.error('Vui lòng chọn ít nhất một học sinh');
                    setSendingNotif(false);
                    return;
                }
                formData.append('student_ids', selectedStudents.join(','));
            }

            if (notifFile) {
                formData.append('file', notifFile);
            }

            const response = await fetch(`${API_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                toast.success('Gửi thông báo thành công!');
                setShowNotifModal(false);
                setNotifData({ title: '', message: '', type: 'system', recipient_type: 'class' });
                setSelectedStudents([]);
                setNotifFile(null);
            } else {
                toast.error('Lỗi khi gửi thông báo');
            }
        } catch (error) {
            console.error('Send notification failed:', error);
            toast.error('Lỗi kết nối');
        } finally {
            setSendingNotif(false);
        }
    };

    const toggleStudentSelection = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    if (loading && !classData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!classData) {
        return <div>Không tìm thấy lớp học</div>;
    }

    return (
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '24px' }}>
                <Link href="/teacher/lop-hoc" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', textDecoration: 'none', marginBottom: '16px', fontWeight: 500 }}>
                    <ArrowLeft size={20} /> Quay lại danh sách
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
                                {classData.name}
                            </h1>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#1e40af', fontSize: '14px', fontWeight: 600 }}>
                                Khối {classData.grade}
                            </span>
                            {classData.online_enabled && (
                                <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#94a3b8', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#14b8a6' }}></div>
                                    Lớp Online
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#94a3b8', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={18} />
                                <span>{students.length} Học sinh</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={18} />
                                <span>Học kỳ 1</span>
                            </div>
                            {classData.class_code && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '6px 12px', borderRadius: '8px',
                                    border: '1px dashed #6366f1'
                                }}>
                                    <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Mã lớp:</span>
                                    <strong style={{ fontSize: '16px', color: '#818cf8', fontFamily: 'monospace' }}>{classData.class_code}</strong>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(classData.class_code);
                                            toast.success('Đã sao chép mã lớp');
                                        }}
                                        title="Sao chép mã lớp"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Online Class Controls */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {classData.online_enabled ? (
                                <>
                                    <a
                                        href={classData.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 16px', borderRadius: '12px',
                                            backgroundColor: '#2563eb', color: 'white',
                                            fontWeight: 600, border: 'none', cursor: 'pointer',
                                            textDecoration: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                                        }}
                                    >
                                        <Video size={18} /> Vào lớp
                                    </a>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Kết thúc buổi học online? Học sinh sẽ không thể vào lớp nữa.')) {
                                                try {
                                                    const response = await fetch(`${API_URL}/api/classes/${classId}`, {
                                                        method: 'PUT',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({
                                                            ...classData,
                                                            online_enabled: false
                                                        })
                                                    });
                                                    if (response.ok) {
                                                        const updated = await response.json();
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        setClassData((prev: any) => ({ ...prev, ...updated }));
                                                        toast.success('Đã kết thúc buổi học!');
                                                    } else {
                                                        toast.error('Lỗi khi kết thúc buổi học');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error('Lỗi kết nối');
                                                }
                                            }
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 16px', borderRadius: '12px',
                                            backgroundColor: 'transparent', color: '#ef4444',
                                            fontWeight: 600, border: '1px solid #ef4444', cursor: 'pointer',
                                        }}
                                    >
                                        <Video size={18} /> Kết thúc
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(`${API_URL}/api/classes/${classId}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({
                                                    ...classData,
                                                    online_enabled: true
                                                })
                                            });
                                            if (response.ok) {
                                                const updated = await response.json();
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                setClassData((prev: any) => ({ ...prev, ...updated }));
                                                toast.success('Lớp học Online đã bắt đầu!');
                                            } else {
                                                toast.error('Lỗi khi bắt đầu lớp học');
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Lỗi kết nối');
                                        }
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', borderRadius: '12px',
                                        backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#059669', // Changed color to green
                                        fontWeight: 600, border: '1px solid rgba(52, 211, 153, 0.3)', cursor: 'pointer',
                                        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <Video size={18} /> Bắt đầu lớp Online
                                </button>
                            )}
                            <button
                                onClick={() => setShowNotifModal(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', borderRadius: '12px',
                                    backgroundColor: '#6366f1', color: 'white',
                                    fontWeight: 600, border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                <Bell size={18} /> Gửi thông báo
                            </button>
                            <button
                                onClick={handleEditClick}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', borderRadius: '12px',
                                    border: '1px solid #334155', backgroundColor: '#1e293b',
                                    color: '#cbd5e1', fontWeight: 600, cursor: 'pointer'
                                }}>
                                <Edit size={18} /> Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs Header */}
                <div style={{
                    display: 'flex', gap: '24px', borderBottom: '1px solid #334155',
                    marginTop: '32px', marginBottom: '32px'
                }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            padding: '12px 4px', background: 'none', border: 'none',
                            color: activeTab === 'overview' ? '#3b82f6' : '#94a3b8',
                            fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                            borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <LayoutDashboard size={18} /> Tổng quan
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        style={{
                            padding: '12px 4px', background: 'none', border: 'none',
                            color: activeTab === 'assignments' ? '#3b82f6' : '#94a3b8',
                            fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                            borderBottom: activeTab === 'assignments' ? '2px solid #3b82f6' : '2px solid transparent',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <FileText size={18} /> Bài tập
                    </button>
                    <button
                        onClick={() => setActiveTab('quizzes')}
                        style={{
                            padding: '12px 4px', background: 'none', border: 'none',
                            color: activeTab === 'quizzes' ? '#3b82f6' : '#94a3b8',
                            fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                            borderBottom: activeTab === 'quizzes' ? '2px solid #3b82f6' : '2px solid transparent',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Brain size={18} /> Bài kiểm tra AI
                    </button>
                </div>

                {/* Main Content Areas */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        {/* Left Column: Mood Board */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <MoodBoard students={students} />
                            {/* Can add more stats charts here later */}
                        </div>

                        {/* Right Column: Temperature & Timeline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ height: '300px' }}>
                                <ClassTemperature score={Number(classData.engagement_score) || 0} label="Nhiệt độ Hứng thú" />
                            </div>
                            <ActivityTimeline activities={timeline} />
                        </div>
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <ClassAssignments classId={Number(classId)} />
                )}

                {activeTab === 'quizzes' && (
                    <ClassQuizzes classId={Number(classId)} />
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '24px', padding: '32px',
                            width: '100%', maxWidth: '500px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Chỉnh sửa lớp học</h2>
                            <form onSubmit={handleUpdateClass}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tên lớp</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Khối lớp</label>
                                    <select
                                        value={editData.grade}
                                        onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                                    >
                                        <option value="10">Khối 10</option>
                                        <option value="11">Khối 11</option>
                                        <option value="12">Khối 12</option>
                                        <option value="Khác">Khối Khác</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #d1d5db', backgroundColor: '#1e293b', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: '#14b8a6', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                    >
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Notification Modal */}
                {showNotifModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '24px', padding: '32px',
                            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Gửi thông báo mới</h2>
                                <button onClick={() => setShowNotifModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSendNotification}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tiêu đề</label>
                                    <input
                                        type="text"
                                        required
                                        value={notifData.title}
                                        onChange={(e) => setNotifData({ ...notifData, title: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }}
                                        placeholder="Nhập tiêu đề thông báo..."
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nội dung</label>
                                    <textarea
                                        required
                                        value={notifData.message}
                                        onChange={(e) => setNotifData({ ...notifData, message: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', minHeight: '100px' }}
                                        placeholder="Nhập nội dung thông báo..."
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Đính kèm tệp (Tùy chọn)</label>
                                    <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                        <button type="button" style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 16px', borderRadius: '8px',
                                            backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer'
                                        }}>
                                            <Upload size={16} /> {notifFile ? notifFile.name : 'Chọn tệp'}
                                        </button>
                                        <input
                                            type="file"
                                            onChange={(e) => setNotifFile(e.target.files ? e.target.files[0] : null)}
                                            style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Gửi đến</label>
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="recipient_type"
                                                value="class"
                                                checked={notifData.recipient_type === 'class'}
                                                onChange={() => setNotifData({ ...notifData, recipient_type: 'class' })}
                                            />
                                            Toàn bộ lớp ({students.length} học sinh)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="recipient_type"
                                                value="specific"
                                                checked={notifData.recipient_type === 'specific'}
                                                onChange={() => setNotifData({ ...notifData, recipient_type: 'specific' })}
                                            />
                                            Chọn học sinh cụ thể
                                        </label>
                                    </div>

                                    {notifData.recipient_type === 'specific' && (
                                        <div style={{
                                            maxHeight: '200px', overflowY: 'auto',
                                            border: '1px solid #334155', borderRadius: '12px', padding: '12px',
                                            backgroundColor: '#0f172a'
                                        }}>
                                            {students.map((student: { id: number; name: string; email: string; avatar?: string }) => (
                                                <div
                                                    key={student.id}
                                                    onClick={() => toggleStudentSelection(student.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                        backgroundColor: selectedStudents.includes(student.id) ? 'rgba(99, 102, 241, 0.2)' : 'transparent'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #64748b',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        backgroundColor: selectedStudents.includes(student.id) ? '#6366f1' : 'transparent',
                                                        borderColor: selectedStudents.includes(student.id) ? '#6366f1' : '#64748b'
                                                    }}>
                                                        {selectedStudents.includes(student.id) && <Check size={14} color="white" />}
                                                    </div>
                                                    <span>{student.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{student.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowNotifModal(false)}
                                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingNotif}
                                        style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: '#6366f1', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                    >
                                        {sendingNotif ? 'Đang gửi...' : 'Gửi thông báo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

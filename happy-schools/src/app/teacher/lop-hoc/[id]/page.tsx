'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Video, Users, Calendar } from 'lucide-react';
import MoodBoard from '@/components/class-details/MoodBoard';
import ClassTemperature from '@/components/class-details/ClassTemperature';
import ActivityTimeline from '@/components/class-details/ActivityTimeline';
import { useAuth } from '@/lib/auth';

import { API_URL } from '@/lib/api';

export default function ClassDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const classId = params.id;

    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ name: '', grade: '', online_enabled: false });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (token && classId) {
            fetchData();
        }
    }, [token, classId]);

    const fetchData = async () => {
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
    };

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
                setClassData((prev: any) => ({ ...prev, ...updatedClass }));
                setShowEditModal(false);
                alert('Cập nhật thành công!');
            } else {
                alert('Không thể cập nhật lớp học');
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert('Lỗi kết nối');
        } finally {
            setSaving(false);
        }
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
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Link href="/teacher/lop-hoc" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', marginBottom: '16px', fontWeight: 500 }}>
                    <ArrowLeft size={20} /> Quay lại danh sách
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: 0 }}>
                                {classData.name}
                            </h1>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '14px', fontWeight: 600 }}>
                                Khối {classData.grade}
                            </span>
                            {classData.online_enabled && (
                                <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                                    Lớp Online
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#4b5563' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={18} />
                                <span>{students.length} Học sinh</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={18} />
                                <span>Học kỳ 1</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {classData.meeting_link ? (
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
                                <Video size={18} /> Vào lớp học Online
                            </a>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (confirm('Bạn có chắc chắn muốn tạo lớp học Online cho lớp này không?')) {
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
                                                setClassData((prev: any) => ({ ...prev, ...updated }));
                                                alert('Đã tạo phòng học Online thành công!');
                                            } else {
                                                alert('Lỗi khi tạo phòng học');
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert('Lỗi kết nối');
                                        }
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', borderRadius: '12px',
                                    backgroundColor: '#dcfce7', color: '#166534',
                                    fontWeight: 600, border: '1px solid #bbf7d0', cursor: 'pointer',
                                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <Video size={18} /> Tạo lớp Online
                            </button>
                        )}
                        <button
                            onClick={handleEditClick}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 16px', borderRadius: '12px',
                                border: '1px solid #e5e7eb', backgroundColor: 'white',
                                color: '#374151', fontWeight: 600, cursor: 'pointer'
                            }}>
                            <Edit size={18} /> Chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
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
            {/* Edit Modal */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '24px', padding: '32px',
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
                                    style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #d1d5db', backgroundColor: 'white', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: '#22c55e', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

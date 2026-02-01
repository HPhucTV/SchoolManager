'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Video, VideoOff, Users, Calendar, Clock } from 'lucide-react';
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

            if (classRes.ok) setClassData(await classRes.json());
            if (studentsRes.ok) setStudents(await studentsRes.json());
            if (timelineRes.ok) setTimeline(await timelineRes.json());

        } catch (error) {
            console.error('Failed to fetch class data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/classes/${classId}/start-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const res = await response.json();
                router.push(`/meeting/${res.room_name}`);
            } else {
                alert('Không thể bắt đầu lớp học.');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi kết nối.');
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!confirm('Bạn có chắc chắn muốn kết thúc lớp học trực tuyến?')) return;
        try {
            const response = await fetch(`${API_URL}/api/classes/${classId}/end-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Refresh data
                setClassData((prev: any) => ({ ...prev, is_online_session_active: false, online_session_url: null }));
            } else {
                alert('Lỗi khi kết thúc lớp học.');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi kết nối.');
        }
    };

    const handleJoinSession = () => {
        if (classData?.online_session_url) {
            router.push(`/meeting/${classData.online_session_url}`);
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
                <Link href="/lop-hoc" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', marginBottom: '16px', fontWeight: 500 }}>
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
                        {classData.is_online_session_active ? (
                            <>
                                <button
                                    onClick={handleJoinSession}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', borderRadius: '12px',
                                        backgroundColor: '#dcfce7', color: '#166534',
                                        fontWeight: 600, border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <Video size={18} /> Vào lớp ngay
                                </button>
                                <button
                                    onClick={handleEndSession}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', borderRadius: '12px',
                                        backgroundColor: '#fee2e2', color: '#991b1b',
                                        fontWeight: 600, border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <VideoOff size={18} /> Kết thúc
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleStartSession}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', borderRadius: '12px',
                                    backgroundColor: '#2563eb', color: 'white',
                                    fontWeight: 600, border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                                }}
                            >
                                <Video size={18} /> Bắt đầu Thảo luận
                            </button>
                        )}
                        <button style={{
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
        </div>
    );
}

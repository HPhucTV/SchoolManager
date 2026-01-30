'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import MoodBoard from '@/components/class-details/MoodBoard';
import ClassTemperature from '@/components/class-details/ClassTemperature';
import ActivityTimeline from '@/components/class-details/ActivityTimeline';
import { api } from '@/lib/api';

export default function ClassDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const classId = Number(params.id);

    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!classId) return;

        const fetchData = async () => {
            try {
                // Fetch class info, students, and timeline in parallel
                const [cls, stus, evts] = await Promise.all([
                    api.get<any>(`/api/classes/${classId}`),
                    api.get<any[]>(`/api/classes/${classId}/students`),
                    api.get<any[]>(`/api/classes/${classId}/timeline`),
                ]);

                setClassData(cls);
                setStudents(stus);
                setTimeline(evts);
            } catch (err: any) {
                console.error('Failed to fetch class details:', err);
                setError('Không thể tải thông tin lớp học. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#22c55e',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>{error}</p>
                <button onClick={() => router.back()} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e5e7eb', cursor: 'pointer' }}>
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        border: 'none', background: 'transparent',
                        color: '#6b7280', fontSize: '14px', fontWeight: 500,
                        cursor: 'pointer', marginBottom: '16px'
                    }}
                >
                    <ArrowLeft size={16} /> Quay lại Dashboard
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: 0, marginBottom: '8px' }}>
                            {classData?.name}
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>
                            Giáo viên chủ nhiệm: <span style={{ fontWeight: 600, color: '#374151' }}>{classData?.teacher_name || 'Tôi'}</span>
                        </p>
                    </div>
                    {/* Add Edit/Settings button if needed later */}
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
                        <ClassTemperature score={Number(classData?.engagement_score) || 0} label="Nhiệt độ Hứng thú" />
                    </div>
                    <ActivityTimeline activities={timeline} />
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TimetableGrid, { ScheduleItem } from '@/components/schedule/TimetableGrid';
import { API_URL } from '@/lib/api';

export default function StudentTimetablePage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await fetch(`${API_URL}/api/schedules/my-schedule`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSchedules(data);
                }
            } catch (error) {
                console.error('Error fetching schedule:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchSchedule();
    }, [token]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            padding: '24px',
            color: '#e2e8f0'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        marginBottom: '24px', fontSize: '14px', fontWeight: 600
                    }}
                >
                    <ArrowLeft size={18} /> Quay lại
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#3b82f6'
                    }}>
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'white' }}>
                            Thời khóa biểu
                        </h1>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
                            Lớp {user?.class_name || '...'} | Năm học 2025-2026
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                    </div>
                ) : (
                    <TimetableGrid schedules={schedules} />
                )}
            </div>
        </div>
    );
}

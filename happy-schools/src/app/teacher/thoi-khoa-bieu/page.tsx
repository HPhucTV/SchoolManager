'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Calendar, Plus, X, Save, BookOpen, Clock, Layers } from 'lucide-react';
import TimetableGrid, { ScheduleItem } from '@/components/schedule/TimetableGrid';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

const TIME_SLOTS_MAP: Record<string, string> = {
    '07:00': '07:45', '07:50': '08:35', '08:40': '09:25', '09:35': '10:20', '10:25': '11:10',
    '13:00': '13:45', '13:50': '14:35', '14:40': '15:25', '15:35': '16:20', '16:25': '17:10',
};

const SUBJECTS = [
    { value: 'Toán', emoji: '📐' },
    { value: 'Văn', emoji: '📚' },
    { value: 'Anh', emoji: '🌍' },
    { value: 'Lý', emoji: '⚡' },
    { value: 'Hóa', emoji: '🧪' },
    { value: 'Sinh', emoji: '🧬' },
    { value: 'Sử', emoji: '🏛️' },
    { value: 'Địa', emoji: '🌏' },
    { value: 'GDCD', emoji: '⚖️' },
    { value: 'Tin', emoji: '💻' },
    { value: 'Công nghệ', emoji: '🔧' },
    { value: 'Thể dục', emoji: '🏃' },
    { value: 'QPAN', emoji: '🎖️' },
];

export default function TeacherSchedulePage() {
    const { token, user } = useAuth();
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        day: '',
        dayLabel: '',
        startTime: '',
        endTime: '',
        subject: '',
        room: '',
    });

    useEffect(() => {
        if (token) fetchSchedule();
    }, [token]);

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

    const dayLabels: Record<string, string> = {
        'Monday': 'Thứ 2', 'Tuesday': 'Thứ 3', 'Wednesday': 'Thứ 4',
        'Thursday': 'Thứ 5', 'Friday': 'Thứ 6', 'Saturday': 'Thứ 7',
    };

    const handleCellClick = (day: string, startTime: string) => {
        const endTime = TIME_SLOTS_MAP[startTime] || '';
        setFormData({
            day,
            dayLabel: dayLabels[day] || day,
            startTime,
            endTime,
            subject: '',
            room: '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.subject) {
            toast.error('Vui lòng chọn môn học');
            return;
        }

        try {
            const tempClassId = (schedules.length > 0 ? schedules[0].class_id : 1) || 1;
            const response = await fetch(`${API_URL}/api/schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: formData.subject,
                    day_of_week: formData.day,
                    start_time: formData.startTime,
                    end_time: formData.endTime,
                    room: formData.room,
                    teacher_id: user?.id,
                    class_id: tempClassId
                })
            });

            if (response.ok) {
                toast.success(`Đã thêm ${formData.subject} vào ${formData.dayLabel}`);
                setShowModal(false);
                fetchSchedule();
            } else {
                toast.error('Lỗi khi thêm lịch');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kết nối');
        }
    };

    const handleDelete = async (item: ScheduleItem) => {
        if (!confirm(`Xóa "${item.subject}" khỏi lịch?`)) return;
        try {
            const response = await fetch(`${API_URL}/api/schedules/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success(`Đã xóa ${item.subject}`);
                fetchSchedule();
            } else {
                toast.error('Lỗi khi xóa');
            }
        } catch {
            toast.error('Lỗi kết nối');
        }
    };

    // Summary stats
    const totalLessons = schedules.length;
    const uniqueSubjects = new Set(schedules.map(s => s.subject)).size;
    const morningLessons = schedules.filter(s => parseInt(s.start_time) < 12).length;
    const afternoonLessons = totalLessons - morningLessons;

    const stats = [
        { icon: BookOpen, label: 'Tổng tiết', value: totalLessons, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
        { icon: Layers, label: 'Môn dạy', value: uniqueSubjects, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
        { icon: Calendar, label: 'Buổi sáng', value: `${morningLessons} tiết`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { icon: Clock, label: 'Buổi chiều', value: `${afternoonLessons} tiết`, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            padding: '20px',
            color: '#e2e8f0'
        }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                        }}>
                            <Calendar size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'white' }}>
                                Thời khóa biểu
                            </h1>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>
                                Quản lý lịch giảng dạy hàng tuần
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ day: '', dayLabel: '', startTime: '', endTime: '', subject: '', room: '' });
                            setShowModal(true);
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 18px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '13px',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Plus size={16} /> Thêm tiết
                    </button>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
                    marginBottom: '20px',
                }}>
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} style={{
                                background: '#131c31',
                                border: '1px solid rgba(51, 65, 85, 0.5)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: stat.bg, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={18} color={stat.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>{stat.value}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{stat.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Timetable Grid */}
                {loading ? (
                    <div style={{
                        textAlign: 'center', padding: '60px',
                        background: '#131c31', borderRadius: '16px',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                    }}>
                        <div style={{
                            width: '36px', height: '36px', border: '3px solid #334155',
                            borderTopColor: '#3b82f6', borderRadius: '50%',
                            margin: '0 auto', animation: 'spin 0.8s linear infinite',
                        }} />
                        <p style={{ color: '#64748b', marginTop: '12px', fontSize: '13px' }}>Đang tải lịch...</p>
                    </div>
                ) : (
                    <TimetableGrid
                        schedules={schedules}
                        editable={true}
                        onCellClick={handleCellClick}
                        onDeleteItem={handleDelete}
                    />
                )}
            </div>

            {/* Add Schedule Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px',
                        width: '420px', maxWidth: '95vw',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(51, 65, 85, 0.6)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
                                📅 Thêm tiết học
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{
                                background: 'rgba(100, 116, 139, 0.15)', border: 'none',
                                borderRadius: '8px', padding: '6px', cursor: 'pointer',
                                color: '#94a3b8', display: 'flex',
                            }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '14px' }}>
                            {/* Subject */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Môn học
                                </label>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px',
                                }}>
                                    {SUBJECTS.map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => setFormData({ ...formData, subject: s.value })}
                                            style={{
                                                padding: '8px 4px', borderRadius: '8px',
                                                border: formData.subject === s.value ? '2px solid #3b82f6' : '1px solid #334155',
                                                background: formData.subject === s.value ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                                                color: formData.subject === s.value ? '#60a5fa' : '#94a3b8',
                                                cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                                                transition: 'all 0.15s',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div style={{ fontSize: '16px', marginBottom: '2px' }}>{s.emoji}</div>
                                            {s.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Day selector */}
                            {!formData.dayLabel && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Ngày
                                    </label>
                                    <select
                                        value={formData.day}
                                        onChange={e => setFormData({
                                            ...formData,
                                            day: e.target.value,
                                            dayLabel: ({ 'Monday': 'Thứ 2', 'Tuesday': 'Thứ 3', 'Wednesday': 'Thứ 4', 'Thursday': 'Thứ 5', 'Friday': 'Thứ 6', 'Saturday': 'Thứ 7' } as Record<string, string>)[e.target.value] || ''
                                        })}
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                                            backgroundColor: '#0f172a', color: 'white',
                                            border: '1px solid #334155', fontSize: '13px',
                                        }}
                                    >
                                        <option value="">Chọn ngày...</option>
                                        <option value="Monday">Thứ 2</option>
                                        <option value="Tuesday">Thứ 3</option>
                                        <option value="Wednesday">Thứ 4</option>
                                        <option value="Thursday">Thứ 5</option>
                                        <option value="Friday">Thứ 6</option>
                                        <option value="Saturday">Thứ 7</option>
                                    </select>
                                </div>
                            )}

                            {/* Time */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Bắt đầu
                                    </label>
                                    {formData.startTime ? (
                                        <div style={{
                                            padding: '10px 12px', borderRadius: '10px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            color: '#60a5fa', fontSize: '14px', fontWeight: 600,
                                        }}>
                                            {formData.startTime}
                                        </div>
                                    ) : (
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={e => {
                                                const start = e.target.value;
                                                setFormData({ ...formData, startTime: start, endTime: TIME_SLOTS_MAP[start] || '' });
                                            }}
                                            style={{
                                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                                backgroundColor: '#0f172a', color: 'white',
                                                border: '1px solid #334155', fontSize: '13px',
                                            }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Kết thúc
                                    </label>
                                    {formData.endTime ? (
                                        <div style={{
                                            padding: '10px 12px', borderRadius: '10px',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            color: '#818cf8', fontSize: '14px', fontWeight: 600,
                                        }}>
                                            {formData.endTime}
                                        </div>
                                    ) : (
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                                backgroundColor: '#0f172a', color: 'white',
                                                border: '1px solid #334155', fontSize: '13px',
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Day + Time info tag */}
                            {formData.dayLabel && (
                                <div style={{
                                    padding: '8px 12px', borderRadius: '8px',
                                    background: 'rgba(20, 184, 166, 0.08)',
                                    border: '1px solid rgba(20, 184, 166, 0.2)',
                                    fontSize: '12px', color: '#14b8a6', fontWeight: 500,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <Calendar size={13} />
                                    {formData.dayLabel} • {formData.startTime} – {formData.endTime}
                                </div>
                            )}

                            {/* Room */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Phòng học <span style={{ color: '#475569', fontWeight: 400 }}>(tùy chọn)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.room}
                                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                                    placeholder="VD: P201, Lab Tin..."
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                                        backgroundColor: '#0f172a', color: 'white',
                                        border: '1px solid #334155', fontSize: '13px',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px',
                                    backgroundColor: 'transparent', color: '#94a3b8',
                                    border: '1px solid #334155', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    color: 'white', border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Save size={15} /> Lưu tiết học
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

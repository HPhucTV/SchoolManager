'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Calendar, BookOpen, GraduationCap, Smile, Heart, Brain, FileText, LayoutDashboard, User } from 'lucide-react';
import ClassTemperature from '@/components/class-details/ClassTemperature';
import ClassAssignments from '@/components/classes/ClassAssignments';
import ClassQuizzes from '@/components/classes/ClassQuizzes';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/api';

interface ClassData {
    id: number;
    name: string;
    grade: string;
    teacher_id: number | null;
    teacher_name: string | null;
    student_count: number;
    happiness_score: number;
    engagement_score: number;
    mental_health_score: number;
    meeting_link: string | null;
    class_code: string | null;
    online_enabled: boolean;
    created_at: string | null;
}

interface StudentInfo {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    status: string;
    happiness_score: number;
    engagement_score: number;
    mental_health_score: number;
}

export default function StudentClassDetailPage() {
    const { user, token } = useAuth();
    const classId = user?.class_id;

    const [classData, setClassData] = useState<ClassData | null>(null);
    const [students, setStudents] = useState<StudentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'classmates' | 'assignments' | 'quizzes'>('overview');

    const fetchData = useCallback(async () => {
        if (!classId || !token) return;
        try {
            setLoading(true);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [classRes, studentsRes] = await Promise.all([
                fetch(`${API_URL}/api/classes/${classId}`, { headers }),
                fetch(`${API_URL}/api/classes/${classId}/students`, { headers })
            ]);

            if (classRes.ok) {
                setClassData(await classRes.json());
            }
            if (studentsRes.ok) {
                setStudents(await studentsRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch class data:', error);
        } finally {
            setLoading(false);
        }
    }, [token, classId]);

    useEffect(() => {
        if (token && classId) {
            fetchData();
        } else if (token && !classId) {
            setLoading(false);
        }
    }, [token, classId, fetchData]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; bg: string }> = {
            excellent: { label: 'Xuất sắc', color: '#14b8a6', bg: 'rgba(52, 211, 153, 0.15)' },
            good: { label: 'Tốt', color: '#3b82f6', bg: 'rgba(96, 165, 250, 0.15)' },
            attention: { label: 'Cần cố gắng', color: '#f59e0b', bg: 'rgba(251, 191, 36, 0.15)' },
            warning: { label: 'Cần hỗ trợ', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
        };
        return configs[status] || configs.good;
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!classId || !classData) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
                padding: '24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8'
            }}>
                <BookOpen size={64} color="#64748b" style={{ marginBottom: '16px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                    Chưa tham gia lớp học
                </h2>
                <p style={{ marginBottom: '24px' }}>Bạn cần tham gia lớp học để xem thông tin chi tiết.</p>
                <Link href="/student" style={{
                    padding: '12px 24px', borderRadius: '12px',
                    backgroundColor: '#6366f1', color: 'white',
                    textDecoration: 'none', fontWeight: 600
                }}>
                    Quay lại trang chủ
                </Link>
            </div>
        );
    }

    const tabs = [
        { key: 'overview' as const, label: 'Tổng quan', icon: LayoutDashboard },
        { key: 'classmates' as const, label: 'Bạn cùng lớp', icon: Users },
        { key: 'assignments' as const, label: 'Bài tập', icon: FileText },
        { key: 'quizzes' as const, label: 'Kiểm tra', icon: Brain },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            padding: '24px',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Back Button */}
                <Link href="/student" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    color: '#94a3b8', textDecoration: 'none', marginBottom: '24px',
                    fontWeight: 500, fontSize: '15px',
                    padding: '8px 12px', borderRadius: '10px',
                    transition: 'all 0.2s',
                }}>
                    <ArrowLeft size={20} /> Quay lại trang chủ
                </Link>

                {/* Class Header Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '24px',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(79, 70, 229, 0.3)',
                }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -60, right: -60, width: '200px', height: '200px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: -40, left: -40, width: '160px', height: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <GraduationCap size={28} color="white" />
                                    </div>
                                    <div>
                                        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>
                                            {classData.name}
                                        </h1>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px',
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            fontSize: '13px', fontWeight: 600
                                        }}>
                                            Khối {classData.grade}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={18} style={{ opacity: 0.8 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Giáo viên chủ nhiệm</p>
                                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                                {classData.teacher_name || 'Chưa phân công'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={18} style={{ opacity: 0.8 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Sĩ số</p>
                                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                                {classData.student_count} học sinh
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={18} style={{ opacity: 0.8 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Học kỳ</p>
                                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Học kỳ 1</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: '4px', marginBottom: '24px',
                    backgroundColor: '#1e293b', borderRadius: '16px', padding: '6px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s ease',
                                backgroundColor: activeTab === tab.key ? '#6366f1' : 'transparent',
                                color: activeTab === tab.key ? 'white' : '#94a3b8',
                                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        {/* Left Column: Score Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Score Summary */}
                            <div style={{
                                backgroundColor: '#1e293b', borderRadius: '24px', padding: '28px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '24px', margin: '0 0 24px 0' }}>
                                    📊 Chỉ số lớp học
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {[
                                        { icon: Smile, label: 'Sôi nổi', score: classData.happiness_score, color: '#fbbf24', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.05) 100%)' },
                                        { icon: Heart, label: 'Gắn kết', score: classData.engagement_score, color: '#ec4899', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.05) 100%)' },
                                        { icon: Brain, label: 'Tinh thần', score: classData.mental_health_score, color: '#f97316', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.05) 100%)' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            background: item.gradient,
                                            borderRadius: '16px', padding: '20px', textAlign: 'center',
                                            border: `1px solid ${item.color}20`,
                                        }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                backgroundColor: `${item.color}20`, marginBottom: '12px',
                                            }}>
                                                <item.icon size={24} color={item.color} />
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 4px 0' }}>{item.label}</p>
                                            <p style={{ fontSize: '32px', fontWeight: 800, color: getScoreColor(item.score), margin: 0 }}>
                                                {item.score}%
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div style={{
                                backgroundColor: '#1e293b', borderRadius: '24px', padding: '28px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px 0' }}>
                                    📋 Thống kê nhanh
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    {[
                                        { label: 'Tổng học sinh', value: classData.student_count, icon: Users, color: '#6366f1' },
                                        { label: 'Khối lớp', value: classData.grade, icon: GraduationCap, color: '#14b8a6' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px',
                                            padding: '16px', borderRadius: '14px',
                                            backgroundColor: '#0f172a',
                                        }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '12px',
                                                backgroundColor: `${item.color}20`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <item.icon size={22} color={item.color} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{item.label}</p>
                                                <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Temperature */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ height: '300px' }}>
                                <ClassTemperature score={Number(classData.engagement_score) || 0} label="Nhiệt độ Hứng thú" />
                            </div>

                            {/* Teacher Info Card */}
                            <div style={{
                                backgroundColor: '#1e293b', borderRadius: '24px', padding: '24px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px 0' }}>
                                    👩‍🏫 Giáo viên chủ nhiệm
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <User size={24} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>
                                            {classData.teacher_name || 'Chưa phân công'}
                                        </p>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                                            Giáo viên chủ nhiệm lớp {classData.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'classmates' && (
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '24px', padding: '28px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                                👥 Danh sách bạn cùng lớp ({students.length})
                            </h3>
                        </div>

                        {students.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                <Users size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                                <p>Chưa có học sinh nào trong lớp</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '16px',
                            }}>
                                {students.map(student => {
                                    const statusConfig = getStatusConfig(student.status);
                                    const isMe = student.id === user?.id;

                                    return (
                                        <div key={student.id} style={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '16px',
                                            padding: '20px',
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            border: isMe ? '2px solid #6366f1' : '1px solid #1e293b',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                        }}>
                                            {isMe && (
                                                <div style={{
                                                    position: 'absolute', top: '8px', right: '12px',
                                                    fontSize: '11px', fontWeight: 700, color: '#818cf8',
                                                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                    padding: '2px 8px', borderRadius: '6px',
                                                }}>
                                                    Bạn
                                                </div>
                                            )}
                                            {/* Avatar */}
                                            <div style={{
                                                width: '50px', height: '50px', borderRadius: '50%',
                                                background: student.avatar
                                                    ? `url(${API_URL}${student.avatar}) center/cover`
                                                    : `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}88)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 700, fontSize: '16px',
                                                flexShrink: 0,
                                                border: `3px solid ${statusConfig.color}`,
                                            }}>
                                                {!student.avatar && getInitials(student.name)}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: 0, fontSize: '15px', fontWeight: 600, color: '#e2e8f0',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>
                                                    {student.name}
                                                </p>
                                                <span style={{
                                                    fontSize: '12px', fontWeight: 600,
                                                    color: statusConfig.color,
                                                    backgroundColor: statusConfig.bg,
                                                    padding: '2px 8px', borderRadius: '6px',
                                                    display: 'inline-block', marginTop: '4px',
                                                }}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <ClassAssignments classId={Number(classId)} />
                )}

                {activeTab === 'quizzes' && (
                    <ClassQuizzes classId={Number(classId)} />
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Smile, Heart, Brain, Calendar, CheckCircle, Clock, LogOut, User, Settings, Bell, BellOff, Save, X, Upload, Camera, FileText, ArrowRight, Gamepad2 as GamepadIcon, Video } from 'lucide-react';
import ChatBot from '@/components/ChatBot';
import StudentNotifications from '@/components/StudentNotifications';

import { API_URL } from '@/lib/api';
// const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace('localhost', '127.0.0.1');

interface StudentDashboardData {
    student: {
        name: string;
        happiness_score: number;
        engagement_score: number;
        mental_health_score: number;
        status: string;
    };
    online_session?: {
        active: boolean;
        room_url: string | null;
    };
    recent_activities: Array<{
        id: number;
        title: string;
        type: string;
        status: string;
        scheduled_date: string;
    }>;
    pending_surveys: Array<{
        id: number;
        title: string;
        completed: boolean;
    }>;
}

export default function StudentDashboard() {
    const { user, token, logout } = useAuth();
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);


    // Survey State

    // Survey State
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
    const [submittingSurvey, setSubmittingSurvey] = useState(false);
    const [surveyData, setSurveyData] = useState({
        happiness_rating: 0,
        engagement_rating: 0,
        mental_health_rating: 0,
        feedback: ''
    });

    // Settings State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications'>('profile');
    const [savingSettings, setSavingSettings] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
    });
    const [notificationSettings, setNotificationSettings] = useState({
        quiz_notifications: true,
        activity_notifications: true,
        survey_notifications: true,
        email_notifications: false,
    });

    // Load profile data when modal opens
    useEffect(() => {
        if (showSettingsModal && data?.student) {
            setProfileData({
                name: data?.student?.name || '',
                email: user?.email || '',
                phone: '',
                avatar_url: '',
            });
            // Fetch current avatar
            fetchProfile();
        }
    }, [showSettingsModal, data?.student, user]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/student/profile`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const profile = await response.json();
                setProfileData(prev => ({
                    ...prev,
                    name: profile.name || prev.name,
                    email: profile.email || prev.email,
                    avatar_url: profile.avatar_url || '',
                }));
                if (profile.avatar_url) {
                    setAvatarPreview(`${API_URL}${profile.avatar_url}`);
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('❌ File quá lớn. Tối đa 5MB');
                return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('❌ Chỉ chấp nhận file hình ảnh');
                return;
            }
            setAvatarFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadAvatar = async (): Promise<string | null> => {
        if (!avatarFile) return null;

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', avatarFile);

            const response = await fetch(`${API_URL}/api/student/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                return result.avatar_url;
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            console.error('Avatar upload error:', err);
            throw err;
        } finally {
            setUploadingAvatar(false);
        }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            // Upload avatar if changed
            if (avatarFile) {
                await uploadAvatar();
            }

            // Save profile data
            const response = await fetch(`${API_URL}/api/student/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone,
                })
            });

            if (response.ok) {
                alert('✅ Đã lưu cài đặt thành công!');
                setAvatarFile(null);
                setShowSettingsModal(false);
                // Refresh data
                window.location.reload();
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            alert('❌ Lỗi khi lưu cài đặt');
        } finally {
            setSavingSettings(false);
        }
    };

    const submitSurvey = async () => {
        if (!selectedSurveyId || surveyData.happiness_rating === 0 || surveyData.engagement_rating === 0 || surveyData.mental_health_rating === 0) {
            alert('Vui lòng điền đầy đủ đánh giá (1-5) ⚠️');
            return;
        }

        setSubmittingSurvey(true);
        try {
            const response = await fetch(`${API_URL}/api/student/surveys/${selectedSurveyId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(surveyData)
            });

            if (response.ok) {
                alert('Gửi đánh giá thành công! 🎉');
                setShowSurveyModal(false);
                setSurveyData({ happiness_rating: 0, engagement_rating: 0, mental_health_rating: 0, feedback: '' });
                // Refresh dashboard
                const dashRes = await fetch(`${API_URL}/api/student/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (dashRes.ok) {
                    const newData = await dashRes.json();
                    setData(newData);
                }
            } else {
                const error = await response.json();
                let errorMessage = 'Không thể gửi đánh giá';

                if (error.detail) {
                    if (Array.isArray(error.detail)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        errorMessage = error.detail.map((e: any) => e.msg).join(', ');
                    } else {
                        errorMessage = error.detail;
                    }
                }

                alert(`Lỗi: ${errorMessage}`);
            }
        } catch (err) {
            console.error('Error submitting survey:', err);
            alert('Đã xảy ra lỗi kết nối');
        } finally {
            setSubmittingSurvey(false);
        }
    };


    // Quiz & Assignment State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [assignments, setAssignments] = useState<any[]>([]);
    const [assignmentTab, setAssignmentTab] = useState<'active' | 'history'>('active');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [quizzes, setQuizzes] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch(`${API_URL}/api/student/dashboard`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const dashboardData = await response.json();
                    setData(dashboardData);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchAssignments = async () => {
            try {
                const response = await fetch(`${API_URL}/api/student/assignments`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAssignments(data);
                }
            } catch (err) {
                console.error('Failed to fetch assignments:', err);
            }
        };

        const fetchQuizzes = async () => {
            try {
                const response = await fetch(`${API_URL}/api/student/upcoming-quizzes`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setQuizzes(data);
                }
            } catch (err) {
                console.error('Failed to fetch quizzes:', err);
            }
        };

        if (token) {
            fetchDashboard();
            fetchProfile();
            fetchAssignments();
            fetchQuizzes();
        }
    }, [token]);


    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { label: string; color: string; bg: string }> = {
            excellent: { label: 'Xuất sắc', color: '#0d9488', bg: 'rgba(52, 211, 153, 0.15)' },
            good: { label: 'Tốt', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
            attention: { label: 'Cần cố gắng', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
            warning: { label: 'Cần hỗ trợ', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
        };
        return labels[status] || labels.good;
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const statusInfo = getStatusLabel(data?.student?.status || 'good');

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            padding: '24px',
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: 0 }}>
                            Xin chào, {data?.student?.name || user?.name}! 👋
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                            Chúc em một ngày học tập vui vẻ
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Notifications */}
                        {token && <StudentNotifications token={token} apiUrl={API_URL} />}

                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Settings size={22} color="white" />
                        </button>

                        <button
                            onClick={logout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        >
                            <LogOut size={18} />
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {/* Live Class Banner */}
                {data?.online_session?.active && (
                    <div style={{
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        borderRadius: '24px',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 10px 30px rgba(22, 163, 74, 0.15)',
                        border: '2px solid rgba(52, 211, 153, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        animation: 'pulse 2s infinite'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                backgroundColor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Video size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                                    Lớp học đang diễn ra!
                                </h2>
                                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 500 }}>
                                    Giáo viên đang đợi bạn trong lớp học trực tuyến.
                                </p>
                            </div>
                        </div>
                        <a
                            href={`https://meet.jit.si/${data.online_session.room_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#0d9488',
                                color: 'white',
                                fontWeight: 700,
                                borderRadius: '12px',
                                textDecoration: 'none',
                                boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.4)',
                                display: 'inline-block'
                            }}
                        >
                            Vào học ngay
                        </a>
                        <style jsx>{`
                            @keyframes pulse {
                                0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
                                70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
                                100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Status Card */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '24px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}>
                                {profileData.avatar_url ? (
                                    <img
                                        src={`${API_URL}${profileData.avatar_url}`}
                                        alt="Avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <User size={32} color="white" />
                                )}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                                    {data?.student?.name}
                                </h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Lớp {user?.class_name || '10A'}</p>
                            </div>
                        </div>
                        <span style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                        }}>
                            {statusInfo.label}
                        </span>
                    </div>

                    {/* Scores */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[
                            { icon: Smile, label: 'Sôi nổi', score: data?.student?.happiness_score || 0, color: '#fbbf24' },
                            { icon: Heart, label: 'Gắn kết', score: data?.student?.engagement_score || 0, color: '#ec4899' },
                            { icon: Brain, label: 'Tinh thần', score: data?.student?.mental_health_score || 0, color: '#f97316' },
                        ].map((item) => (
                            <div key={item.label} style={{
                                backgroundColor: '#0f172a',
                                borderRadius: '16px',
                                padding: '20px',
                                textAlign: 'center',
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: `${item.color}20`,
                                    marginBottom: '12px',
                                }}>
                                    <item.icon size={24} color={item.color} />
                                </div>
                                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 4px 0' }}>{item.label}</p>
                                <p style={{
                                    fontSize: '32px',
                                    fontWeight: 800,
                                    color: getScoreColor(item.score),
                                    margin: 0,
                                }}>
                                    {item.score}%
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                    {/* Game Center - NEW */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(248,113,113,0.1) 100%)',
                        border: '2px solid rgba(236, 72, 153, 0.3)',
                        gridColumn: 'span 2' // Make it span full width to emphasize
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f472b6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GamepadIcon size={24} />
                                    Góc Giải Trí
                                </h3>
                                <p style={{ color: '#f9a8d4', marginBottom: '0', maxWidth: '600px' }}>
                                    Thư giãn sau giờ học với các trò chơi thú vị: <b>Lật hình</b>, <b>Giải đố</b>, <b>Nối từ</b> và <b>Ô chữ bí mật</b>!
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Link href="/student/entertain" style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: '#be185d',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(190, 24, 93, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '18px' }}>Play</span>
                                    <ArrowRight size={20} />
                                </Link>
                                <Link href="/student/games/crossword" style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '18px' }}>Ô chữ</span>
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </div>


                    {/* Quizzes */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 139, 250, 0.15)' }}>
                                <Brain size={20} color="#9333ea" />
                            </div>
                            Bài kiểm tra
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {quizzes.length > 0 ? (
                                quizzes.map((quiz) => (
                                    <div key={quiz.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(168, 139, 250, 0.1)',
                                        border: '1px solid rgba(168, 139, 250, 0.3)',
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                                                {quiz.title}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                                {quiz.subject} • {quiz.total_questions} câu
                                            </p>
                                        </div>
                                        {quiz.has_attempted ? (
                                            <span style={{
                                                fontSize: '12px', fontWeight: 600, color: '#0d9488',
                                                backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: '4px 8px', borderRadius: '6px'
                                            }}>
                                                Đã làm
                                            </span>
                                        ) : (
                                            <a
                                                href={`/student/quiz/${quiz.id}`}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                                                    textDecoration: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Làm bài
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                                    Không có bài kiểm tra nào
                                </p>
                            )}
                        </div>
                    </div>


                    {/* Assignments */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(96, 165, 250, 0.15)' }}>
                                    <FileText size={20} color="#2563eb" />
                                </div>
                                Bài tập
                            </h3>

                            <div style={{ display: 'flex', backgroundColor: '#0f172a', padding: '4px', borderRadius: '12px' }}>
                                <button
                                    onClick={() => setAssignmentTab('active')}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                        backgroundColor: assignmentTab === 'active' ? 'white' : 'transparent',
                                        color: assignmentTab === 'active' ? '#111827' : '#6b7280',
                                        boxShadow: assignmentTab === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    Đang diễn ra
                                </button>
                                <button
                                    onClick={() => setAssignmentTab('history')}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                        backgroundColor: assignmentTab === 'history' ? 'white' : 'transparent',
                                        color: assignmentTab === 'history' ? '#111827' : '#6b7280',
                                        boxShadow: assignmentTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    Lịch sử
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(assignmentTab === 'active'
                                ? assignments.filter(a => !a.submitted && !a.deadline_passed)
                                : assignments.filter(a => a.submitted || a.deadline_passed)
                            ).length > 0 ? (
                                (assignmentTab === 'active'
                                    ? assignments.filter(a => !a.submitted && !a.deadline_passed)
                                    : assignments.filter(a => a.submitted || a.deadline_passed)
                                ).map((assignment) => (
                                    <div key={assignment.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: '#0f172a',
                                        border: assignment.submitted ? '1px solid #dcfce7' : (assignment.deadline_passed ? '1px solid #fee2e2' : '1px solid #e5e7eb'),
                                        opacity: assignment.deadline_passed && !assignment.submitted ? 0.7 : 1
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                                                {assignment.title}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                                Hạn nộp: {assignment.deadline ? new Date(assignment.deadline).toLocaleString('vi-VN') : 'Không giới hạn'}
                                            </p>
                                        </div>
                                        {assignment.submitted ? (
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                                                    color: '#0d9488',
                                                    marginBottom: '4px'
                                                }}>
                                                    Đã nộp
                                                </span>
                                                {assignment.graded && (
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0d9488' }}>
                                                        {assignment.score} điểm
                                                    </p>
                                                )}
                                            </div>
                                        ) : assignment.deadline_passed ? (
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                backgroundColor: 'rgba(248, 113, 113, 0.15)',
                                                color: '#f87171',
                                            }}>
                                                Quá hạn
                                            </span>
                                        ) : (
                                            <a
                                                href={`/student/assignment/${assignment.id}`}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                    textDecoration: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Làm bài
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                                    {assignmentTab === 'active' ? 'Không có bài tập cần làm' : 'Chưa có lịch sử bài tập'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                            📅 Hoạt động sắp tới
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data?.recent_activities.slice(0, 4).map((activity) => (
                                <div key={activity.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    backgroundColor: '#0f172a',
                                }}>
                                    <div style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        backgroundColor: activity.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                    }}>
                                        {activity.status === 'completed' ? (
                                            <CheckCircle size={20} color="#16a34a" />
                                        ) : (
                                            <Clock size={20} color="#d97706" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                                            {activity.title}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                                            {activity.type} • {activity.scheduled_date}
                                        </p>
                                    </div>
                                </div>
                            )) || (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                                        Chưa có hoạt động nào
                                    </p>
                                )}
                        </div>
                    </div>

                    {/* Pending Surveys */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
                            📝 Khảo sát
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data?.pending_surveys.length ? (
                                data.pending_surveys.map((survey) => (
                                    <div key={survey.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: '#0f172a',
                                    }}>
                                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0', margin: 0 }}>
                                            {survey.title}
                                        </p>
                                        {survey.completed ? (
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                                                color: '#0d9488',
                                            }}>
                                                Đã làm
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedSurveyId(survey.id);
                                                    setShowSurveyModal(true);
                                                }}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }}>
                                                Làm ngay
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                                    Chưa có khảo sát nào
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Survey Modal */}
            {
                showSurveyModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '24px',
                            padding: '32px',
                            width: '100%',
                            maxWidth: '500px',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                        }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Thực hiện khảo sát</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Happiness */}
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '12px' }}>1. Mức độ sôi nổi trong học tập của em? (1-5)</p>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button key={num}
                                                onClick={() => setSurveyData({ ...surveyData, happiness_rating: num })}
                                                style={{
                                                    width: '40px', height: '40px',
                                                    borderRadius: '50%',
                                                    border: '2px solid',
                                                    borderColor: surveyData.happiness_rating === num ? '#8b5cf6' : '#e5e7eb',
                                                    backgroundColor: surveyData.happiness_rating === num ? '#8b5cf6' : 'white',
                                                    color: surveyData.happiness_rating === num ? 'white' : '#6b7280',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >{num}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Engagement */}
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '12px' }}>2. Em có sự hứng thú trong lớp học không? (1-5)</p>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button key={num}
                                                onClick={() => setSurveyData({ ...surveyData, engagement_rating: num })}
                                                style={{
                                                    width: '40px', height: '40px',
                                                    borderRadius: '50%',
                                                    border: '2px solid',
                                                    borderColor: surveyData.engagement_rating === num ? '#8b5cf6' : '#e5e7eb',
                                                    backgroundColor: surveyData.engagement_rating === num ? '#8b5cf6' : 'white',
                                                    color: surveyData.engagement_rating === num ? 'white' : '#6b7280',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >{num}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mental Health */}
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '12px' }}>3. Tinh thần của em hôm nay thế nào? (1-5)</p>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button key={num}
                                                onClick={() => setSurveyData({ ...surveyData, mental_health_rating: num })}
                                                style={{
                                                    width: '40px', height: '40px',
                                                    borderRadius: '50%',
                                                    border: '2px solid',
                                                    borderColor: surveyData.mental_health_rating === num ? '#8b5cf6' : '#e5e7eb',
                                                    backgroundColor: surveyData.mental_health_rating === num ? '#8b5cf6' : 'white',
                                                    color: surveyData.mental_health_rating === num ? 'white' : '#6b7280',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >{num}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>Chia sẻ thêm (tùy chọn):</p>
                                    <textarea
                                        value={surveyData.feedback}
                                        onChange={(e) => setSurveyData({ ...surveyData, feedback: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '2px solid #e5e7eb'
                                        }}
                                        placeholder="Em có muốn chia sẻ điều gì không?"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button
                                    onClick={() => setShowSurveyModal(false)}
                                    style={{
                                        flex: 1, padding: '14px',
                                        borderRadius: '12px',
                                        backgroundColor: '#0f172a',
                                        color: '#94a3b8',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >Hủy</button>
                                <button
                                    onClick={submitSurvey}
                                    disabled={submittingSurvey}
                                    style={{
                                        flex: 1, padding: '14px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {submittingSurvey ? 'Đang gửi...' : 'Gửi trả lời'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettingsModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '24px',
                            padding: '0',
                            width: '100%',
                            maxWidth: '500px',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '20px 24px',
                                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                            }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: 0 }}>
                                    <Settings style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} size={22} />
                                    Cài đặt
                                </h2>
                                <button onClick={() => setShowSettingsModal(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                    <X size={24} color="white" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
                                <button
                                    onClick={() => setSettingsTab('profile')}
                                    style={{
                                        flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
                                        backgroundColor: settingsTab === 'profile' ? 'white' : '#f9fafb',
                                        color: settingsTab === 'profile' ? '#8b5cf6' : '#6b7280',
                                        fontWeight: 600, fontSize: '14px',
                                        borderBottom: settingsTab === 'profile' ? '3px solid #8b5cf6' : 'none',
                                    }}
                                >
                                    <User size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                    Thông tin cá nhân
                                </button>
                                <button
                                    onClick={() => setSettingsTab('notifications')}
                                    style={{
                                        flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
                                        backgroundColor: settingsTab === 'notifications' ? 'white' : '#f9fafb',
                                        color: settingsTab === 'notifications' ? '#8b5cf6' : '#6b7280',
                                        fontWeight: 600, fontSize: '14px',
                                        borderBottom: settingsTab === 'notifications' ? '3px solid #8b5cf6' : 'none',
                                    }}
                                >
                                    <Bell size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                    Thông báo
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '24px' }}>
                                {settingsTab === 'profile' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Họ và tên</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Email</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Số điện thoại</label>
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                placeholder="0123 456 789"
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>Ảnh đại diện</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                {/* Avatar Preview */}
                                                <div style={{
                                                    width: '80px', height: '80px', borderRadius: '50%',
                                                    backgroundColor: '#0f172a', border: '3px solid #e5e7eb',
                                                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {avatarPreview ? (
                                                        <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={32} color="#9ca3af" />
                                                    )}
                                                </div>
                                                {/* Upload Button */}
                                                <div style={{ flex: 1 }}>
                                                    <input
                                                        type="file"
                                                        id="avatar-upload"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label
                                                        htmlFor="avatar-upload"
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                            padding: '10px 16px', borderRadius: '10px',
                                                            backgroundColor: '#8b5cf6', color: 'white',
                                                            cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                                                        }}
                                                    >
                                                        <Camera size={18} />
                                                        Chọn ảnh
                                                    </label>
                                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                                                        JPG, PNG, GIF. Tối đa 5MB
                                                    </p>
                                                    {avatarFile && (
                                                        <p style={{ fontSize: '12px', color: '#14b8a6', marginTop: '4px' }}>
                                                            ✓ Đã chọn: {avatarFile.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {[
                                            { key: 'quiz_notifications', label: 'Thông báo bài kiểm tra', desc: 'Nhận thông báo khi có bài kiểm tra mới' },
                                            { key: 'activity_notifications', label: 'Thông báo hoạt động', desc: 'Nhận thông báo về các hoạt động sắp tới' },
                                            { key: 'survey_notifications', label: 'Thông báo khảo sát', desc: 'Nhận thông báo khi có khảo sát mới' },
                                            { key: 'email_notifications', label: 'Gửi qua Email', desc: 'Nhận thông báo qua email' },
                                        ].map((item) => (
                                            <div key={item.key} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '14px', backgroundColor: '#0f172a', borderRadius: '12px',
                                            }}>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{item.label}</p>
                                                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings] })}
                                                    style={{
                                                        width: '52px', height: '28px', borderRadius: '14px',
                                                        backgroundColor: notificationSettings[item.key as keyof typeof notificationSettings] ? '#8b5cf6' : '#d1d5db',
                                                        border: 'none', cursor: 'pointer', position: 'relative',
                                                        transition: 'background-color 0.2s ease',
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '22px', height: '22px', borderRadius: '50%',
                                                        backgroundColor: '#1e293b', position: 'absolute', top: '3px',
                                                        left: notificationSettings[item.key as keyof typeof notificationSettings] ? '27px' : '3px',
                                                        transition: 'left 0.2s ease',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                    }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{ display: 'flex', gap: '12px', padding: '20px 24px', borderTop: '1px solid #e5e7eb' }}>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '10px',
                                        backgroundColor: '#0f172a', color: '#94a3b8',
                                        border: 'none', fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={saveSettings}
                                    disabled={savingSettings}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                        color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    }}
                                >
                                    <Save size={16} />
                                    {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* AI Chatbot */}
            <ChatBot />
        </div >
    );
}

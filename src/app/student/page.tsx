/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Keep Link for potential future use or if any part of the modals uses it
import { useAuth } from '@/lib/auth';
import { Smile, Heart, Brain, LogOut, User, Settings, Video, X, Upload, Camera, Bell, BellOff, Save, ArrowRight, Gamepad2 as GamepadIcon, Calendar, BookOpen, Zap } from 'lucide-react';
import ChatBot from '@/components/ChatBot'; // Keep if ChatBot is still used, though not explicitly in new snippet
import StudentNotifications from '@/components/StudentNotifications';
import SubjectCard from '@/components/student/SubjectCard'; // New import

import { API_URL, gamificationApi } from '@/lib/api';
// const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001').replace('localhost', '127.0.0.1');

interface StudentDashboardData {
    student: {
        name: string;
        happiness_score: number;
        engagement_score: number;
        mental_health_score: number;
        status: string;
        class_name?: string;
    };
    online_session?: {
        active: boolean;
        room_url: string | null;
    };
    // Keep stats but remove lists for now
    // The original had recent_activities and pending_surveys, which are removed from this interface
}

interface Subject {
    id: string;
    name: string;
    teacher: string;
    task_count: number;
}

export default function StudentDashboard() {
    const { user, token, logout } = useAuth();
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const [gamStats, setGamStats] = useState<any>(null);

    const [checkInResult, setCheckInResult] = useState<any>(null);


    // Survey State (retained from original)
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
    const [submittingSurvey, setSubmittingSurvey] = useState(false);
    const [surveyData, setSurveyData] = useState({
        happiness_rating: 0,
        engagement_rating: 0,
        mental_health_rating: 0,
        feedback: ''
    });

    // Settings State (retained from original, with some initial values from new snippet)
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

    // Join Class State
    const [showJoinClassModal, setShowJoinClassModal] = useState(false);
    const [joinClassCode, setJoinClassCode] = useState('');
    const [joiningClass, setJoiningClass] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        quiz_notifications: true,
        activity_notifications: true,
        survey_notifications: true,
        email_notifications: false,
    });

    // Load profile data when modal opens (retained from original)
    useEffect(() => {
        if (showSettingsModal && data?.student) {
            setProfileData(prev => ({
                ...prev,
                name: data?.student?.name || '',
                email: user?.email || '',
                phone: '', // Phone is not in data.student, so it remains empty unless fetched
                avatar_url: profileData.avatar_url, // Keep existing avatar_url if available
            }));
            // fetchProfile is now part of the main fetchDashboard, but we need to ensure avatarPreview is set
            if (profileData.avatar_url) {
                setAvatarPreview(`${API_URL}${profileData.avatar_url}`);
            }
        }
    }, [showSettingsModal, data?.student, user, profileData.avatar_url]); // Added profileData.avatar_url to dependencies

    // fetchProfile function (retained from original, slightly modified to avoid re-fetching if already done by main dashboard fetch)
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

    const handleJoinClass = async () => {
        if (!joinClassCode.trim()) {
            alert('Vui lòng nhập mã lớp học');
            return;
        }

        setJoiningClass(true);
        try {
            const response = await fetch(`${API_URL}/api/student/join-class`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ class_code: joinClassCode })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`🎉 ${result.message}`);
                setShowJoinClassModal(false);
                setJoinClassCode('');
                // Refresh dashboard to show new class info/subjects
                window.location.reload();
            } else {
                alert(`❌ ${result.detail || 'Không thể tham gia lớp học'}`);
            }
        } catch (err) {
            console.error('Join class error:', err);
            alert('❌ Lỗi kết nối đến server');
        } finally {
            setJoiningClass(false);
        }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Fetch Dashboard Stats
                const response = await fetch(`${API_URL}/api/student/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const dashboardData = await response.json();
                    setData(dashboardData);
                }

                // Fetch Subjects
                const subjectRes = await fetch(`${API_URL}/api/student/subjects`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (subjectRes.ok) {
                    const subjectData = await subjectRes.json();
                    setSubjects(subjectData);
                }

                // Fetch Profile
                const profileRes = await fetch(`${API_URL}/api/student/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setProfileData(prev => ({ ...prev, ...profile }));
                    if (profile.avatar_url) {
                        setAvatarPreview(`${API_URL}${profile.avatar_url}`);
                    }
                }

                // Fetch Gamification Stats
                try {
                    const gamData = await gamificationApi.getMyStats();
                    setGamStats(gamData);
                } catch (e) {
                    console.error('Failed to fetch gamification stats:', e);
                }

            } catch (err) {
                console.error('Failed to fetch dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDashboard();
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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
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
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px',
                }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: 0 }}>
                            Xin chào, {data?.student?.name || user?.name}! 👋
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                            Chúc em một ngày học tập hiệu quả
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {token && <StudentNotifications token={token} apiUrl={API_URL} />}

                        {/* Join Class Button */}
                        <button
                            onClick={() => setShowJoinClassModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
                            }}
                        >
                            <User size={18} /> Vào lớp ngay
                        </button>
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
                        <button onClick={logout} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                            borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white',
                            border: 'none', cursor: 'pointer', fontWeight: 500
                        }}>
                            <LogOut size={18} /> Đăng xuất
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
                    backgroundColor: '#1e293b', borderRadius: '24px', padding: '24px', marginBottom: '32px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                            }}>
                                {profileData.avatar_url ? (
                                    <img src={`${API_URL}${profileData.avatar_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                            padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600,
                            backgroundColor: statusInfo.bg, color: statusInfo.color,
                        }}>
                            {statusInfo.label}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[
                            { icon: Smile, label: 'Sôi nổi', score: data?.student?.happiness_score || 0, color: '#fbbf24' },
                            { icon: Heart, label: 'Gắn kết', score: data?.student?.engagement_score || 0, color: '#ec4899' },
                            { icon: Brain, label: 'Tinh thần', score: data?.student?.mental_health_score || 0, color: '#f97316' },
                        ].map((item) => (
                            <div key={item.label} style={{
                                backgroundColor: '#0f172a', borderRadius: '16px', padding: '20px', textAlign: 'center',
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

                {/* Gamification Stats Bar */}
                {gamStats && (
                    <div style={{
                        backgroundColor: '#1e293b', borderRadius: '20px', padding: '20px 24px',
                        marginTop: '24px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={20} /> Gamification
                            </h3>
                            <button
                                onClick={async () => {
                                    try {
                                        const result = await gamificationApi.checkIn();
                                        setCheckInResult(result);
                                        // refresh stats
                                        const newStats = await gamificationApi.getMyStats();
                                        setGamStats(newStats);
                                        setTimeout(() => setCheckInResult(null), 4000);
                                    } catch (e) { console.error(e); }
                                }}
                                style={{
                                    padding: '8px 20px',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white', border: 'none', borderRadius: '10px',
                                    cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                🔥 Điểm danh
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                            {[
                                { label: 'Level', value: gamStats.level, icon: '⭐', color: '#f59e0b' },
                                { label: 'XP', value: gamStats.xp, icon: '✨', color: '#8b5cf6' },
                                { label: 'Xu', value: gamStats.coins, icon: '🪙', color: '#f97316' },
                                { label: 'Streak', value: `${gamStats.streak} ngày`, icon: '🔥', color: '#ef4444' },
                                { label: 'Huy hiệu', value: `${gamStats.badges_earned}/${gamStats.total_badges}`, icon: '🏆', color: '#10b981' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    backgroundColor: '#0f172a', borderRadius: '14px', padding: '14px',
                                    textAlign: 'center', border: '1px solid #334155',
                                }}>
                                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        {/* XP Progress bar */}
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                <span>Level {gamStats.level}</span>
                                <span>{gamStats.xp_progress}/100 XP</span>
                                <span>Level {gamStats.level + 1}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px' }}>
                                <div style={{ width: `${gamStats.xp_progress}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '4px', transition: 'width 0.5s' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Check-in Toast */}
                {checkInResult && (
                    <div style={{
                        position: 'fixed', top: '20px', right: '20px',
                        background: checkInResult.already_checked ? '#f59e0b' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white', padding: '16px 24px', borderRadius: '14px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 2000,
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{checkInResult.message}</div>
                        {!checkInResult.already_checked && (
                            <div style={{ fontSize: '13px', marginTop: '4px' }}>+{checkInResult.xp_earned} XP | +{checkInResult.coins_earned} xu {checkInResult.leveled_up ? '| 🎉 LEVEL UP!' : ''}</div>
                        )}
                    </div>
                )}

                {/* Game Center - NEW */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '32px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(248,113,113,0.1) 100%)',
                    border: '2px solid rgba(236, 72, 153, 0.3)',
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

                {/* ✨ New Features Hub */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
                    marginBottom: '32px',
                }}>
                    {[
                        { href: '/student/mood-journal', icon: '💚', label: 'Nhật ký cảm xúc', desc: 'Ghi lại tâm trạng mỗi ngày', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                        { href: '/student/ai-tutor', icon: '🤖', label: 'AI Gia sư', desc: 'Gợi ý & lộ trình cá nhân', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
                        { href: '/student/achievements', icon: '🏆', label: 'Thành tích', desc: 'Huy hiệu, streak & cửa hàng', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                        { href: '/student/quiz-battle', icon: '⚔️', label: 'Quiz Battle', desc: 'Thi đấu kiến thức real-time', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
                    ].map(item => (
                        <Link key={item.href} href={item.href} style={{
                            background: item.gradient, borderRadius: '16px', padding: '20px',
                            color: 'white', textDecoration: 'none',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            transition: 'transform 0.2s', display: 'block',
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{item.label}</div>
                            <div style={{ fontSize: '12px', opacity: 0.85 }}>{item.desc}</div>
                        </Link>
                    ))}
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0 }}>
                            Góc học tập
                        </h2>
                        <Link href="/student/thoi-khoa-bieu" style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                            textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                            <Calendar size={16} /> Thời khóa biểu
                        </Link>
                    </div>

                    {(data?.student?.class_name || user?.class_name) ? (
                        <div style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            borderRadius: '24px',
                            padding: '32px',
                            color: 'white',
                            boxShadow: '0 20px 60px rgba(79, 70, 229, 0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', transform: 'translate(30%, -30%)' }}></div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', transform: 'translate(-30%, 30%)' }}></div>

                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <BookOpen size={32} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Lớp học của bạn</p>
                                        <h3 style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>{data?.student?.class_name || user?.class_name}</h3>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.7 }}>Giáo viên chủ nhiệm</p>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                            {subjects.length > 0 && subjects[0].teacher ? subjects[0].teacher : "Giáo viên"}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.7 }}>Sĩ số</p>
                                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>-- học sinh</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '32px' }}>
                                    <Link href={`/student/lop-hoc`} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '12px 24px', borderRadius: '12px',
                                        backgroundColor: 'white', color: '#4f46e5',
                                        textDecoration: 'none', fontWeight: 700,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        Xem chi tiết lớp học <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px', backgroundColor: '#1e293b', borderRadius: '24px', color: '#94a3b8',
                            border: '2px dashed #334155'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#0f172a',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                            }}>
                                <User size={40} color="#64748b" />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>Chưa tham gia lớp học nào</h3>
                            <p style={{ maxWidth: '400px', margin: '0 auto 24px auto' }}>Bạn cần mã lớp từ giáo viên để tham gia vào lớp học và bắt đầu các hoạt động.</p>
                            <button
                                onClick={() => setShowJoinClassModal(true)}
                                style={{
                                    padding: '12px 24px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                    color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                                    fontSize: '16px'
                                }}
                            >
                                Tham gia lớp ngay
                            </button>
                        </div>
                    )}
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

            {/* Join Class Modal */}
            {
                showJoinClassModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000
                    }}>
                        <div style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '24px',
                            padding: '32px',
                            width: '90%',
                            maxWidth: '400px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: 0 }}>
                                    Tham gia lớp học
                                </h2>
                                <button
                                    onClick={() => setShowJoinClassModal(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>
                                Nhập mã lớp học do giáo viên cung cấp để tham gia vào lớp.
                            </p>

                            <input
                                type="text"
                                placeholder="Nhập mã lớp (Ví dụ: XC92KA)"
                                value={joinClassCode}
                                onChange={(e) => setJoinClassCode(e.target.value.toUpperCase())}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    backgroundColor: '#0f172a',
                                    border: '2px solid #334155',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    marginBottom: '24px',
                                    textAlign: 'center',
                                    letterSpacing: '1px'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowJoinClassModal(false)}
                                    style={{
                                        flex: 1, padding: '14px',
                                        borderRadius: '12px',
                                        backgroundColor: '#334155',
                                        color: '#cbd5e1',
                                        border: 'none', fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleJoinClass}
                                    disabled={joiningClass || !joinClassCode}
                                    style={{
                                        flex: 1, padding: '14px',
                                        borderRadius: '12px',
                                        background: joiningClass ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                        color: 'white',
                                        border: 'none', fontWeight: 600, cursor: joiningClass ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {joiningClass ? 'Đang xử lý...' : 'Tham gia'}
                                    {!joiningClass && <ArrowRight size={18} />}
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

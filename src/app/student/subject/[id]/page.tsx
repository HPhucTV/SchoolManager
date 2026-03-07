/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
    ArrowLeft, Video, BookOpen, FileText, Brain,
    Clock, CheckCircle, AlertCircle, Calendar,
    MessageSquare, ClipboardList, User
} from 'lucide-react';
import { API_URL } from '@/lib/api';

interface SubjectDetails {
    subject: string;
    class_info: {
        meeting_link: string | null;
        online_enabled: boolean;
        teacher_name: string;
        teacher_email?: string;
        teacher_phone?: string;
        teacher_avatar?: string;
    } | null;
    assignments: Array<{
        id: number;
        title: string;
        deadline: string | null;
        status: string;
        score: number | null;
    }>;
    quizzes: Array<{
        id: number;
        title: string;
        total_questions: number;
        has_attempted: boolean;
        score: number | null;
    }>;
    notifications: Array<unknown>;
    surveys: Array<unknown>;
    // ...
}

export default function SubjectPage() {
    const { id } = useParams();
    const subjectName = decodeURIComponent(id as string);
    const { token } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<SubjectDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'quizzes'>('overview');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`${API_URL}/api/student/subjects/${encodeURIComponent(subjectName)}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (err) {
                console.error('Failed to fetch subject details:', err);
            } finally {
                setLoading(false);
            }
        };

        if (token && subjectName) {
            fetchDetails();
        }
    }, [token, subjectName]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0f172a',
            }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ minHeight: '100vh', padding: '40px', background: '#0f172a', color: 'white' }}>
                <p>Không tìm thấy thông tin môn học.</p>
                <button onClick={() => router.back()}>Quay lại</button>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            color: '#e2e8f0',
            paddingBottom: '40px'
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#1e293b',
                padding: '24px',
                borderBottom: '1px solid #334155',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <button
                        onClick={() => router.push('/student')}
                        style={{
                            background: 'none', border: 'none', color: '#94a3b8',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            marginBottom: '16px', fontSize: '14px', fontWeight: 600
                        }}
                    >
                        <ArrowLeft size={18} /> Quay lại Dashboard
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <BookOpen size={32} color="#60a5fa" />
                                {data.subject}
                            </h1>

                            {/* Teacher Info Card */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px',
                                backgroundColor: 'rgba(51, 65, 85, 0.5)', padding: '12px 20px', borderRadius: '16px',
                                border: '1px solid rgba(148, 163, 184, 0.2)'
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    backgroundColor: '#475569', overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {data.class_info?.teacher_avatar ? (
                                        <img src={`${API_URL}${data.class_info.teacher_avatar}`} alt="GV" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={24} color="#94a3b8" />
                                    )}
                                </div>
                                <div>
                                    <p style={{ color: '#e2e8f0', margin: 0, fontWeight: 700, fontSize: '16px' }}>
                                        {data.class_info?.teacher_name || '...'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                        {data.class_info?.teacher_phone && (
                                            <a href={`tel:${data.class_info.teacher_phone}`} style={{
                                                color: '#94a3b8', fontSize: '13px', textDecoration: 'none',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                transition: 'color 0.2s'
                                            }} className="hover:text-blue-400">
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                                                {data.class_info.teacher_phone}
                                            </a>
                                        )}
                                        {data.class_info?.teacher_email && (
                                            <a href={`mailto:${data.class_info.teacher_email}`} style={{
                                                color: '#94a3b8', fontSize: '13px', textDecoration: 'none',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                • {data.class_info.teacher_email}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {data.class_info?.online_enabled && data.class_info.meeting_link && (
                            <a
                                href={data.class_info.meeting_link.startsWith('http') ? data.class_info.meeting_link : `https://${data.class_info.meeting_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    backgroundColor: '#059669', color: 'white',
                                    padding: '12px 24px', borderRadius: '12px',
                                    textDecoration: 'none', fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
                                    animation: 'pulse 2s infinite',
                                    height: 'fit-content',
                                    alignSelf: 'center'
                                }}
                            >
                                <Video size={20} />
                                Vào lớp Online
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #334155' }}>
                    {[
                        { id: 'overview', label: 'Tổng quan', icon: ClipboardList },
                        { id: 'assignments', label: 'Bài tập', icon: FileText },
                        { id: 'quizzes', label: 'Kiểm tra', icon: Brain },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'assignments' | 'quizzes')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 20px',
                                background: 'none', border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid #60a5fa' : '3px solid transparent',
                                color: activeTab === tab.id ? 'white' : '#94a3b8',
                                fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {/* Notifications Placeholder */}
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px',
                            border: '1px solid #334155'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={20} color="#fbbf24" />
                                Thông báo & Nhắc nhở
                            </h3>
                            {data.notifications.length > 0 ? (
                                <div>Let&apos;s list notifications here...</div>
                            ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có thông báo mới từ giáo viên.</p>
                            )}
                        </div>

                        {/* Surveys Placeholder */}
                        <div style={{
                            backgroundColor: '#1e293b', borderRadius: '16px', padding: '24px',
                            border: '1px solid #334155'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={20} color="#f472b6" />
                                Khảo sát ý kiến
                            </h3>
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có khảo sát nào đang mở.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {data.assignments.length > 0 ? (
                            data.assignments.map(assign => (
                                <div key={assign.id} style={{
                                    backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: '1px solid #334155'
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                                            {assign.title}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                Hạn: {assign.deadline ? new Date(assign.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        {assign.status === 'submitted' ? (
                                            <div>
                                                <span style={{ color: '#34d399', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'end' }}>
                                                    <CheckCircle size={14} /> Đã nộp
                                                </span>
                                                {assign.score !== null && (
                                                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                                                        {assign.score} điểm
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <Link href={`/student/assignment/${assign.id}`} style={{
                                                padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white',
                                                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px'
                                            }}>
                                                Làm bài
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                Chưa có bài tập nào.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'quizzes' && (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {data.quizzes.length > 0 ? (
                            data.quizzes.map(quiz => (
                                <div key={quiz.id} style={{
                                    backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: '1px solid #334155'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Brain size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                                                {quiz.title}
                                            </h3>
                                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                                                {quiz.total_questions} câu hỏi
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {quiz.has_attempted ? (
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ color: '#34d399', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'end' }}>
                                                    <CheckCircle size={14} /> Hoàn thành
                                                </span>
                                                {quiz.score !== null && (
                                                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                                                        {quiz.score}%
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <Link href={`/student/quiz/${quiz.id}`} style={{
                                                padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white',
                                                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px'
                                            }}>
                                                Vào kiểm tra
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                Chưa có bài kiểm tra nào.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(5, 150, 105, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
                }
            `}</style>
        </div>
    );
}

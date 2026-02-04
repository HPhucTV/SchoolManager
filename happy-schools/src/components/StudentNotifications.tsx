'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, Calendar, X, Check, ExternalLink } from 'lucide-react';

interface Notification {
    id: string;
    type: 'quiz' | 'event' | 'activity' | 'survey' | 'system';
    title: string;
    message: string;
    time: Date;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    icon?: string;
}

interface Props {
    token: string;
    apiUrl: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function StudentNotifications({ token, apiUrl }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // Fetch upcoming quizzes and activities for student
            const [quizzesRes, dashboardRes] = await Promise.all([
                fetch(`${apiUrl}/api/student/upcoming-quizzes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
                fetch(`${apiUrl}/api/student/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
            ]);

            const newNotifications: Notification[] = [];

            // Parse quizzes
            if (quizzesRes?.ok) {
                const quizzes = await quizzesRes.json();
                quizzes.forEach((quiz: any) => {
                    newNotifications.push({
                        id: `quiz-${quiz.id}`,
                        type: 'quiz',
                        title: 'Bài kiểm tra mới',
                        message: `${quiz.title} - ${quiz.subject}`,
                        time: new Date(quiz.created_at),
                        read: false,
                        actionUrl: `/student/quiz/${quiz.id}`,
                        actionLabel: 'Làm bài',
                        icon: '📝'
                    });
                });
            }

            // Parse activities
            if (dashboardRes?.ok) {
                const data = await dashboardRes.json();
                data.recent_activities?.forEach((activity: any) => {
                    if (activity.status !== 'completed') {
                        newNotifications.push({
                            id: `activity-${activity.id}`,
                            type: 'activity',
                            title: 'Hoạt động sắp diễn ra',
                            message: `${activity.title} - ${activity.type}`,
                            time: new Date(activity.scheduled_date),
                            read: false,
                            icon: '📅'
                        });
                    }
                });

                // Add pending surveys as notifications
                data.pending_surveys?.forEach((survey: any) => {
                    if (!survey.completed) {
                        newNotifications.push({
                            id: `survey-${survey.id}`,
                            type: 'survey',
                            title: 'Khảo sát cần hoàn thành',
                            message: survey.title,
                            time: new Date(),
                            read: false,
                            icon: '📋'
                        });
                    }
                });
            }

            // Add demo notifications if empty
            if (newNotifications.length === 0) {
                newNotifications.push({
                    id: 'demo-1',
                    type: 'system',
                    title: 'Chào mừng! 🎉',
                    message: 'Hệ thống thông báo đã sẵn sàng. Bạn sẽ nhận được thông báo khi có bài kiểm tra hoặc hoạt động mới.',
                    time: new Date(),
                    read: true,
                    icon: '🔔'
                });
            }

            // Sort by time
            newNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());
            setNotifications(newNotifications);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const weeks = Math.floor(days / 7);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút`;
        if (hours < 24) return `${hours} giờ`;
        if (days < 7) return `${days} ngày`;
        return `${weeks} tuần`;
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    // Group notifications
    const recentNotifications = filteredNotifications.filter(n => {
        const diff = new Date().getTime() - n.time.getTime();
        return diff < 86400000; // Less than 24 hours
    });
    const olderNotifications = filteredNotifications.filter(n => {
        const diff = new Date().getTime() - n.time.getTime();
        return diff >= 86400000;
    });

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <Bell size={22} color="white" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #8b5cf6',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '54px',
                    right: '0',
                    width: '380px',
                    maxHeight: '500px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'slideDown 0.2s ease-out',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
                            Thông báo
                        </h3>
                        <button
                            onClick={markAllAsRead}
                            style={{
                                fontSize: '13px',
                                color: '#6366f1',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Đánh dấu đã đọc
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: filter === 'all' ? '#6366f1' : '#f3f4f6',
                                color: filter === 'all' ? 'white' : '#6b7280',
                            }}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: filter === 'unread' ? '#6366f1' : '#f3f4f6',
                                color: filter === 'unread' ? 'white' : '#6b7280',
                            }}
                        >
                            Chưa đọc
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div style={{
                                    width: '32px', height: '32px',
                                    border: '3px solid #e5e7eb',
                                    borderTopColor: '#6366f1',
                                    borderRadius: '50%',
                                    margin: '0 auto',
                                    animation: 'spin 1s linear infinite',
                                }} />
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                <Bell size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p>Không có thông báo nào</p>
                            </div>
                        ) : (
                            <>
                                {/* Recent */}
                                {recentNotifications.length > 0 && (
                                    <div>
                                        <div style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                            Mới
                                        </div>
                                        {recentNotifications.map(notification => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                formatTimeAgo={formatTimeAgo}
                                                onRead={() => markAsRead(notification.id)}
                                                onRemove={() => removeNotification(notification.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Older */}
                                {olderNotifications.length > 0 && (
                                    <div>
                                        <div style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                            Trước đó
                                        </div>
                                        {olderNotifications.map(notification => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                formatTimeAgo={formatTimeAgo}
                                                onRead={() => markAsRead(notification.id)}
                                                onRemove={() => removeNotification(notification.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function NotificationItem({
    notification,
    formatTimeAgo,
    onRead,
    onRemove,
}: {
    notification: Notification;
    formatTimeAgo: (date: Date) => string;
    onRead: () => void;
    onRemove: () => void;
}) {
    const [showActions, setShowActions] = useState(false);

    const typeColors = {
        quiz: { bg: '#dbeafe', color: '#2563eb' },
        event: { bg: '#dcfce7', color: '#16a34a' },
        activity: { bg: '#fef3c7', color: '#d97706' },
        survey: { bg: '#f3e8ff', color: '#7c3aed' },
        system: { bg: '#f3f4f6', color: '#6b7280' },
    };

    const colors = typeColors[notification.type] || typeColors.system;

    return (
        <div
            onClick={onRead}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 20px',
                backgroundColor: notification.read ? 'white' : '#f0f9ff',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.15s ease',
            }}
        >
            {/* Icon */}
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
            }}>
                {notification.icon || '🔔'}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: '14px',
                    color: '#111827',
                    margin: 0,
                    lineHeight: 1.4,
                }}>
                    <strong>{notification.title}</strong>
                    {' '}
                    {notification.message}
                </p>
                <p style={{
                    fontSize: '13px',
                    color: notification.read ? '#9ca3af' : '#6366f1',
                    margin: '4px 0 0 0',
                    fontWeight: notification.read ? 400 : 500,
                }}>
                    {formatTimeAgo(notification.time)}
                </p>

                {/* Action Button */}
                {notification.actionUrl && (
                    <a
                        href={notification.actionUrl}
                        style={{
                            display: 'inline-block',
                            marginTop: '10px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            backgroundColor: '#6366f1',
                            color: 'white',
                            textDecoration: 'none',
                        }}
                    >
                        {notification.actionLabel || 'Xem chi tiết'}
                    </a>
                )}
            </div>

            {/* Unread Indicator / Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!notification.read && (
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                    }} />
                )}
                {showActions && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        style={{
                            padding: '6px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#f3f4f6',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={14} color="#6b7280" />
                    </button>
                )}
            </div>
        </div>
    );
}

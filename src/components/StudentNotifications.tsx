/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, Calendar, X, Check, ExternalLink } from 'lucide-react';
import { API_URL } from '@/lib/api';
import Link from 'next/link';

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

export default function StudentNotifications({ token, apiUrl }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 15 seconds
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
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
        if (!token) return;
        try {
            // Fetch from dedicated notifications API + quizzes + activities
            const [notifRes, quizzesRes, dashboardRes] = await Promise.all([
                fetch(`${apiUrl}/api/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
                fetch(`${apiUrl}/api/student/upcoming-quizzes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
                fetch(`${apiUrl}/api/student/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
            ]);

            const newNotifications: Notification[] = [];

            // Parse real notifications from backend
            if (notifRes?.ok) {
                const data = await notifRes.json();

                data.forEach((n: any) => {
                    const typeMap: Record<string, Notification['type']> = {
                        quiz: 'quiz', activity: 'activity', assignment: 'quiz',
                        survey: 'survey', system: 'system', event: 'event'
                    };
                    const iconMap: Record<string, string> = {
                        quiz: '📝', activity: '📅', assignment: '📄',
                        survey: '📋', system: '🔔', event: '🎉'
                    };
                    newNotifications.push({
                        id: `notif-${n.id}`,
                        type: typeMap[n.type] || 'system',
                        title: n.title,
                        message: n.message,
                        time: new Date(n.created_at),
                        read: n.is_read,
                        actionUrl: n.action_url || undefined,
                        actionLabel: n.action_label || undefined,
                        icon: iconMap[n.type] || '🔔'
                    });
                });
            }

            // Parse quizzes as supplementary notifications
            if (quizzesRes?.ok) {
                const quizzes = await quizzesRes.json();

                quizzes.forEach((quiz: any) => {
                    const exists = newNotifications.some(n => n.id === `notif-quiz-${quiz.id}` || n.message?.includes(quiz.title));
                    if (!exists) {
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
                    }
                });
            }

            // Parse activities
            if (dashboardRes?.ok) {
                const data = await dashboardRes.json();

                data.recent_activities?.forEach((activity: any) => {
                    if (activity.status !== 'completed') {
                        const exists = newNotifications.some(n => n.message?.includes(activity.title));
                        if (!exists) {
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
                    }
                });


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

            // Add demo notification if empty
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
                    backgroundColor: 'rgba(255,255,255,0.1)',
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
                        border: '2px solid #818cf8',
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
                    backgroundColor: '#1e293b',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'slideDown 0.2s ease-out',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
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
                    <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #334155' }}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: filter === 'all' ? '#6366f1' : '#334155',
                                color: filter === 'all' ? 'white' : '#94a3b8',
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
                                backgroundColor: filter === 'unread' ? '#6366f1' : '#334155',
                                color: filter === 'unread' ? 'white' : '#94a3b8',
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
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <Bell size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p>Không có thông báo nào</p>
                            </div>
                        ) : (
                            <>
                                {/* Recent */}
                                {recentNotifications.length > 0 && (
                                    <div>
                                        <div style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
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
                                        <div style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
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
        quiz: { bg: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' },
        event: { bg: 'rgba(52, 211, 153, 0.15)', color: '#0d9488' },
        activity: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' },
        survey: { bg: 'rgba(168, 139, 250, 0.15)', color: '#7c3aed' },
        system: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
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
                backgroundColor: notification.read ? '#1e293b' : 'rgba(99, 102, 241, 0.08)',
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
                    color: '#e2e8f0',
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
                    <Link
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
                    </Link>
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
                            backgroundColor: '#0f172a',
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

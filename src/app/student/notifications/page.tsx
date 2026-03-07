/* eslint-disable */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Bell, Calendar, Check, BookOpen, FileText, ExternalLink } from 'lucide-react';
import { API_URL } from '@/lib/api';
import Link from 'next/link';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
    action_label?: string;
}

export default function StudentNotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchNotifications();
        } else if (token !== undefined) {
            setLoading(false);
        }
    }, [token, fetchNotifications]);

    const markAsRead = async (id: number) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

        try {
            await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'quiz': return <BookOpen className="text-blue-500" />;
            case 'event': return <Calendar className="text-green-500" />;
            case 'activity': return <Calendar className="text-yellow-500" />;
            case 'assignment': return <FileText className="text-purple-500" />;
            default: return <Bell className="text-slate-400" />;
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Bell className="text-indigo-400" />
                        Thông Báo
                    </h1>
                    <button
                        onClick={markAllRead}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Chưa đọc ({notifications.filter(n => !n.is_read).length})
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Đang tải...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Không có thông báo nào</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`
                                    relative p-4 rounded-xl border transition-all hover:translate-x-1
                                    ${notification.is_read
                                        ? 'bg-slate-800/50 border-slate-700/50'
                                        : 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10'}
                                `}
                            >
                                <div className="flex gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center shrink-0
                                        ${notification.is_read ? 'bg-slate-700/50' : 'bg-indigo-500/20'}
                                    `}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-semibold ${notification.is_read ? 'text-slate-300' : 'text-white'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                                {new Date(notification.created_at).toLocaleString('vi-VN')}
                                            </span>
                                        </div>

                                        <p className="text-slate-400 text-sm mb-3 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center gap-4">
                                            {notification.action_url && (
                                                <Link
                                                    href={notification.action_url}
                                                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                >
                                                    Xem chi tiết <ExternalLink size={14} />
                                                </Link>
                                            )}

                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-sm text-slate-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                                >
                                                    <Check size={14} /> Đã đọc
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}



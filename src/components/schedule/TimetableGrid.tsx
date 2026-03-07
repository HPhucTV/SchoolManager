/* eslint-disable */
'use client';

import React from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export interface ScheduleItem {
    id: number;
    subject: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
    teacher_id?: number;
    class_id?: number;
}

interface TimetableGridProps {
    schedules: ScheduleItem[];
    onCellClick?: (day: string, timeSlot: string) => void;
    onItemClick?: (item: ScheduleItem) => void;
    onDeleteItem?: (item: ScheduleItem) => void | Promise<void>;
    editable?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT: Record<string, string> = {
    'Monday': 'T2', 'Tuesday': 'T3', 'Wednesday': 'T4',
    'Thursday': 'T5', 'Friday': 'T6', 'Saturday': 'T7',
};
const DAY_LABELS: Record<string, string> = {
    'Monday': 'Thứ 2', 'Tuesday': 'Thứ 3', 'Wednesday': 'Thứ 4',
    'Thursday': 'Thứ 5', 'Friday': 'Thứ 6', 'Saturday': 'Thứ 7',
};

const MORNING_SLOTS = [
    { start: '07:00', end: '07:45', label: 'Tiết 1', num: 1 },
    { start: '07:50', end: '08:35', label: 'Tiết 2', num: 2 },
    { start: '08:40', end: '09:25', label: 'Tiết 3', num: 3 },
    { start: '09:35', end: '10:20', label: 'Tiết 4', num: 4 },
    { start: '10:25', end: '11:10', label: 'Tiết 5', num: 5 },
];

const AFTERNOON_SLOTS = [
    { start: '13:00', end: '13:45', label: 'Tiết 6', num: 6 },
    { start: '13:50', end: '14:35', label: 'Tiết 7', num: 7 },
    { start: '14:40', end: '15:25', label: 'Tiết 8', num: 8 },
    { start: '15:35', end: '16:20', label: 'Tiết 9', num: 9 },
    { start: '16:25', end: '17:10', label: 'Tiết 10', num: 10 },
];

const SUBJECT_COLORS: Record<string, { bg: string, border: string, text: string, glow: string }> = {
    'Toán': { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', text: '#60a5fa', glow: 'rgba(59, 130, 246, 0.2)' },
    'Văn': { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899', text: '#f472b6', glow: 'rgba(236, 72, 153, 0.2)' },
    'Anh': { bg: 'rgba(168, 85, 247, 0.12)', border: '#a855f7', text: '#c084fc', glow: 'rgba(168, 85, 247, 0.2)' },
    'Lý': { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#34d399', glow: 'rgba(16, 185, 129, 0.2)' },
    'Hóa': { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.2)' },
    'Sinh': { bg: 'rgba(132, 204, 22, 0.12)', border: '#84cc16', text: '#a3e635', glow: 'rgba(132, 204, 22, 0.2)' },
    'Sử': { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#f87171', glow: 'rgba(239, 68, 68, 0.2)' },
    'Địa': { bg: 'rgba(20, 184, 166, 0.12)', border: '#14b8a6', text: '#2dd4bf', glow: 'rgba(20, 184, 166, 0.2)' },
    'GDCD': { bg: 'rgba(99, 102, 241, 0.12)', border: '#6366f1', text: '#818cf8', glow: 'rgba(99, 102, 241, 0.2)' },
    'Tin': { bg: 'rgba(6, 182, 212, 0.12)', border: '#06b6d4', text: '#22d3ee', glow: 'rgba(6, 182, 212, 0.2)' },
    'Công nghệ': { bg: 'rgba(100, 116, 139, 0.12)', border: '#64748b', text: '#94a3b8', glow: 'rgba(100, 116, 139, 0.2)' },
    'Thể dục': { bg: 'rgba(249, 115, 22, 0.12)', border: '#f97316', text: '#fb923c', glow: 'rgba(249, 115, 22, 0.2)' },
    'QPAN': { bg: 'rgba(21, 128, 61, 0.12)', border: '#15803d', text: '#4ade80', glow: 'rgba(21, 128, 61, 0.2)' },
};

const getDefaultColor = () => ({ bg: 'rgba(255, 255, 255, 0.03)', border: '#475569', text: '#cbd5e1', glow: 'transparent' });

// Get current day of week
function getCurrentDay(): string {
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayMap[new Date().getDay()];
}

export default function TimetableGrid({ schedules, onCellClick, onItemClick, onDeleteItem, editable = false }: TimetableGridProps) {
    const currentDay = getCurrentDay();

    const getScheduleForSlot = (day: string, timeSlotStart: string) => {
        return schedules.find(s => s.day_of_week === day && s.start_time === timeSlotStart);
    };

    // Count lessons per day
    const lessonCounts: Record<string, number> = {};
    DAYS.forEach(day => {
        lessonCounts[day] = schedules.filter(s => s.day_of_week === day).length;
    });

    const renderSlotRows = (slots: typeof MORNING_SLOTS) => {
        return slots.map((slot) => (
            <tr key={slot.num}>
                {/* Time column */}
                <td style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                    borderRight: '1px solid rgba(51, 65, 85, 0.5)',
                    textAlign: 'center',
                    width: '80px',
                    background: '#0c1222',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b',
                    }}>
                        <span style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#818cf8',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                        }}>
                            {slot.num}
                        </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                        {slot.start}
                    </div>
                </td>

                {/* Day columns */}
                {DAYS.map(day => {
                    const item = getScheduleForSlot(day, slot.start);
                    const color = item ? (SUBJECT_COLORS[item.subject] || getDefaultColor()) : getDefaultColor();
                    const isToday = day === currentDay;

                    return (
                        <td key={day}
                            onClick={() => !item && editable && onCellClick && onCellClick(day, slot.start)}
                            style={{
                                padding: '4px',
                                borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                                borderRight: '1px solid rgba(51, 65, 85, 0.5)',
                                height: '64px',
                                verticalAlign: 'top',
                                cursor: (editable && !item) ? 'pointer' : item ? 'pointer' : 'default',
                                background: isToday ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                                position: 'relative',
                            }}
                        >
                            {item ? (
                                <div
                                    onClick={(e) => { e.stopPropagation(); if (onItemClick) onItemClick(item); }}
                                    className="schedule-card"
                                    style={{
                                        background: color.bg,
                                        borderLeft: `3px solid ${color.border}`,
                                        borderRadius: '8px',
                                        padding: '8px 10px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        gap: '3px',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        boxShadow: `0 0 0 0 ${color.glow}`,
                                    }}
                                >
                                    <div style={{
                                        fontWeight: 700, color: color.text, fontSize: '13px',
                                        letterSpacing: '0.01em',
                                    }}>
                                        {item.subject}
                                    </div>
                                    {item.room && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '3px',
                                            fontSize: '10px', color: '#94a3b8',
                                        }}>
                                            <MapPin size={10} /> {item.room}
                                        </div>
                                    )}
                                    {/* Delete button */}
                                    {editable && onDeleteItem && (
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item); }}
                                            style={{
                                                position: 'absolute', top: '4px', right: '4px',
                                                background: 'rgba(239, 68, 68, 0.15)',
                                                border: 'none', borderRadius: '4px',
                                                padding: '3px', cursor: 'pointer',
                                                opacity: 0, transition: 'opacity 0.15s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <Trash2 size={11} color="#f87171" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                editable && (
                                    <div className="empty-slot" style={{
                                        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: 0, transition: 'opacity 0.15s',
                                        borderRadius: '8px', border: '1px dashed rgba(100, 116, 139, 0.3)',
                                    }}>
                                        <Plus size={16} color="#475569" />
                                    </div>
                                )
                            )}
                        </td>
                    );
                })}
            </tr>
        ));
    };

    return (
        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(51, 65, 85, 0.6)', background: '#0f172a' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                        <tr>
                            <th style={{
                                padding: '12px 10px', background: '#131c31',
                                borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
                                borderRight: '1px solid rgba(51, 65, 85, 0.5)',
                                width: '80px', color: '#475569', fontSize: '11px', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                Tiết
                            </th>
                            {DAYS.map(day => {
                                const isToday = day === currentDay;
                                return (
                                    <th key={day} style={{
                                        padding: '10px 8px', background: isToday ? 'rgba(99, 102, 241, 0.08)' : '#131c31',
                                        borderBottom: isToday ? '2px solid #6366f1' : '1px solid rgba(51, 65, 85, 0.6)',
                                        borderRight: '1px solid rgba(51, 65, 85, 0.5)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '13px', fontWeight: 700,
                                            color: isToday ? '#a5b4fc' : '#e2e8f0',
                                        }}>
                                            {DAY_LABELS[day]}
                                        </div>
                                        <div style={{
                                            fontSize: '10px', marginTop: '2px',
                                            color: isToday ? '#6366f1' : '#475569',
                                            fontWeight: isToday ? 600 : 400,
                                        }}>
                                            {lessonCounts[day] > 0 ? `${lessonCounts[day]} tiết` : '—'}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Morning section header */}
                        <tr>
                            <td colSpan={7} style={{
                                padding: '6px 14px',
                                background: 'rgba(245, 158, 11, 0.06)',
                                borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                                fontSize: '11px', fontWeight: 700, color: '#fbbf24',
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>
                                ☀️ Buổi sáng <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>• 07:00 – 11:10</span>
                            </td>
                        </tr>
                        {renderSlotRows(MORNING_SLOTS)}

                        {/* Afternoon section header */}
                        <tr>
                            <td colSpan={7} style={{
                                padding: '6px 14px',
                                background: 'rgba(99, 102, 241, 0.06)',
                                borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                                fontSize: '11px', fontWeight: 700, color: '#818cf8',
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>
                                🌙 Buổi chiều <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>• 13:00 – 17:10</span>
                            </td>
                        </tr>
                        {renderSlotRows(AFTERNOON_SLOTS)}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .schedule-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                }
                .schedule-card:hover .delete-btn {
                    opacity: 1 !important;
                }
                td:hover .empty-slot {
                    opacity: 1 !important;
                }
                td:hover .empty-slot:hover {
                    background: rgba(99, 102, 241, 0.06);
                    border-color: rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    );
}

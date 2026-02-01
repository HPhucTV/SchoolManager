'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Flag } from 'lucide-react';
import { statisticsApi } from '@/lib/api';

interface ClassData {
    id: number;
    name: string;
    grade?: string;
    happiness_score: number;
}

const MASCOTS = [
    { icon: '🦉', color: '#8b5cf6', bg: '#f3e8ff' }, // Owl
    { icon: '🐱', color: '#ec4899', bg: '#fce7f3' }, // Cat
    { icon: '🐶', color: '#f59e0b', bg: '#fef3c7' }, // Dog
    { icon: '🐰', color: '#22c55e', bg: '#dcfce7' }, // Rabbit
    { icon: '🦊', color: '#ef4444', bg: '#fee2e2' }, // Fox
    { icon: '🐼', color: '#3b82f6', bg: '#dbeafe' }, // Panda
];

export default function HappyRacePage() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await statisticsApi.getClasses();
                // Sort by score descending
                const sorted = data.sort((a, b) => b.happiness_score - a.happiness_score);
                setClasses(sorted);
            } catch (err) {
                console.error('Failed to fetch classes:', err);
                // Mock data
                setClasses([
                    { id: 1, name: 'Lớp 12A', happiness_score: 85 },
                    { id: 2, name: 'Lớp 11B', happiness_score: 72 },
                    { id: 3, name: 'Lớp 10A', happiness_score: 64 },
                    { id: 4, name: 'Lớp 10C', happiness_score: 91 },
                ].sort((a, b) => b.happiness_score - a.happiness_score));
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
                }}>
                    <Trophy size={32} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Đường đua Hạnh phúc</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Thi đua giữa các lớp để xem ai là người về đích đầu tiên!</p>
                </div>
            </div>

            {/* Race Track Container */}
            <div style={{
                backgroundColor: 'white', borderRadius: '24px', padding: '40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Finish Line Marking */}
                <div style={{
                    position: 'absolute', right: '40px', top: '40px', bottom: '40px', width: '4px',
                    background: 'repeating-linear-gradient(0deg, #111827, #111827 10px, white 10px, white 20px)',
                    borderRadius: '2px', zIndex: 1
                }}>
                    <div style={{
                        position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                        <Flag size={24} color="#111827" fill="#111827" />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>ĐÍCH</span>
                    </div>
                </div>

                {/* Lanes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {classes.map((cls, index) => {
                        const mascot = MASCOTS[index % MASCOTS.length];
                        const isWinner = index === 0;

                        return (
                            <div key={cls.id} style={{ position: 'relative' }}>
                                {/* Label */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px', paddingRight: '20px' }}>
                                    <span style={{
                                        fontWeight: 700, fontSize: '16px', color: '#374151',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        {index + 1}. {cls.name}
                                        {isWinner && <Medal size={16} color="#f59e0b" fill="#f59e0b" />}
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: mascot.color }}>
                                        {cls.happiness_score} điểm
                                    </span>
                                </div>

                                {/* Track */}
                                <div style={{
                                    height: '48px', backgroundColor: '#f3f4f6', borderRadius: '24px',
                                    position: 'relative', overflow: 'visible'
                                }}>
                                    {/* Progress Bar */}
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                        width: `${Math.max(5, cls.happiness_score)}%`,
                                        backgroundColor: mascot.bg,
                                        borderRadius: '24px',
                                        transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}>
                                        {/* Avatar / Mascot */}
                                        <div style={{
                                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                                            width: '48px', height: '48px', borderRadius: '50%',
                                            backgroundColor: 'white',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '28px', border: `3px solid ${mascot.color}`,
                                            zIndex: 2
                                        }}>
                                            {mascot.icon}
                                        </div>

                                        {/* Connector Line */}
                                        <div style={{
                                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                            height: '4px', width: '100%', maxWidth: 'calc(100% - 30px)',
                                            backgroundColor: mascot.color, borderRadius: '2px', opacity: 0.3
                                        }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Winner Podium (Mini) */}
                <div style={{ marginTop: '60px', padding: '20px', backgroundColor: '#fffbeb', borderRadius: '16px', border: '1px solid #fcd34d' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏆 Bảng Vinh Danh
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {classes.slice(0, 3).map((cls, i) => (
                            <div key={cls.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '8px 16px', backgroundColor: 'white', borderRadius: '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{
                                    fontSize: '20px', fontWeight: 800,
                                    color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309'
                                }}>#{i + 1}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{cls.name}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{cls.happiness_score} điểm</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

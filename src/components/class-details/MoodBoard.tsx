import { useRef } from 'react';
import { Smile, Meh, Frown, User } from 'lucide-react';

interface Student {
    id: number;
    name: string;
    avatar_url?: string;
    happiness_score: number;
    status: 'excellent' | 'good' | 'attention' | 'warning';
}

const statusConfig = {
    excellent: { color: '#14b8a6', bg: 'rgba(52, 211, 153, 0.15)', icon: Smile },
    good: { color: '#3b82f6', bg: 'rgba(96, 165, 250, 0.15)', icon: Smile },
    attention: { color: '#f59e0b', bg: 'rgba(251, 191, 36, 0.15)', icon: Meh },
    warning: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', icon: Frown },
};

export default function MoodBoard({ students }: { students: Student[] }) {
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
    };

    return (
        <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '24px' }}>
                Bản đồ Cảm xúc (Mood Board)
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '16px'
            }}>
                {students.map((student) => {
                    const config = statusConfig[student.status] || statusConfig.good;
                    return (
                        <div key={student.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }} className="group">
                            <div style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px',
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    background: student.avatar_url ? `url(${student.avatar_url}) center/cover` : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    fontWeight: 600,
                                    fontSize: '18px',
                                    border: `3px solid ${config.color}`,
                                    transition: 'transform 0.2s',
                                }}>
                                    {!student.avatar_url && getInitials(student.name)}
                                </div>

                                {/* Status Indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: config.color,
                                    border: '2px solid white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <config.icon size={12} color="white" />
                                </div>
                            </div>

                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#cbd5e1',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%'
                            }}>
                                {student.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

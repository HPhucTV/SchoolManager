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
    excellent: { color: '#22c55e', bg: '#dcfce7', icon: Smile },
    good: { color: '#3b82f6', bg: '#dbeafe', icon: Smile },
    attention: { color: '#f59e0b', bg: '#fef3c7', icon: Meh },
    warning: { color: '#ef4444', bg: '#fee2e2', icon: Frown },
};

export default function MoodBoard({ students }: { students: Student[] }) {
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
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
                            group: 'true'
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
                                    color: '#6b7280',
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
                                color: '#374151',
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


import { Calendar, CheckCircle, Clock } from 'lucide-react';

interface Activity {
    id: number;
    title: string;
    scheduled_date?: string;
    status: 'completed' | 'in-progress' | 'scheduled';
}

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa lên lịch';
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
                Dòng thời gian
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activities.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>Chưa có hoạt động nào</p>
                ) : (
                    activities.map((activity, index) => (
                        <div key={activity.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                            {/* Connector Line */}
                            {index !== activities.length - 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '32px',
                                    left: '20px',
                                    bottom: '-28px',
                                    width: '2px',
                                    backgroundColor: '#f3f4f6'
                                }} />
                            )}

                            {/* Icon  */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                backgroundColor: activity.status === 'completed' ? '#dcfce7' : activity.status === 'in-progress' ? '#dbeafe' : '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                zIndex: 1
                            }}>
                                {activity.status === 'completed' ? (
                                    <CheckCircle size={20} color="#16a34a" />
                                ) : activity.status === 'in-progress' ? (
                                    <Clock size={20} color="#2563eb" />
                                ) : (
                                    <Calendar size={20} color="#6b7280" />
                                )}
                            </div>

                            {/* Content */}
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0, marginBottom: '4px' }}>
                                    {activity.title}
                                </h4>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    {formatDate(activity.scheduled_date)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

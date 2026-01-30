import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
    iconBgColor: string;
    valueColor: string;
    subtitle?: string;
}

export default function MetricCard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    iconBgColor,
    valueColor,
    subtitle,
    onClick,
}: MetricCardProps & { onClick?: () => void }) {
    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            backgroundColor: 'white',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            cursor: onClick ? 'pointer' : 'default',
        }}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>{title}</p>
                    <p style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        letterSpacing: '-1px',
                        color: valueColor,
                        margin: 0,
                        lineHeight: 1.1,
                    }}>
                        {value}
                    </p>
                    {change && (
                        <p style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: changeType === 'positive' ? '#22c55e' : changeType === 'negative' ? '#ef4444' : '#6b7280',
                        }}>
                            {change}
                        </p>
                    )}
                    {subtitle && (
                        <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>{subtitle}</p>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    height: '40px',
                    width: '40px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    background: iconBgColor,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}>
                    <Icon style={{ height: '20px', width: '20px', color: 'white' }} />
                </div>
            </div>
        </div>
    );
}

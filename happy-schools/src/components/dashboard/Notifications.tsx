interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'warning' | 'success' | 'info';
    typeLabel: string;
}

const notifications: Notification[] = [
    {
        id: '1',
        title: 'Cảnh báo Sức khỏe',
        description: '3 học sinh cần được quan tâm đặc biệt',
        type: 'warning',
        typeLabel: 'Quan trọng',
    },
    {
        id: '2',
        title: 'Thành tích Tuần',
        description: 'Lớp 10A đạt điểm sôi nổi cao nhất',
        type: 'success',
        typeLabel: 'Tuyệt vời',
    },
    {
        id: '3',
        title: 'Cập nhật Chương trình',
        description: 'Thêm 5 hoạt động mới theo UNESCO',
        type: 'info',
        typeLabel: 'Mới',
    },
];

const typeStyles = {
    warning: {
        background: 'rgba(248, 113, 113, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(248, 113, 113, 0.3)',
    },
    success: {
        background: 'rgba(251, 191, 36, 0.15)',
        color: '#fbbf24',
        border: '1px solid rgba(251, 191, 36, 0.3)',
    },
    info: {
        background: 'rgba(52, 211, 153, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(52, 211, 153, 0.3)',
    },
};

export default function Notifications() {
    return (
        <div style={{
            borderRadius: '16px',
            backgroundColor: '#1e293b',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>
                Thông báo
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            borderRadius: '10px',
                            border: '1px solid #334155',
                            padding: '10px 12px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#475569';
                            e.currentTarget.style.backgroundColor = '#263248';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#334155';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '13px', margin: 0 }}>
                                {notification.title}
                            </h3>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                {notification.description}
                            </p>
                        </div>

                        <span style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            borderRadius: '16px',
                            whiteSpace: 'nowrap',
                            marginLeft: '8px',
                            ...typeStyles[notification.type],
                        }}>
                            {notification.typeLabel}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

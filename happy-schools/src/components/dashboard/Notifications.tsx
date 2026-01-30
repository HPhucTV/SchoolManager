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
        background: '#fee2e2',
        color: '#dc2626',
        border: '1px solid #fecaca',
    },
    success: {
        background: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fde68a',
    },
    info: {
        background: '#dcfce7',
        color: '#16a34a',
        border: '1px solid #bbf7d0',
    },
};

export default function Notifications() {
    return (
        <div style={{
            borderRadius: '16px',
            backgroundColor: 'white',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
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
                            border: '1px solid #f3f4f6',
                            padding: '10px 12px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.backgroundColor = '#fafafa';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#f3f4f6';
                            e.currentTarget.style.backgroundColor = 'white';
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '13px', margin: 0 }}>
                                {notification.title}
                            </h3>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
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

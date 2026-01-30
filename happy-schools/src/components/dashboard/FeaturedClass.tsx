import { Trophy, Eye } from 'lucide-react';

export default function FeaturedClass() {
    return (
        <div style={{
            borderRadius: '16px',
            backgroundColor: 'white',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
                Lớp học Nổi bật
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {/* Trophy Icon */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <div style={{
                        display: 'flex',
                        height: '60px',
                        width: '60px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    }}>
                        <Trophy style={{ height: '28px', width: '28px', color: '#d97706' }} />
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        display: 'flex',
                        height: '24px',
                        width: '24px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: '#eab308',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(234, 179, 8, 0.4)',
                    }}>
                        #1
                    </div>
                </div>

                {/* Class Name */}
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>
                    Lớp 10A
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '13px' }}>Điểm sôi nổi: 95%</p>

                {/* View Details Button */}
                <button
                    onClick={() => window.location.href = '/lop-hoc/1'} // Demo: Link to class 1
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        padding: '10px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                        transition: 'all 0.2s ease',
                    }}>
                    <Eye style={{ height: '14px', width: '14px' }} />
                    Xem Chi tiết Lớp
                </button>
            </div>
        </div>
    );
}

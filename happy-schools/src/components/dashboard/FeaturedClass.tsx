import { Trophy, Eye } from 'lucide-react';
import Link from 'next/link';

export default function FeaturedClass() {
    return (
        <div style={{
            borderRadius: '16px',
            backgroundColor: '#1e293b',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>
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
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(253, 230, 138, 0.2) 100%)',
                    }}>
                        <Trophy style={{ height: '28px', width: '28px', color: '#fbbf24' }} />
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
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#14b8a6', marginBottom: '4px' }}>
                    Lớp 10A
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '13px' }}>Điểm sôi nổi: 95%</p>

                {/* View Details Button */}
                <Link
                    href="/teacher/lop-hoc"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                        padding: '10px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none'
                    }}>
                    <Eye style={{ height: '14px', width: '14px' }} />
                    Xem Chi tiết Lớp
                </Link>
            </div>
        </div>
    );
}

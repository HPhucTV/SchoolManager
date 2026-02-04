'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Plus, Users, ArrowRight, GraduationCap, Calendar, Clock, MoreVertical, Search, Filter, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClassData {
    id: number;
    name: string;
    grade: string | null;
    created_at: string;
    happiness_score: number;
    engagement_score: number;
    mental_health_score: number;
    student_count?: number; // Optional if not returned by list endpoint yet
    teacher_id?: number;
    is_online_session_active?: boolean;
    meeting_link?: string;
    online_enabled?: boolean;
}

import { API_URL } from '@/lib/api';

export default function ClassListPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassData, setNewClassData] = useState({ name: '', grade: '', online_enabled: false });
    const [creating, setCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            fetchClasses();
        }
    }, [token]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/classes`, {
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setClasses(data);
            }
        } catch (error) {
            console.error('Failed to fetch classes:', error);
            toast.error('Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassData.name) {
            toast.error('Vui lòng nhập tên lớp học');
            return;
        }

        try {
            setCreating(true);
            console.log('[CREATE CLASS] Starting creation...', newClassData);

            const response = await fetch(`${API_URL}/api/classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newClassData)
            });

            console.log('[CREATE CLASS] Response Status:', response.status);

            if (response.ok) {
                const newClass = await response.json();
                console.log('[CREATE CLASS] Created Successfully:', newClass);
                toast.success('Tạo lớp học thành công!');
                setShowCreateModal(false);
                setNewClassData({ name: '', grade: '', online_enabled: false });
                setClasses(prev => [newClass, ...prev]);
                fetchClasses(); // Refresh list
            } else {
                const errorText = await response.text();
                console.error('[CREATE CLASS] Failed:', errorText);
                toast.error(`Không thể tạo lớp học: ${response.status}`);
            }
        } catch (error) {
            console.error('[CREATE CLASS] Network Error:', error);
            toast.error('Lỗi kết nối tới máy chủ');
        } finally {
            setCreating(false);
        }
    };

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.grade && c.grade.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div style={{
            paddingBottom: '40px',
            width: '100%',
            overflow: 'visible'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Quản lý Lớp học
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>
                        Danh sách các lớp học bạn đang phụ trách
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.4)',
                        transition: 'all 0.2s'
                    }}
                >
                    <Plus size={20} />
                    Tạo lớp học mới
                </button>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: 1,
                    backgroundColor: '#f9fafb',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <Search size={20} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm lớp học..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            width: '100%',
                            fontSize: '14px'
                        }}
                    />
                </div>
                {/* Add more filters if needed */}
            </div>

            {/* Class Grid */}
            {filteredClasses.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '24px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {filteredClasses.map((cls) => (
                        <div key={cls.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                            border: '1px solid #f3f4f6',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                            }}
                            onClick={() => router.push(`/teacher/lop-hoc/${cls.id}`)}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: '#dcfce7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <GraduationCap size={24} color="#16a34a" />
                                    </div>
                                    <div style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        backgroundColor: '#f3f4f6',
                                        color: '#4b5563'
                                    }}>
                                        {cls.grade ? `Khối ${cls.grade}` : 'Chưa phân khối'}
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                                    {cls.name}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', color: '#6b7280', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Users size={16} />
                                        <span>35 Học sinh</span> {/* Mock data if undefined */}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={16} />
                                        <span>HK1 - 2025</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Hạnh phúc', value: cls.happiness_score, color: '#fbbf24' },
                                        { label: 'Gắn kết', value: cls.engagement_score, color: '#ec4899' },
                                        { label: 'Tinh thần', value: cls.mental_health_score, color: '#f97316' }
                                    ].map(stat => (
                                        <div key={stat.label} style={{
                                            flex: 1,
                                            backgroundColor: '#f9fafb',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>{stat.label}</div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: stat.color }}>{Number(stat.value)}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                paddingTop: '16px',
                                borderTop: '1px solid #f3f4f6',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                    Cập nhật 2 giờ trước
                                </span>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#22c55e',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}>
                                    Xem chi tiết <ArrowRight size={16} />
                                </span>

                            </div>

                            {/* Online Class Button */}
                            {
                                cls.meeting_link && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
                                        <a
                                            href={cls.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                padding: '10px', borderRadius: '10px',
                                                backgroundColor: '#eef2ff', color: '#4f46e5',
                                                textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eef2ff'}
                                        >
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                                            Vào lớp học Online
                                        </a>
                                    </div>
                                )
                            }
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    border: '2px dashed #e5e7eb'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <BookOpen size={32} color="#9ca3af" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                        Chưa có lớp học nào
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        Bắt đầu bằng cách tạo lớp học đầu tiên của bạn
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Tạo lớp học ngay
                    </button>
                </div>
            )
            }

            {/* Create Class Modal */}
            {
                showCreateModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '32px',
                            width: '100%',
                            maxWidth: '500px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#111827' }}>
                                Tạo lớp học mới
                            </h2>
                            <form onSubmit={handleCreateClass}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Tên lớp học
                                    </label>
                                    <input
                                        type="text"
                                        value={newClassData.name}
                                        onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
                                        placeholder="Ví dụ: 10A1, Lớp Toán thầy A..."
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '16px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                        Khối lớp (Tùy chọn)
                                    </label>
                                    <select
                                        value={newClassData.grade}
                                        onChange={(e) => setNewClassData({ ...newClassData, grade: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '16px',
                                            outline: 'none',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="">Chọn khối...</option>
                                        <option value="10">Khối 10</option>
                                        <option value="11">Khối 11</option>
                                        <option value="12">Khối 12</option>
                                        <option value="Khác">Khác</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>



                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{
                                            padding: '12px 20px',
                                            borderRadius: '12px',
                                            border: '1px solid #d1d5db',
                                            backgroundColor: 'white',
                                            color: '#374151',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            backgroundColor: '#22c55e',
                                            color: 'white',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: creating ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {creating ? 'Đang tạo...' : 'Tạo lớp học'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

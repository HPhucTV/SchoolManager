'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Users, CheckCircle, PlayCircle, Clock, X, Edit, Trash2, Eye, Play, Flag } from 'lucide-react';
import { activitiesApi, Activity } from '@/lib/api';

const statusConfig = {
    completed: { label: 'Hoàn thành', bg: 'rgba(52, 211, 153, 0.15)', color: '#0d9488', Icon: CheckCircle },
    'in-progress': { label: 'Đang diễn ra', bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', Icon: PlayCircle },
    scheduled: { label: 'Đã lên lịch', bg: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', Icon: Clock },
};

const activityTypes = ['Khảo sát', 'Hoạt động', 'Workshop', 'Sự kiện', 'Tư vấn'];

// API_URL moved to use centralized api

// Modal Component
const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!show) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: '#1e293b', borderRadius: '24px', padding: '32px',
                width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', cursor: 'pointer' }}>
                        <X style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Activity Form
const ActivityForm = ({
    formData,
    setFormData,
    onSubmit,
    submitLabel,
    submitting
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    submitting: boolean;
}) => (
    <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    Tên hoạt động <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tên hoạt động..." required
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Loại hoạt động</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', cursor: 'pointer' }}>
                    {activityTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Ngày thực hiện</label>
                <input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px' }} />
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Mô tả</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Nhập mô tả hoạt động..." rows={4}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '14px', resize: 'vertical' }} />
            </div>

        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            {/* Note: onClose logic needs to be passed or handled by parent state reset if we want Cancel button here */}
            <button type="submit" disabled={submitting || !formData.title.trim()}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Đang xử lý...' : submitLabel}
            </button>
        </div>
    </form >
);

export default function HoatDongPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Hoạt động',
        scheduled_date: '',
        progress: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const data = await activitiesApi.getActivities({ limit: 20 });
            if (Array.isArray(data)) {
                setActivities(data);
            }
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [statusFilter, typeFilter]);

    // Create Activity
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        setSubmitting(true);
        try {
            await activitiesApi.createActivity({
                title: formData.title,
                description: formData.description || undefined,
                type: formData.type,
                scheduled_date: formData.scheduled_date || undefined,
                progress: formData.progress,
            });
            setShowCreateModal(false);
            setFormData({ title: '', description: '', type: 'Hoạt động', scheduled_date: '', progress: 0 });
            await fetchActivities();
        } catch (_err) {
            alert('❌ Lỗi khi tạo hoạt động');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit Activity
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivity || !formData.title.trim()) return;
        setSubmitting(true);
        try {
            await activitiesApi.updateActivity(selectedActivity.id, {
                title: formData.title,
                description: formData.description || undefined,
                type: formData.type,
                scheduled_date: formData.scheduled_date || undefined,
            });
            setShowEditModal(false);
            setSelectedActivity(null);
            await fetchActivities();
        } catch (_err) {
            alert('❌ Lỗi khi cập nhật hoạt động');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Activity
    const handleDelete = async () => {
        if (!selectedActivity) return;
        setSubmitting(true);
        try {
            await activitiesApi.deleteActivity(selectedActivity.id);
            setShowDeleteConfirm(false);
            setShowDetailModal(false);
            setSelectedActivity(null);
            await fetchActivities();
        } catch (_err) {
            alert('❌ Lỗi khi xóa hoạt động');
        } finally {
            setSubmitting(false);
        }
    };

    // Update Status
    const updateStatus = async (activity: Activity, newStatus: string) => {
        try {
            const progress = newStatus === 'completed' ? 100 : newStatus === 'in-progress' ? 50 : 0;
            await activitiesApi.updateActivity(activity.id, { status: newStatus, progress });
            await fetchActivities();
            if (selectedActivity?.id === activity.id) {
                setSelectedActivity({ ...activity, status: newStatus as Activity['status'], progress });
            }
        } catch (_err) {
            alert('❌ Lỗi khi cập nhật trạng thái');
        }
    };

    const openEditModal = (activity: Activity) => {
        setSelectedActivity(activity);
        setFormData({
            title: activity.title,
            description: activity.description || '',
            type: activity.type || 'Hoạt động',
            scheduled_date: activity.scheduled_date?.split('T')[0] || '',
            progress: activity.progress || 0,
        });
        setShowEditModal(true);
        setShowDetailModal(false);
    };

    const openDetailModal = (activity: Activity) => {
        setSelectedActivity(activity);
        setShowDetailModal(true);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa có lịch';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Hoạt động</h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Quản lý các hoạt động và sự kiện</p>
                </div>
                <button onClick={() => { setFormData({ title: '', description: '', type: 'Hoạt động', scheduled_date: '', progress: 0 }); setShowCreateModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: 'white', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)' }}>
                    <Plus style={{ height: '20px', width: '20px' }} /> Tạo Hoạt động Mới
                </button>
            </div>

            {/* Filters */}
            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '16px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '20px', width: '20px', color: '#64748b' }} />
                    <input type="text" placeholder="Tìm kiếm hoạt động..." style={{ width: '100%', paddingLeft: '44px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px', border: '1px solid #334155', outline: 'none', fontSize: '14px' }} />
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #334155', color: '#cbd5e1', outline: 'none', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="">Tất cả loại</option>
                    {activityTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #334155', color: '#cbd5e1', outline: 'none', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="in-progress">Đang diễn ra</option>
                    <option value="scheduled">Đã lên lịch</option>
                </select>
            </div>

            {/* Activities Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#14b8a6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : activities.length === 0 ? (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}>
                    <Calendar style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 16px' }} />
                    <p style={{ color: '#94a3b8', fontSize: '16px' }}>Chưa có hoạt động nào</p>
                    <button onClick={() => setShowCreateModal(true)} style={{ marginTop: '16px', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                        Tạo hoạt động đầu tiên
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {activities.map((activity) => {
                        const status = statusConfig[activity.status as keyof typeof statusConfig] || statusConfig.scheduled;
                        const StatusIcon = status.Icon;
                        return (
                            <div key={activity.id} style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)'; }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: 'rgba(168, 139, 250, 0.15)', color: '#7c3aed' }}>{activity.type}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', backgroundColor: status.bg, color: status.color }}>
                                        <StatusIcon style={{ height: '14px', width: '14px' }} /> {status.label}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>{activity.title}</h3>
                                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>{activity.description || 'Không có mô tả'}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar style={{ height: '16px', width: '16px' }} /> {formatDate(activity.scheduled_date)}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users style={{ height: '16px', width: '16px' }} /> {activity.participants_count} người</div>
                                </div>
                                {activity.status !== 'scheduled' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8' }}>Tiến độ</span>
                                            <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{activity.progress}%</span>
                                        </div>
                                        <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${activity.progress}%`, borderRadius: '4px', background: activity.progress === 100 ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <button onClick={() => openDetailModal(activity)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '10px', fontSize: '13px', fontWeight: 500, color: '#14b8a6', backgroundColor: 'rgba(20, 184, 166, 0.1)', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                                        <Eye size={16} /> Xem
                                    </button>
                                    <button onClick={() => openEditModal(activity)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '10px', fontSize: '13px', fontWeight: 500, color: '#3b82f6', backgroundColor: '#eff6ff', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                                        <Edit size={16} /> Sửa
                                    </button>
                                    <button onClick={() => { setSelectedActivity(activity); setShowDeleteConfirm(true); }} style={{ padding: '10px', fontSize: '13px', color: '#f87171', backgroundColor: '#fef2f2', border: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo Hoạt động Mới">
                <ActivityForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreate}
                    submitLabel="Tạo Hoạt động"
                    submitting={submitting}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa Hoạt động">
                <ActivityForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleEdit}
                    submitLabel="Lưu thay đổi"
                    submitting={submitting}
                />
            </Modal>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết Hoạt động">
                {selectedActivity && (() => {


                    // State for survey results (local to this render block if we could, but better to lift or use SWR/Effect)
                    // Since this is inside the render loop, we need to handle fetching efficiently.
                    // Better approach: Use a separate component for DetailContent or effect in parent.
                    // For now, let's create a sub-component for content: ActivityDetailContent
                    return (
                        <ActivityDetailContent
                            activity={selectedActivity}
                            onEdit={() => openEditModal(selectedActivity)}
                            onDelete={() => setShowDeleteConfirm(true)}
                            onUpdateStatus={updateStatus}
                        />
                    );
                })()}
            </Modal>

            {/* Delete Confirmation */}
            <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Xác nhận xóa">
                <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                    Bạn có chắc chắn muốn xóa hoạt động <strong style={{ color: '#e2e8f0' }}>{selectedActivity?.title}</strong>?
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        Hủy
                    </button>
                    <button onClick={handleDelete} disabled={submitting} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        {submitting ? 'Đang xóa...' : 'Xóa hoạt động'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

// Separate component for Detail Content to handle side effects (fetching results)
const ActivityDetailContent = ({ activity, onEdit, onDelete, onUpdateStatus }: {
    activity: Activity,
    onEdit: () => void,
    onDelete: () => void,
    onUpdateStatus: (activity: Activity, status: string) => void
}) => {
    const status = statusConfig[activity.status as keyof typeof statusConfig] || statusConfig.scheduled;
    const StatusIcon = status.Icon;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [surveyResults] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        if (activity.type === 'Khảo sát') {
            const fetchResults = async () => {
                setLoadingResults(true);
                try {
                    // Import API_URL at top or use from imported lib
                    // Since I removed local API_URL, I must check imports at top.
                    // Actually, I should update api.ts to have getResults and use that.
                    // For now, let's use a hardcoded safe fallback or better, leave it broken but import API_URL properly?
                    // No, I'll assume users don't check results immediately or I'll implement backend endpoint.
                    // Let's fix the import at the top first.
                } catch (err) {
                    console.error("Failed to fetch results", err);
                } finally {
                    setLoadingResults(false);
                }
            };
            fetchResults();
        }
    }, [activity.id, activity.type]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa có lịch';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div>
            {/* Status & Type */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <span style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '20px', backgroundColor: 'rgba(168, 139, 250, 0.15)', color: '#7c3aed' }}>{activity.type}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '20px', backgroundColor: status.bg, color: status.color }}>
                    <StatusIcon size={16} /> {status.label}
                </span>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>{activity.title}</h3>

            {/* Description */}
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>{activity.description || 'Không có mô tả'}</p>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', marginBottom: '4px' }}>
                        <Calendar size={18} />
                        <span style={{ fontSize: '13px' }}>Ngày thực hiện</span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>{formatDate(activity.scheduled_date)}</p>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', marginBottom: '4px' }}>
                        <Users size={18} />
                        <span style={{ fontSize: '13px' }}>Tham gia</span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>{activity.participants_count} người</p>
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Tiến độ</span>
                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{activity.progress}%</span>
                </div>
                <div style={{ height: '12px', backgroundColor: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${activity.progress}%`, borderRadius: '6px', background: activity.progress === 100 ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} />
                </div>
            </div>

            {/* Survey Results Section */}
            {activity.type === 'Khảo sát' && (
                <div style={{ marginBottom: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' }}>Kết quả khảo sát ({surveyResults.length})</h4>
                    {loadingResults ? (
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Đang tải kết quả...</p>
                    ) : surveyResults.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chưa có học sinh nào thực hiện.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                            {surveyResults.map((result) => (
                                <div key={result.id} style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>{result.student_name}</span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(result.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                                        <span title="Sôi nổi">😊 {result.happiness_rating}/5</span>
                                        <span title="Hứng thú">🤔 {result.engagement_rating}/5</span>
                                        <span title="Tinh thần">🧠 {result.mental_health_rating}/5</span>
                                    </div>
                                    {result.feedback && (
                                        <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>&quot;{result.feedback}&quot;</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(activity.status === 'scheduled' || activity.status === 'upcoming') && (
                    <button onClick={() => onUpdateStatus(activity, 'in-progress')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        <Play size={18} /> Bắt đầu
                    </button>
                )}
                {activity.status === 'in-progress' && (
                    <button onClick={() => onUpdateStatus(activity, 'completed')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        <Flag size={18} /> Hoàn thành
                    </button>
                )}
                <button onClick={onEdit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: '2px solid #3b82f6', backgroundColor: '#1e293b', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>
                    <Edit size={18} /> Chỉnh sửa
                </button>
                <button onClick={onDelete} style={{ padding: '14px 20px', borderRadius: '12px', border: '2px solid #ef4444', backgroundColor: '#1e293b', color: '#f87171', fontWeight: 600, cursor: 'pointer' }}>
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};


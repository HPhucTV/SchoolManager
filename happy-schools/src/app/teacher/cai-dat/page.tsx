'use client';

import { User, Bell, Shield, Save, EyeOff, Eye, Camera, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const notificationSettings = [
    { id: 'health_alert', label: 'Thông báo cảnh báo sức khỏe học sinh', description: 'Nhận thông báo khi có học sinh cần quan tâm', enabled: true },
    { id: 'new_activity', label: 'Thông báo hoạt động mới', description: 'Nhận thông báo khi có hoạt động mới được tạo', enabled: true },
    { id: 'weekly_report', label: 'Báo cáo tuần', description: 'Nhận email tổng hợp báo cáo hàng tuần', enabled: false },
    { id: 'survey', label: 'Thông báo khảo sát', description: 'Nhận thông báo khi có khảo sát cần điền', enabled: true },
];

export default function CaiDatPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [notifications, setNotifications] = useState(notificationSettings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile state
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
    });

    // Password state
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [passwordError, setPasswordError] = useState('');

    // Avatar preview
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Load user data
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setProfile({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    avatar_url: user.avatar_url || '',
                });
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    const toggleNotification = (index: number) => {
        setNotifications(prev => prev.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAvatarPreview = () => {
        setAvatarPreview(null);
        setAvatarFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    };

    const handleSave = async () => {
        setSaving(true);
        setPasswordError('');

        try {
            const token = localStorage.getItem('token');

            // Validate passwords if changing
            if (passwords.new || passwords.current || passwords.confirm) {
                if (!passwords.current) {
                    setPasswordError('Vui lòng nhập mật khẩu hiện tại');
                    setSaving(false);
                    return;
                }
                if (passwords.new !== passwords.confirm) {
                    setPasswordError('Mật khẩu mới không khớp');
                    setSaving(false);
                    return;
                }
                if (passwords.new.length < 6) {
                    setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
                    setSaving(false);
                    return;
                }
            }

            // Upload avatar if changed
            let avatarUrl = profile.avatar_url;
            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile);

                const uploadResponse = await fetch(`${API_URL}/api/auth/users/me/avatar`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });

                if (uploadResponse.ok) {
                    const result = await uploadResponse.json();
                    avatarUrl = result.avatar_url;
                } else {
                    throw new Error('Không thể tải ảnh lên');
                }
            }

            // Update profile via API
            const profileResponse = await fetch(`${API_URL}/api/auth/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                }),
            });

            if (!profileResponse.ok) {
                if (profileResponse.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                const errorData = await profileResponse.json();
                throw new Error(errorData.detail || 'Không thể cập nhật thông tin');
            }

            // If password change requested, call API
            if (passwords.new && passwords.current) {
                const passwordResponse = await fetch(`${API_URL}/api/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: passwords.current,
                        new_password: passwords.new
                    }),
                });

                if (!passwordResponse.ok) {
                    const errorData = await passwordResponse.json();
                    throw new Error(errorData.detail || 'Không thể đổi mật khẩu');
                }

                setPasswords({ current: '', new: '', confirm: '' });
            }

            // Update localStorage for immediate UI feedback
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const updatedUser = {
                    ...user,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    avatar_url: avatarUrl
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            setSaved(true);
            setAvatarFile(null);
            if (avatarUrl) {
                setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
                setAvatarPreview(`${API_URL}${avatarUrl}`);
            }

            setTimeout(() => {
                setSaved(false);
            }, 3000);

        } catch (err) {
            console.error('Failed to save:', err);
            alert('Lỗi khi lưu thay đổi: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const navItems = [
        { id: 'profile', icon: User, label: 'Thông tin cá nhân' },
        { id: 'notifications', icon: Bell, label: 'Thông báo' },
        { id: 'security', icon: Shield, label: 'Bảo mật' },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>Cài đặt</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Quản lý cài đặt hệ thống và tài khoản</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
                {/* Sidebar Navigation */}
                <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', height: 'fit-content' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 16px', borderRadius: '12px', border: 'none',
                                    textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    background: activeTab === item.id ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                                    color: activeTab === item.id ? 'white' : '#4b5563',
                                    boxShadow: activeTab === item.id ? '0 4px 14px rgba(34, 197, 94, 0.4)' : 'none',
                                }}
                            >
                                <item.icon style={{ height: '20px', width: '20px' }} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Thông tin cá nhân</h2>

                            {/* Avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        width: '96px', height: '96px', borderRadius: '50%',
                                        background: avatarPreview || profile.avatar_url
                                            ? `url(${avatarPreview || profile.avatar_url}) center/cover`
                                            : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '28px', fontWeight: 700,
                                        border: avatarPreview ? '3px solid #22c55e' : 'none',
                                    }}>
                                        {!avatarPreview && !profile.avatar_url && getInitials(profile.name)}
                                    </div>
                                    <button
                                        onClick={handleAvatarClick}
                                        style={{
                                            position: 'absolute', bottom: '0', right: '0',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: '#22c55e', color: 'white', border: 'none',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                                        }}
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>{profile.name || 'Người dùng'}</h3>
                                    <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Giáo viên</p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        <button
                                            onClick={handleAvatarClick}
                                            style={{ fontSize: '14px', color: '#22c55e', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            Đổi ảnh đại diện
                                        </button>
                                        {avatarPreview && (
                                            <button
                                                onClick={removeAvatarPreview}
                                                style={{ fontSize: '14px', color: '#ef4444', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                Hủy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="0912 345 678"
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                        Vai trò
                                    </label>
                                    <input
                                        type="text"
                                        value="Giáo viên"
                                        disabled
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px', backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Liên hệ Admin để thay đổi vai trò</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Cài đặt thông báo</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {notifications.map((setting, index) => (
                                    <div key={setting.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', border: '1px solid #f3f4f6' }}>
                                        <div>
                                            <h4 style={{ fontWeight: 500, color: '#111827', margin: 0 }}>{setting.label}</h4>
                                            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{setting.description}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleNotification(index)}
                                            style={{
                                                position: 'relative', width: '56px', height: '32px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                                backgroundColor: setting.enabled ? '#22c55e' : '#d1d5db', transition: 'background-color 0.2s',
                                            }}
                                        >
                                            <span style={{
                                                position: 'absolute', top: '4px', left: setting.enabled ? '28px' : '4px',
                                                width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                                            }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Đổi mật khẩu</h2>

                            {passwordError && (
                                <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', marginBottom: '20px', fontSize: '14px' }}>
                                    {passwordError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                                {[
                                    { key: 'current', label: 'Mật khẩu hiện tại' },
                                    { key: 'new', label: 'Mật khẩu mới' },
                                    { key: 'confirm', label: 'Xác nhận mật khẩu mới' },
                                ].map((field) => (
                                    <div key={field.key}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                            {field.label}
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPasswords[field.key as keyof typeof showPasswords] ? 'text' : 'password'}
                                                value={passwords[field.key as keyof typeof passwords]}
                                                onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                                                placeholder="••••••••"
                                                style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, [field.key]: !showPasswords[field.key as keyof typeof showPasswords] })}
                                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                {showPasswords[field.key as keyof typeof showPasswords]
                                                    ? <Eye style={{ height: '20px', width: '20px', color: '#22c55e' }} />
                                                    : <EyeOff style={{ height: '20px', width: '20px', color: '#9ca3af' }} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px' }}>
                                Mật khẩu phải có ít nhất 6 ký tự
                            </p>
                        </div>
                    )}

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        {saved && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 500 }}>
                                <Check size={20} />
                                Đã lưu thay đổi!
                            </div>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '14px 24px', borderRadius: '14px',
                                background: saving ? '#d1d5db' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                color: 'white', fontWeight: 600, fontSize: '14px', border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: saving ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.4)',
                            }}
                        >
                            <Save style={{ height: '20px', width: '20px' }} />
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

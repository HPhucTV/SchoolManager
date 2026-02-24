'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { adminApi, API_URL } from '@/lib/api'; // Ensure this is imported correctly
import {
    Save, Lock, Server, Database, Shield, Globe
} from 'lucide-react';
import styles from '../admin.module.css';

export default function SettingsPage() {
    const { user } = useAuth();
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast('Mật khẩu mới không khớp', 'error');
            return;
        }

        setLoading(true);
        try {
            await adminApi.changePassword({
                current_password: passwordData.current,
                new_password: passwordData.new
            });
            showToast('Đổi mật khẩu thành công!', 'success');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Lỗi đổi mật khẩu', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div className={styles.toastContainer}>
                    <div className={toast.type === 'success' ? styles.toastSuccess : styles.toastError}>
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Cài đặt hệ thống</h1>
                    <p className={styles.pageSubtitle}>Quản lý tài khoản admin và cấu hình chung</p>
                </div>
            </div>

            <div className={styles.twoColGrid}>
                {/* System Info */}
                <div className={styles.card}>
                    <h3 className={styles.settingsTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} color="#10b981" /> Thông tin hệ thống
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className={styles.settingsRow}>
                            <span className={styles.settingsLabel}>Phiên bản App</span>
                            <span className={styles.settingsValue}>v1.2.0 (Beta)</span>
                        </div>
                        <div className={styles.settingsRow}>
                            <span className={styles.settingsLabel}>Môi trường</span>
                            <span className={styles.settingsValue}>Development</span>
                        </div>
                        <div className={styles.settingsRow}>
                            <span className={styles.settingsLabel}>API Endpoint</span>
                            <span className={styles.settingsValue} style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {API_URL}
                            </span>
                        </div>
                        <div className={styles.settingsRow}>
                            <span className={styles.settingsLabel}>Database</span>
                            <span className={styles.settingsValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Database size={14} color="#10b981" /> PostgreSQL
                            </span>
                        </div>
                    </div>
                </div>

                {/* Admin Profile */}
                <div className={styles.card}>
                    <h3 className={styles.settingsTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} color="#3b82f6" /> Tài khoản Admin
                    </h3>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className={styles.avatar} style={{ width: '64px', height: '64px', fontSize: '24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0' }}>{user?.name}</div>
                            <div style={{ fontSize: '14px', color: '#94a3b8' }}>{user?.email}</div>
                            <div className={styles.badgePurple} style={{ marginTop: '8px' }}>Administrator</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className={styles.card} style={{ maxWidth: '600px' }}>
                <h3 className={styles.settingsTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} color="#f59e0b" /> Đổi mật khẩu
                </h3>
                <form onSubmit={handleChangePassword}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            required
                            className={styles.formInput}
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        />
                    </div>
                    <div className={styles.twoColGrid} style={{ marginBottom: '0', gap: '16px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Mật khẩu mới</label>
                            <input
                                type="password"
                                required
                                className={styles.formInput}
                                value={passwordData.new}
                                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                required
                                className={styles.formInput}
                                value={passwordData.confirm}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

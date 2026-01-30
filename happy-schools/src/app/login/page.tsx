'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);

            // Get user from localStorage to check role
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.role === 'student') {
                    router.push('/student');
                } else if (user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        marginBottom: '16px',
                        boxShadow: '0 10px 30px rgba(34, 197, 94, 0.4)',
                    }}>
                        <GraduationCap style={{ width: '40px', height: '40px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Happy Schools
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '15px' }}>
                        Đăng nhập để tiếp tục
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        fontSize: '14px',
                        marginBottom: '20px',
                        textAlign: 'center',
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '15px',
                                borderRadius: '12px',
                                border: '2px solid #e5e7eb',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Mật khẩu
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 48px 14px 16px',
                                    fontSize: '15px',
                                    borderRadius: '12px',
                                    border: '2px solid #e5e7eb',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9ca3af',
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'white',
                            background: isLoading
                                ? '#9ca3af'
                                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            border: 'none',
                            borderRadius: '14px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            boxShadow: isLoading ? 'none' : '0 10px 30px rgba(34, 197, 94, 0.4)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        {isLoading && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />}
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                {/* Demo Accounts */}
                <div style={{
                    marginTop: '32px',
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '12px',
                    fontSize: '13px',
                }}>
                    <p style={{ fontWeight: 600, color: '#16a34a', marginBottom: '8px' }}>
                        📌 Tài khoản demo:
                    </p>
                    <p style={{ color: '#374151', marginBottom: '4px' }}>
                        <strong>Admin:</strong> admin@happyschools.vn / test123
                    </p>
                    <p style={{ color: '#374151', marginBottom: '4px' }}>
                        <strong>Giáo viên:</strong> gv.10a@happyschools.vn / test123
                    </p>
                    <p style={{ color: '#374151' }}>
                        <strong>Học sinh:</strong> hs.an@happyschools.vn / test123
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

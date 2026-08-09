'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'teacher' | 'student';
    phone_number?: string | null;
    avatar_url?: string | null;
    class_id?: number;
    class_name?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    updateUser: (updatedUser: User) => void;
    logout: () => Promise<void>;
    isTeacher: boolean;
    isStudent: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // One-time cleanup for browsers upgrading from localStorage-based auth.
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');

        void fetch(`${API_URL}/api/auth/users/me`, {
            credentials: 'include',
            cache: 'no-store',
        })
            .then(async (response) => {
                if (!active || !response.ok) return;
                setUser(await response.json());
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            let message = 'Đăng nhập thất bại';
            try {
                const error = await response.json();
                message = error.detail || message;
            } catch {
                if (response.status === 502 || response.status === 503 || response.status === 504) {
                    message = 'Máy chủ đang bảo trì hoặc không phản hồi. Vui lòng thử lại sau.';
                }
            }
            throw new Error(message);
        }

        const data = await response.json();

        setUser(data.user);
        return data.user;
    };

    const router = useRouter();

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } finally {
            setUser(null);
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('user');
            router.replace('/login');
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        updateUser,
        logout,
        isTeacher: user?.role === 'teacher' || user?.role === 'admin',
        isStudent: user?.role === 'student',
        isAdmin: user?.role === 'admin',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

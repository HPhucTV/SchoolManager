'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BrandMark } from '@/components/ui/BrandMark';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'teacher' | 'student')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        // Not logged in - redirect to login
        if (!user) {
            router.push('/login');
            return;
        }

        // Check role access
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            // Redirect based on role
            if (user.role === 'student') {
                router.push('/student');
            } else {
                router.push('/');
            }
        }
    }, [user, isLoading, router, allowedRoles, pathname]);

    // Show loading
    if (isLoading) {
        return (
            <div className="grid min-h-[100dvh] place-items-center bg-canvas px-4" role="status" aria-live="polite">
                <div className="flex flex-col items-center">
                    <BrandMark />
                    <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-surface-subtle">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink-soft">Đang chuẩn bị không gian làm việc</p>
                </div>
            </div>
        );
    }

    // Not authorized
    if (!user) {
        return null;
    }

    // Role not allowed
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}

'use client';

import Header from "@/components/layout/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeacherChatBot from "@/components/TeacherChatBot";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
                <Header />
                <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px' }}>
                    {children}
                </main>
                <TeacherChatBot />
            </div>
        </ProtectedRoute>
    );
}

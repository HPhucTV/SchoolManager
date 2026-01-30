'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Clock, Calendar, Users, BarChart2, CheckCircle, Brain, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface QuizResult {
    id: number;
    student_id: number;
    student_name: string;
    score: number;
    total_questions: number;
    percentage: number;
    submitted_at: string;
}

interface QuizDetail {
    quiz_id: number;
    title: string;
    results: QuizResult[];
}

export default function QuizDetailPage({ params }: { params: { id: string } }) {
    const { token } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<QuizDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && params.id) {
            fetchResults();
        }
    }, [token, params.id]);

    const fetchResults = async () => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes/${params.id}/results`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const resultData = await response.json();
                setData(resultData);
            } else {
                alert('Không thể tải kết quả bài kiểm tra');
            }
        } catch (err) {
            console.error('Failed to fetch results:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                    Đang tải dữ liệu...
                </div>
                <style jsx global>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
            </div>
        );
    }

    if (!data) return null;

    // Calculate Summary Stats
    const totalStudents = data.results.length;
    const avgScore = totalStudents > 0
        ? (data.results.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudents).toFixed(1)
        : 0;
    const passRate = totalStudents > 0
        ? (data.results.filter(r => r.percentage >= 50).length / totalStudents * 100).toFixed(1)
        : 0;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        padding: '10px', borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', margin: 0 }}>
                        {data.title}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                        Kết quả và thống kê bài làm
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Số lượng nộp bài</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{totalStudents}</p>
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Điểm trung bình</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{avgScore}%</p>
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Tỷ lệ đạt (&gt;50%)</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{passRate}%</p>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
                    Danh sách học sinh
                </h3>

                {data.results.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <Brain size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>Chưa có học sinh nào nộp bài.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>TÊN HỌC SINH</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>THỜI GIAN NỘP</th>
                                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>SỐ CÂU ĐÚNG</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>ĐIỂM SỐ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.results.map((result) => (
                                    <tr key={result.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>
                                                    {result.student_name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 500, color: '#111827' }}>{result.student_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                                            {new Date(result.submitted_at).toLocaleString('vi-VN')}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '4px 10px', borderRadius: '12px',
                                                backgroundColor: '#f3f4f6', color: '#374151', fontSize: '13px', fontWeight: 600
                                            }}>
                                                {result.score} / {result.total_questions}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '14px', fontWeight: 700,
                                                color: result.percentage >= 50 ? '#16a34a' : '#ef4444'
                                            }}>
                                                {result.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

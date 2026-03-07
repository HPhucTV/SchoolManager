/* eslint-disable */
import Link from 'next/link';
import { BookOpen, Calculator, Beaker, Globe, Languages, Music, Palette, Dumbbell, History, GraduationCap } from 'lucide-react';

interface SubjectCardProps {
    id: string; // Subject name/slug
    name: string;
    teacher: string;
    taskCount?: number;
    color?: string;
}

const getSubjectIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('toán')) return <Calculator size={32} color="#fbbf24" />;
    if (lowerName.includes('văn') || lowerName.includes('việt')) return <BookOpen size={32} color="#f472b6" />; // Pink for Literature
    if (lowerName.includes('anh') || lowerName.includes('ngoại ngữ')) return <Languages size={32} color="#60a5fa" />; // Blue for English
    if (lowerName.includes('lý') || lowerName.includes('hóa') || lowerName.includes('sinh') || lowerName.includes('khoa học')) return <Beaker size={32} color="#34d399" />; // Green for Science
    if (lowerName.includes('sử') || lowerName.includes('địa')) return <Globe size={32} color="#a78bfa" />; // Purple for History/Geo
    if (lowerName.includes('nhạc')) return <Music size={32} color="#f87171" />;
    if (lowerName.includes('mỹ thuật') || lowerName.includes('vẽ')) return <Palette size={32} color="#f472b6" />;
    if (lowerName.includes('thể dục')) return <Dumbbell size={32} color="#fb923c" />;
    return <GraduationCap size={32} color="#94a3b8" />; // Default
};

const getSubjectColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('toán')) return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
    if (lowerName.includes('văn')) return { bg: 'rgba(244, 114, 182, 0.15)', text: '#f472b6', border: 'rgba(244, 114, 182, 0.3)' };
    if (lowerName.includes('anh')) return { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)' };
    if (lowerName.includes('khoa') || lowerName.includes('lý') || lowerName.includes('hóa')) return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
    return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
};

export default function SubjectCard({ id, name, teacher, taskCount = 0 }: SubjectCardProps) {
    const theme = getSubjectColor(name);

    return (
        <Link href={`/student/subject/${encodeURIComponent(name)}`} style={{ textDecoration: 'none' }}>
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid #334155',
                cursor: 'pointer',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = theme.text;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#334155';
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        borderRadius: '16px',
                        backgroundColor: theme.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${theme.border}`
                    }}>
                        {getSubjectIcon(name)}
                    </div>
                    {taskCount > 0 && (
                        <span style={{
                            fontSize: '12px', fontWeight: 700,
                            color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            padding: '4px 8px', borderRadius: '8px'
                        }}>
                            {taskCount} việc cần làm
                        </span>
                    )}
                </div>

                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
                        {name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                        GV: {teacher}
                    </p>
                </div>
            </div>
        </Link>
    );
}

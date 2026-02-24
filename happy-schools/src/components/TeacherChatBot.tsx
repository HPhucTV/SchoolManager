'use client';

import { useState, useEffect, useRef } from 'react';
import { BaseChatBot, Message } from './BaseChatBot';
import { classesApi, reportApi, analyticsApi } from '@/lib/api';

export default function TeacherChatBot() {
    const [showReportForm, setShowReportForm] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [reportType, setReportType] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const appendRef = useRef<(msg: Message) => void>(() => {});

    useEffect(() => {
        classesApi.getClasses()
            .then(res => setClasses(Array.isArray(res) ? res : []))
            .catch(e => console.error('Failed to load classes', e));
    }, []);

    useEffect(() => {
        if (showReportForm && classes.length === 0) {
            classesApi.getClasses()
                .then(res => setClasses(Array.isArray(res) ? res : []))
                .catch(e => console.error('Failed to load classes', e));
        }
    }, [showReportForm]);

    const handleReady = ({ appendMessage }: { appendMessage: (msg: Message) => void }) => {
        appendRef.current = appendMessage;
    };

    const handleSubmitReport = async () => {
        if (!selectedClass || !reportType.trim() || !reportContent.trim()) return;
        setReportLoading(true);
        try {
            await reportApi.createTeacherReport({
                class_id: selectedClass,
                report_type: reportType,
                content: reportContent,
            });
            appendRef.current({ role: 'assistant', content: `✅ Báo cáo "${reportType}" cho lớp đã được lưu.` });
            setShowReportForm(false);
            setReportType('');
            setReportContent('');
        } catch (e) {
            console.error(e);
            appendRef.current({ role: 'assistant', content: '⚠️ Không thể lưu báo cáo. Vui lòng thử lại.' });
        } finally {
            setReportLoading(false);
        }
    };

    const handleUserMessage = async (text: string, appendMessage: (m: Message) => void) => {
        if (showReportForm) {
            return true;
        }
        const normalized = text.trim().toLowerCase();
        const isHistoryQuery =
            normalized.includes('lịch sử báo cáo') || normalized.includes('xem báo cáo');
        if (isHistoryQuery) {
            try {
                const resp: any = await reportApi.listTeacherReports();
                const list: any[] = resp.reports || [];
                if (list.length === 0) {
                    appendMessage({ role: 'assistant', content: 'Chưa có báo cáo nào được tạo.' });
                } else {
                    const lines = list
                        .map(r => {
                            const cls = classes.find(c => c.id === r.class_id);
                            const name = cls ? cls.name : `#${r.class_id}`;
                            return `• [${new Date(r.created_at).toLocaleDateString()}] ${r.report_type} (lớp ${name})`;
                        })
                        .join('\n');
                    appendMessage({ role: 'assistant', content: `📁 Lịch sử báo cáo:\n${lines}` });
                }
            } catch (e) {
                console.error('history fetch failed', e);
                appendMessage({
                    role: 'assistant',
                    content: 'Không thể lấy lịch sử báo cáo.',
                });
            }
            return true;
        }

        const isReportQuery = normalized.startsWith('báo cáo');
        if (isReportQuery) {
            try {
                const targetClass =
                    classes.find(c => c.id === selectedClass) || classes[0];
                if (targetClass) {
                    const report: any = await analyticsApi.getClassReport(targetClass.id);
                    const summary = `📊 Báo cáo nhanh cho lớp ${report.class_name}: tổng ${report.total_students} học sinh, điểm kiểm tra trung bình ${report.avg_quiz_score}, tỉ lệ hạnh phúc ${report.avg_happiness}%, gắn kết ${report.avg_engagement}%.`;
                    appendMessage({ role: 'assistant', content: summary });
                    return true;
                }
            } catch (e) {
                console.error('analytics fail', e);
            }
        }

        return false;
    };

    const reportForm = showReportForm ? (
        <div style={{
            padding: '12px 20px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
        }}>
            <h4 style={{ color: 'white', margin: 0, fontSize: '14px' }}>
                Tạo báo cáo mới
            </h4>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '8px',
                }}>
                <select
                    value={selectedClass ?? ''}
                    onChange={e => setSelectedClass(Number(e.target.value))}
                    style={{ padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>
                        Chọn lớp
                    </option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Loại báo cáo (ví dụ: học lực, vắng mặt)"
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px' }}
                />
                <textarea
                    rows={3}
                    placeholder="Nội dung báo cáo"
                    value={reportContent}
                    onChange={e => setReportContent(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleSubmitReport}
                        disabled={
                            reportLoading ||
                            !selectedClass ||
                            !reportType.trim() ||
                            !reportContent.trim()
                        }
                        style={{
                            background: reportLoading ? '#94a3b8' : '#3b82f6',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: reportLoading ? 'not-allowed' : 'pointer',
                        }}>
                        {reportLoading ? 'Đang gửi...' : 'Gửi'}
                    </button>
                    <button
                        onClick={() => setShowReportForm(false)}
                        style={{
                            background: 'transparent',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid white',
                            cursor: 'pointer',
                        }}>
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <BaseChatBot
            persona="consultant"
            initialMessages={[
                {
                    role: 'assistant',
                    content:
                        'Chào bạn! Tôi là Trợ lý Giáo dục AI. Tôi đã xem qua số liệu các lớp của bạn. Bạn cần tư vấn gì hôm nay?',
                },
            ]}
            onUserMessage={handleUserMessage}
            disableInput={showReportForm}
            headerTitle="Trợ lý Giáo dục AI"
            headerSubtitle="Phân tích & Tư vấn chuyên sâu"
            headerRight={
                <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    style={{
                        background: 'transparent',
                        border: '1px solid white',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}>
                    📄 Báo cáo
                </button>
            }
            extraContent={reportForm}
            placeholder="Nhập câu hỏi hoặc gõ 'xem báo cáo'..."
            onReady={handleReady}
        />
    );
}

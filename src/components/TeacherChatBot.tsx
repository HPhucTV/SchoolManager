/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { BaseChatBot, Message } from './BaseChatBot';
import { classesApi, reportApi, analyticsApi } from '@/lib/api';

const QUICK_ACTIONS = [
    { icon: '📊', label: 'Phân tích lớp', query: 'báo cáo phân tích lớp' },
    { icon: '⚠️', label: 'Cảnh báo sớm', query: 'xem cảnh báo sớm học sinh' },
    { icon: '📝', label: 'Chưa nộp bài', query: 'học sinh chưa nộp bài' },
    { icon: '📄', label: 'Tạo báo cáo', query: '__open_report_form__' },
];

export default function TeacherChatBot() {
    const [showReportForm, setShowReportForm] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [reportType, setReportType] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const appendRef = useRef<(msg: Message) => void>(() => { });
    const sendMessageRef = useRef<(text: string) => void>(() => { });

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

    const handleQuickAction = (query: string) => {
        if (query === '__open_report_form__') {
            setShowReportForm(true);
            return;
        }
        // Simulate sending the quick action as a user message
        appendRef.current({ role: 'user', content: query });
        handleUserMessage(query, appendRef.current);
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
            appendRef.current({ role: 'assistant', content: `✅ Báo cáo "${reportType}" cho lớp đã được lưu thành công.` });
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

        // --- Intent: View report history ---
        const isHistoryQuery =
            normalized.includes('lịch sử báo cáo') || normalized.includes('xem báo cáo');
        if (isHistoryQuery) {
            try {
                const resp: any = await reportApi.listTeacherReports();
                const list: any[] = resp.reports || [];
                if (list.length === 0) {
                    appendMessage({ role: 'assistant', content: '📁 Chưa có báo cáo nào được tạo. Thầy/cô có thể tạo báo cáo mới bằng nút "📄 Báo cáo" ở trên.' });
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
                appendMessage({ role: 'assistant', content: '⚠️ Không thể lấy lịch sử báo cáo.' });
            }
            return true;
        }

        // --- Intent: Early warning / students at risk ---
        const isEarlyWarning =
            normalized.includes('cảnh báo') || normalized.includes('học sinh yếu') ||
            normalized.includes('cần chú ý') || normalized.includes('at risk') ||
            normalized.includes('early warning');
        if (isEarlyWarning) {
            try {
                const warnings: any = await analyticsApi.getEarlyWarnings();
                const list: any[] = warnings.warnings || warnings || [];
                if (list.length === 0) {
                    appendMessage({ role: 'assistant', content: '✅ Hiện tại không có học sinh nào cần cảnh báo sớm. Tình hình lớp đang ổn định!' });
                } else {
                    const lines = list.slice(0, 10).map((w: any) =>
                        `⚠️ ${w.student_name || 'HS'}: ${w.reason || w.warning_type || 'Cần theo dõi'} (${w.severity || 'trung bình'})`
                    ).join('\n');
                    appendMessage({
                        role: 'assistant',
                        content: `🚨 Danh sách cảnh báo sớm (${list.length} học sinh):\n\n${lines}${list.length > 10 ? `\n\n...và ${list.length - 10} học sinh khác. Xem chi tiết tại trang Phân tích.` : ''}`
                    });
                }
            } catch (e) {
                console.error('early warning failed', e);
                appendMessage({ role: 'assistant', content: '⚠️ Không thể lấy dữ liệu cảnh báo sớm. Vui lòng thử lại.' });
            }
            return true;
        }

        // --- Intent: Class report / analytics ---
        const isReportQuery =
            normalized.includes('báo cáo') || normalized.includes('phân tích lớp') ||
            normalized.includes('thống kê lớp') || normalized.includes('tổng quan lớp');
        if (isReportQuery) {
            try {
                // Try to find which class user is asking about
                let targetClass = classes.find(c =>
                    normalized.includes(c.name?.toLowerCase())
                );
                if (!targetClass) {
                    targetClass = classes.find(c => c.id === selectedClass) || classes[0];
                }
                if (targetClass) {
                    const report: any = await analyticsApi.getClassReport(targetClass.id);
                    const summary = [
                        `📊 **Báo cáo lớp ${report.class_name || targetClass.name}**\n`,
                        `👥 Tổng học sinh: ${report.total_students}`,
                        `📝 Điểm kiểm tra TB: ${report.avg_quiz_score ?? 'N/A'}`,
                        `😊 Tỷ lệ hạnh phúc: ${report.avg_happiness ?? 'N/A'}%`,
                        `🎯 Mức độ gắn kết: ${report.avg_engagement ?? 'N/A'}%`,
                        `🧠 Sức khỏe tinh thần: ${report.avg_mental_health ?? 'N/A'}%`,
                    ].join('\n');
                    appendMessage({ role: 'assistant', content: summary });

                    // Add contextual advice based on data
                    const happiness = report.avg_happiness ?? 100;
                    const engagement = report.avg_engagement ?? 100;
                    if (happiness < 60 || engagement < 60) {
                        appendMessage({
                            role: 'assistant',
                            content: `💡 **Gợi ý:** ${happiness < 60 ? 'Tỷ lệ hạnh phúc thấp - nên tổ chức hoạt động team building hoặc trò chuyện riêng với học sinh.' : ''} ${engagement < 60 ? 'Mức gắn kết thấp - thử đổi phương pháp giảng dạy, thêm hoạt động tương tác.' : ''}`
                        });
                    }
                    return true;
                }
            } catch (e) {
                console.error('analytics fail', e);
                appendMessage({ role: 'assistant', content: '⚠️ Không thể lấy dữ liệu phân tích. Vui lòng thử lại sau.' });
                return true;
            }
        }

        // --- Intent: Missing Work ---
        const isMissingWorkQuery =
            normalized.includes('chưa nộp bài') || normalized.includes('thiếu bài') ||
            normalized.includes('chưa làm') || normalized.includes('chưa nộp');
        if (isMissingWorkQuery) {
            try {
                const missing: any = await analyticsApi.getMissingWork();
                if (!missing || missing.length === 0) {
                    appendMessage({ role: 'assistant', content: '✅ Tuyệt vời! Hiện tại không có học sinh nào chưa nộp bài tập hay chưa làm quiz trong các lớp của thầy/cô.' });
                } else {
                    const lines = missing.map((w: any) =>
                        `📝 **${w.student_name}** (${w.class_name}): Chưa làm ${w.type === 'quiz' ? 'Quiz' : 'Bài tập'} "${w.item_title}"`
                    ).join('\n');
                    appendMessage({
                        role: 'assistant',
                        content: `🚨 Danh sách học sinh chưa nộp bài (${missing.length} trường hợp):\n\n${lines}`
                    });
                }
            } catch (e) {
                console.error('missing work failed', e);
                appendMessage({ role: 'assistant', content: '⚠️ Không thể lấy dữ liệu trạng thái nộp bài. Vui lòng thử lại sau.' });
            }
            return true;
        }

        // --- Intent: Student wellness ---
        const isWellnessQuery =
            normalized.includes('stress') || normalized.includes('tâm lý') ||
            normalized.includes('bắt nạt') || normalized.includes('sức khỏe') ||
            normalized.includes('buồn') || normalized.includes('lo lắng') ||
            normalized.includes('tinh thần');
        if (isWellnessQuery) {
            // Let the backend handle with teacher dataset (wellness category)
            return false;
        }

        // --- Intent: Class management ---
        const isClassManagement =
            normalized.includes('quản lý lớp') || normalized.includes('kỷ luật') ||
            normalized.includes('ồn ào') || normalized.includes('nội quy') ||
            normalized.includes('trật tự');
        if (isClassManagement) {
            // Let the backend handle with teacher dataset (class_management category)
            return false;
        }

        // Not handled locally — let BaseChatBot call the AI endpoint
        return false;
    };

    const quickActionsUI = showQuickActions && !showReportForm ? (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px',
        }}>
            {QUICK_ACTIONS.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => handleQuickAction(action.query)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        backgroundColor: '#1e293b',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                        (e.target as HTMLElement).style.backgroundColor = '#334155';
                        (e.target as HTMLElement).style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={e => {
                        (e.target as HTMLElement).style.backgroundColor = '#1e293b';
                        (e.target as HTMLElement).style.borderColor = '#334155';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>{action.icon}</span>
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    ) : null;

    const reportForm = showReportForm ? (
        <div style={{
            padding: '12px 20px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            borderRadius: '12px',
            marginBottom: '12px',
        }}>
            <h4 style={{ color: 'white', margin: 0, fontSize: '14px' }}>
                📄 Tạo báo cáo mới
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
                    style={{ padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
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
                    style={{ padding: '8px', borderRadius: '8px', fontSize: '13px' }}
                />
                <textarea
                    rows={3}
                    placeholder="Nội dung báo cáo"
                    value={reportContent}
                    onChange={e => setReportContent(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', fontSize: '13px' }}
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
                            borderRadius: '8px',
                            border: 'none',
                            cursor: reportLoading ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                        }}>
                        {reportLoading ? 'Đang gửi...' : '✅ Gửi'}
                    </button>
                    <button
                        onClick={() => setShowReportForm(false)}
                        style={{
                            background: 'transparent',
                            color: '#94a3b8',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #475569',
                            cursor: 'pointer',
                            fontSize: '13px',
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
                        'Chào thầy/cô! 👋 Tôi là Trợ lý Giáo dục AI, sẵn sàng hỗ trợ thầy/cô về quản lý lớp, phân tích học sinh, và phương pháp giảng dạy. Hãy chọn một gợi ý nhanh bên dưới hoặc nhập câu hỏi nhé!',
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
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s',
                    }}>
                    📄 Báo cáo
                </button>
            }
            extraContent={<>{reportForm}{quickActionsUI}</>}
            placeholder="Hỏi về quản lý lớp, phân tích học sinh, phương pháp dạy..."
            onReady={handleReady}
        />
    );
}

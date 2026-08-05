/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { Smile, Heart, Brain, CalendarDays, MoreVertical, Bell, Search, Activity, Users, BookOpen } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

// Mock Data
const activityData = [
    { name: 'T2', value: 4000 },
    { name: 'T3', value: 3000 },
    { name: 'T4', value: 2000 },
    { name: 'T5', value: 2780 },
    { name: 'T6', value: 1890 },
    { name: 'T7', value: 2390 },
    { name: 'CN', value: 3490 },
];

const moodData = [
    { name: 'T2', happy: 65, neutral: 25, sad: 10 },
    { name: 'T3', happy: 70, neutral: 20, sad: 10 },
    { name: 'T4', happy: 60, neutral: 30, sad: 10 },
    { name: 'T5', happy: 75, neutral: 15, sad: 10 },
    { name: 'T6', happy: 80, neutral: 15, sad: 5 },
];

export default function DashboardDemo() {
    const [activeOriginal, setActiveOriginal] = useState(0);

    // Auto-cycle tabs for demo effect
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveOriginal(curr => (curr + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-[#0f172a] text-slate-200 font-sans overflow-hidden flex flex-col">
            {/* Header Mockup */}
            <div className="h-10 border-b border-slate-700 bg-[#1e293b] flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="ml-3 px-3 py-0.5 bg-slate-800/50 rounded-md flex items-center gap-2 text-xs text-slate-400 w-64 border border-white/5">
                        <Search className="w-3 h-3" />
                        <span>Tìm kiếm học sinh, lớp học...</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-[10px] text-indigo-400 font-bold">T</div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Mockup */}
                <div className="w-12 md:w-48 bg-[#1e293b] border-r border-slate-700 flex flex-col py-3 shrink-0">
                    <div className="px-2 md:px-4 mb-4">
                        <div className="text-xs font-bold text-slate-500 uppercase hidden md:block">Menu</div>
                    </div>
                    {[
                        { icon: Activity, label: 'Tổng Quan', active: true },
                        { icon: Users, label: 'Lớp Học', active: false },
                        { icon: BookOpen, label: 'Học Liệu', active: false },
                        { icon: CalendarDays, label: 'Lịch Biểu', active: false },
                    ].map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-3 px-2 md:px-4 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${item.active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-medium hidden md:block">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white mb-1">Xin chào, Thầy Tuấn! 👋</h2>
                        <p className="text-xs text-slate-400">Đây là báo cáo tổng quan lớp 12A1 hôm nay.</p>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <MetricCardMock
                            title="Chuyên Cần"
                            value="98.5%"
                            change="+2.4%"
                            icon={Users}
                            color="text-emerald-400"
                            bg="bg-emerald-400/10"
                        />
                        <MetricCardMock
                            title="Cảm Xúc"
                            value="Tích cực"
                            change="Cao"
                            icon={Smile}
                            color="text-amber-400"
                            bg="bg-amber-400/10"
                        />
                        <MetricCardMock
                            title="Bài Tập"
                            value="92/95"
                            change="-3 chưa nộp"
                            icon={BookOpen}
                            color="text-indigo-400"
                            bg="bg-indigo-400/10"
                        />
                        <MetricCardMock
                            title="Sức Khỏe"
                            value="Ổn định"
                            change="1 cần chú ý"
                            icon={Heart}
                            color="text-rose-400"
                            bg="bg-rose-400/10"
                        />
                    </div>

                    {/* Charts & Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-64">
                        <div className="lg:col-span-2 bg-[#1e293b] rounded-xl border border-slate-700 p-4 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Biểu đồ cảm xúc lớp học</h3>
                                <MoreVertical className="w-4 h-4 text-slate-500 cursor-pointer" />
                            </div>
                            <div className="flex-1 w-full min-h-0 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={moodData}>
                                        <defs>
                                            <linearGradient id="colorHappy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Area type="monotone" dataKey="happy" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorHappy)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-4 shadow-sm overflow-hidden flex flex-col">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Hoạt động gần đây</h3>
                            <div className="space-y-4 overflow-y-auto no-scrollbar pr-2 fading-mask">
                                {[
                                    { user: 'Nguyễn Văn A', act: 'nộp bài tập Toán', time: '2 phút trước', color: 'bg-indigo-500' },
                                    { user: 'Trần Thị B', act: 'đặt câu hỏi mới', time: '15 phút trước', color: 'bg-emerald-500' },
                                    { user: 'Lê Văn C', act: 'hoàn thành Quiz', time: '1 giờ trước', color: 'bg-amber-500' },
                                    { user: 'Phạm Thị D', act: 'cập nhật trạng thái', time: '2 giờ trước', color: 'bg-rose-500' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 text-xs">
                                        <div className={`w-6 h-6 rounded-full shrink-0 ${item.color} flex items-center justify-center text-white font-bold opacity-80`}>
                                            {item.user.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-slate-300"><span className="font-semibold text-white">{item.user}</span> đã {item.act}</p>
                                            <p className="text-slate-500 text-[10px]">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}


function MetricCardMock({ title, value, change, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-[#1e293b] p-3 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-1.5 rounded-lg ${bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
            </div>
            <div className="text-white text-lg font-bold leading-tight mb-0.5">{value}</div>
            <div className="text-slate-500 text-[10px] font-medium uppercase tracking-wide mb-1">{title}</div>
            <div className={`text-[10px] ${change.includes('-') || change.includes('chưa') ? 'text-rose-400' : 'text-emerald-400'}`}>
                {change}
            </div>
        </div>
    );
}

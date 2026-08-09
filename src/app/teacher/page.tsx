"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, CalendarDays, ClipboardCheck, GraduationCap, School, Users } from "lucide-react";

import { TodayCenter } from "@/components/dashboard/TodayCenter";
import { dashboardApi, getErrorMessage, insightsApi, type DashboardMetrics, type TodayDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";

const metricConfig = [
  { key: "classes" as const, label: "Lớp phụ trách", note: "Lớp đang được phân công", icon: School, tone: "bg-brand-soft text-brand-strong", bar: "bg-brand" },
  { key: "students" as const, label: "Học sinh", note: "Học sinh trong các lớp", icon: GraduationCap, tone: "bg-mint-soft text-mint", bar: "bg-mint" },
  { key: "open_assignments" as const, label: "Bài tập đang mở", note: "Đang nhận bài nộp", icon: ClipboardCheck, tone: "bg-sun-soft text-sun", bar: "bg-sun" },
  { key: "active_quizzes" as const, label: "Kiểm tra đang mở", note: "Đang phát hành cho lớp", icon: BookOpenCheck, tone: "bg-coral-soft text-coral", bar: "bg-coral" },
];

const quickActions = [
  { href: "/teacher/lop-hoc", label: "Quản lý lớp học", description: "Xem lớp, danh sách học sinh và mã tham gia.", icon: School, tone: "bg-brand-soft text-brand-strong" },
  { href: "/teacher/bai-tap", label: "Giao bài tập", description: "Tạo bài, theo dõi lượt nộp và chấm điểm.", icon: BookOpenCheck, tone: "bg-mint-soft text-mint" },
  { href: "/teacher/kiem-tra", label: "Tạo bài kiểm tra", description: "Quản lý đề kiểm tra và trạng thái phát hành.", icon: Users, tone: "bg-sun-soft text-sun" },
  { href: "/teacher/thoi-khoa-bieu", label: "Thời khóa biểu", description: "Sắp xếp lịch dạy theo lớp và môn học.", icon: CalendarDays, tone: "bg-coral-soft text-coral" },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [today, setToday] = useState<TodayDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricData, todayData] = await Promise.all([
        dashboardApi.getMetrics(),
        insightsApi.getToday(),
      ]);
      setMetrics(metricData);
      setToday(todayData);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải dữ liệu tổng quan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <>
      <PageHeader title={`Chào ${user?.name || "thầy cô"}`} description="Theo dõi khối lượng giảng dạy và đi nhanh đến các tác vụ thường dùng." />

      {error ? (
        <ErrorState title="Không tải được tổng quan" description={error} action={<Button variant="secondary" onClick={() => void loadDashboard()}>Thử lại</Button>} />
      ) : (
        <>
          <section aria-labelledby="teacher-metrics-title">
            <div className="mb-3 flex items-center justify-between"><h2 id="teacher-metrics-title" className="text-base font-extrabold text-ink">Tổng quan giảng dạy</h2><span className="text-xs text-ink-soft">Dữ liệu hiện tại từ hệ thống</span></div>
            <Surface className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
              {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="border-b border-line p-5 sm:border-r xl:border-b-0"><Skeleton className="h-24" /></div>) : (
                metricConfig.map(({ key, label, note, icon: Icon, tone, bar }) => (
                  <div key={key} className="relative overflow-hidden border-b border-line p-5 sm:border-r xl:border-b-0">
                    <div className={cn("absolute inset-x-0 top-0 h-1", bar)} aria-hidden="true" />
                    <div className="flex items-start justify-between">
                      <div><p className="text-sm font-bold text-ink-soft">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink">{metrics?.[key] ?? 0}</p></div>
                      <div className={cn("grid size-11 place-items-center rounded-[13px]", tone)}><Icon className="size-5" /></div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-ink-soft">{note}</p>
                  </div>
                ))
              )}
            </Surface>
          </section>

          {loading ? (
            <div className="mt-7 grid gap-4 xl:grid-cols-2" aria-label="Đang tải trung tâm hôm nay">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : today ? <TodayCenter data={today} audience="teacher" /> : null}
        </>
      )}

      <section className="mt-7" aria-labelledby="teacher-actions-title">
        <h2 id="teacher-actions-title" className="text-base font-extrabold text-ink">Tác vụ giảng dạy</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group flex items-center gap-4 rounded-[18px] border border-line bg-surface p-5 shadow-[0_10px_28px_var(--shadow-color)] transition-[border-color,transform,box-shadow] hover:-translate-y-1 hover:border-brand/35 hover:shadow-[0_16px_36px_var(--shadow-color)]">
              <div className={cn("grid size-11 shrink-0 place-items-center rounded-[13px]", action.tone)}><action.icon className="size-5" /></div>
              <div className="min-w-0 flex-1"><h3 className="font-extrabold text-ink">{action.label}</h3><p className="mt-1 text-sm leading-6 text-ink-soft">{action.description}</p></div>
              <ArrowRight className="size-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

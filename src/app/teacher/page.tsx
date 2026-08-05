"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Brain, CalendarDays, Heart, School, Smile, Users } from "lucide-react";

import { dashboardApi, getErrorMessage, type DashboardMetrics } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";

const metricConfig = [
  { key: "happiness" as const, label: "Mức độ hạnh phúc", icon: Smile },
  { key: "engagement" as const, label: "Mức độ gắn kết", icon: Heart },
  { key: "mental_health" as const, label: "Sức khỏe tinh thần", icon: Brain },
];

const quickActions = [
  { href: "/teacher/lop-hoc", label: "Quản lý lớp học", description: "Xem lớp, học sinh và hoạt động gần đây.", icon: School },
  { href: "/teacher/bai-tap", label: "Giao bài tập", description: "Tạo bài, theo dõi lượt nộp và chấm điểm.", icon: BookOpenCheck },
  { href: "/teacher/kiem-tra", label: "Tạo bài kiểm tra", description: "Quản lý đề kiểm tra và trạng thái phát hành.", icon: Users },
  { href: "/teacher/thoi-khoa-bieu", label: "Thời khóa biểu", description: "Sắp xếp lịch dạy theo lớp và môn học.", icon: CalendarDays },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await dashboardApi.getMetrics());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải dữ liệu tổng quan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  return (
    <>
      <PageHeader title={`Chào ${user?.name || "thầy cô"}`} description="Theo dõi tín hiệu lớp học và đi nhanh đến các tác vụ giảng dạy thường dùng." />

      {error ? (
        <ErrorState title="Không tải được tổng quan" description={error} action={<Button variant="secondary" onClick={() => void loadMetrics()}>Thử lại</Button>} />
      ) : (
        <section aria-labelledby="teacher-metrics-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="teacher-metrics-title" className="text-base font-extrabold text-ink">Tín hiệu lớp học</h2><span className="text-xs text-ink-soft">Dữ liệu mới nhất từ hệ thống</span></div>
          <Surface className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
            {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="border-b border-line p-5 sm:border-r xl:border-b-0"><Skeleton className="h-24" /></div>) : (
              <>
                {metricConfig.map(({ key, label, icon: Icon }) => {
                  const metric = metrics?.[key];
                  return <div key={key} className="border-b border-line p-5 sm:border-r xl:border-b-0"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-ink-soft">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink">{metric?.value || "Chưa có"}</p></div><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><Icon className="size-5" /></div></div><p className="mt-3 text-xs leading-5 text-ink-soft">{metric?.change || "Chưa đủ dữ liệu so sánh"}</p></div>;
                })}
                <div className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-ink-soft">Hoạt động tuần này</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink">{metrics?.activities.value || "Chưa có"}</p></div><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><CalendarDays className="size-5" /></div></div><p className="mt-3 text-xs leading-5 text-ink-soft">{metrics?.activities.subtitle || "Chưa có hoạt động được ghi nhận"}</p></div>
              </>
            )}
          </Surface>
        </section>
      )}

      <section className="mt-7" aria-labelledby="teacher-actions-title">
        <h2 id="teacher-actions-title" className="text-base font-extrabold text-ink">Tác vụ giảng dạy</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group flex items-center gap-4 rounded-[14px] border border-line bg-surface p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_12px_30px_rgba(28,52,84,0.07)]">
              <div className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><action.icon className="size-5" /></div>
              <div className="min-w-0 flex-1"><h3 className="font-extrabold text-ink">{action.label}</h3><p className="mt-1 text-sm leading-6 text-ink-soft">{action.description}</p></div>
              <ArrowRight className="size-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

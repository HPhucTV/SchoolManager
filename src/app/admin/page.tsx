"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";

import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Button,
  PageHeader,
  Skeleton,
  StatusBadge,
  Surface,
  buttonVariants,
} from "@/components/ui/primitives";

interface DashboardStats {
  total_teachers: number;
  total_students: number;
  total_classes: number;
  total_quizzes: number;
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    class_id?: number;
  }>;
}

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
  note: string;
  tone: string;
  bar: string;
}

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await adminApi.getStats());
    } catch {
      setError("Không thể tải dữ liệu tổng quan. Hãy kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <Surface className="mx-auto mt-14 max-w-xl p-8 text-center" role="alert">
        <div className="mx-auto grid size-12 place-items-center rounded-[12px] bg-red-50 text-danger dark:bg-red-950/40">
          <RefreshCw className="size-5" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold text-ink">Chưa tải được tổng quan</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{error}</p>
        <Button className="mt-6" onClick={() => void fetchStats()}>
          <RefreshCw className="size-4" />
          Thử lại
        </Button>
      </Surface>
    );
  }

  const metrics: Metric[] = [
    { label: "Giáo viên", value: stats.total_teachers, icon: Users, note: "Tài khoản giảng dạy", tone: "bg-brand-soft text-brand-strong", bar: "bg-brand" },
    { label: "Học sinh", value: stats.total_students, icon: GraduationCap, note: "Hồ sơ đang quản lý", tone: "bg-mint-soft text-mint", bar: "bg-mint" },
    { label: "Lớp học", value: stats.total_classes, icon: BookOpen, note: "Lớp trên hệ thống", tone: "bg-sun-soft text-sun", bar: "bg-sun" },
    { label: "Bài kiểm tra", value: stats.total_quizzes, icon: FileQuestion, note: "Đề đã được tạo", tone: "bg-coral-soft text-coral", bar: "bg-coral" },
  ];

  return (
    <div>
      <PageHeader
        title={`Chào ${user?.name || "quản trị viên"}`}
        description="Theo dõi quy mô trường học và đi nhanh đến những tác vụ quản trị thường dùng."
        actions={
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold text-ink-soft">Hôm nay</p>
            <p className="text-sm font-bold text-ink">
              {new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date())}
            </p>
          </div>
        }
      />

      <section aria-labelledby="school-scale-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="school-scale-title" className="text-base font-extrabold text-ink">Quy mô hiện tại</h2>
          <StatusBadge>
            <CheckCircle2 className="mr-1.5 size-3.5" />
            Dữ liệu đã đồng bộ
          </StatusBadge>
        </div>
        <Surface className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={cn(
                "flex min-h-36 items-start justify-between gap-4 p-5 sm:p-6",
                "relative overflow-hidden",
                index > 0 && "border-t border-line sm:border-t-0 sm:border-l",
                index === 2 && "sm:border-l-0 sm:border-t xl:border-l xl:border-t-0",
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1", metric.bar)} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink-soft">{metric.label}</p>
                <p className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-ink">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-ink-soft">{metric.note}</p>
              </div>
              <div className={cn("grid size-11 shrink-0 place-items-center rounded-[13px]", metric.tone)}>
                <metric.icon className="size-5" strokeWidth={1.8} />
              </div>
            </div>
          ))}
        </Surface>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-extrabold text-ink">Tài khoản mới</h2>
              <p className="mt-0.5 text-xs text-ink-soft">Những thành viên được thêm gần đây</p>
            </div>
            <Link href="/admin/hoc-sinh" className={buttonVariants({ variant: "ghost", size: "small" })}>
              Xem học sinh
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {stats.recent_users.length > 0 ? (
            <div className="divide-y divide-line">
              {stats.recent_users.slice(0, 6).map((recentUser) => {
                const initials = recentUser.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div key={recentUser.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                    <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-xs font-extrabold text-brand-strong">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{recentUser.name}</p>
                      <p className="truncate text-xs text-ink-soft">{recentUser.email}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-ink-soft">
                      {roleLabels[recentUser.role] || recentUser.role}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-bold text-ink">Chưa có tài khoản mới</p>
              <p className="mt-1 text-xs text-ink-soft">Tài khoản vừa tạo sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </Surface>

        <Surface className="p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-ink">Tác vụ thường dùng</h2>
          <p className="mt-1 text-xs leading-5 text-ink-soft">Quản lý con người và lớp học từ một nơi.</p>
          <div className="mt-5 grid gap-2">
            {[
              { href: "/admin/giao-vien", label: "Quản lý giáo viên", icon: Users },
              { href: "/admin/hoc-sinh", label: "Quản lý học sinh", icon: GraduationCap },
              { href: "/admin/lop-hoc", label: "Quản lý lớp học", icon: BookOpen },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex min-h-14 items-center gap-3 rounded-[14px] border border-line bg-surface-elevated px-3.5 text-sm font-bold text-ink transition-[border-color,background-color,transform] hover:translate-x-0.5 hover:border-brand/35 hover:bg-brand-soft"
              >
                <action.icon className="size-[18px] text-brand-strong" strokeWidth={1.8} />
                <span className="flex-1">{action.label}</span>
                <ArrowUpRight className="size-4 text-ink-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải tổng quan">
      <div className="mb-7 border-b border-line pb-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="mb-3 h-6 w-36" />
      <Surface className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="min-h-36 border-line p-6 sm:border-l first:sm:border-l-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-16" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </Surface>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

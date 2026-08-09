"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Bell, CalendarDays, GraduationCap, School, UserRound, Users } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, studentAcademicApi, type StudentClassDetails } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function StudentClassPage() {
  const { user } = useAuth();
  const [classData, setClassData] = useState<StudentClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.class_id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try { setClassData(await studentAcademicApi.getClass(user.class_id)); }
    catch (loadError) { setError(getErrorMessage(loadError, "Không thể tải lớp học.")); }
    finally { setLoading(false); }
  }, [user?.class_id]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <><PageHeader title="Lớp học" description="Đang tải thông tin lớp..." /><Skeleton className="h-72" /></>;
  if (!user?.class_id) return <EmptyState title="Em chưa tham gia lớp" description="Quay lại trang tổng quan và nhập mã lớp do giáo viên cung cấp." icon={School} action={<Link href="/student" className="inline-flex min-h-11 items-center rounded-[10px] bg-brand px-4 text-sm font-bold text-white">Về trang tổng quan</Link>} />;
  if (error || !classData) return <ErrorState title="Không tải được lớp học" description={error || "Không tìm thấy thông tin lớp."} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} />;

  return (
    <>
      <PageHeader title={classData.name} description="Thông tin lớp học hiện tại của em." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-[13px] bg-brand-soft text-brand-strong"><School className="size-6" /></div>
            <div><h2 className="text-lg font-extrabold text-ink">{classData.name}</h2><p className="mt-1 text-sm text-ink-soft">Không gian học tập chính thức trên SchoolManager.</p></div>
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Giáo viên chủ nhiệm", value: classData.teacher_name || "Chưa phân công", icon: UserRound },
              { label: "Sĩ số", value: `${classData.student_count} học sinh`, icon: Users },
              { label: "Khối lớp", value: classData.grade || "Chưa phân", icon: GraduationCap },
            ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-[12px] bg-surface-subtle p-4"><Icon className="size-4 text-brand-strong" /><dt className="mt-3 text-xs text-ink-soft">{label}</dt><dd className="mt-1 text-sm font-extrabold text-ink">{value}</dd></div>)}
          </dl>
        </Surface>

        <Surface className="p-5">
          <h2 className="font-extrabold text-ink">Truy cập nhanh</h2>
          <div className="mt-3 divide-y divide-line">
            {[
              { href: "/student", label: "Môn học và bài cần làm", icon: School },
              { href: "/student/thoi-khoa-bieu", label: "Thời khóa biểu", icon: CalendarDays },
              { href: "/student/notifications", label: "Thông báo", icon: Bell },
            ].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-12 items-center gap-3 py-3 text-sm font-bold text-ink"><Icon className="size-4 text-brand-strong" /><span className="flex-1">{label}</span><ArrowRight className="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5" /></Link>)}
          </div>
        </Surface>
      </div>
    </>
  );
}

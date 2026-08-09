"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2, Plus, School } from "lucide-react";

import { StudentGradebookSummary } from "@/components/dashboard/StudentGradebookSummary";
import { TodayCenter } from "@/components/dashboard/TodayCenter";
import SubjectCard from "@/components/student/SubjectCard";
import { Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import {
  getErrorMessage,
  insightsApi,
  studentAcademicApi,
  type StudentDashboard,
  type StudentGradebook,
  type StudentSubject,
  type TodayDashboard,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [today, setToday] = useState<TodayDashboard | null>(null);
  const [gradebook, setGradebook] = useState<StudentGradebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, subjectData, todayData, gradebookData] = await Promise.all([
        studentAcademicApi.getDashboard(),
        studentAcademicApi.getSubjects(),
        insightsApi.getToday(),
        insightsApi.getStudentGradebook(),
      ]);
      setDashboard(dashboardData);
      setSubjects(subjectData);
      setToday(todayData);
      setGradebook(gradebookData);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải không gian học tập của em."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const joinClass = async () => {
    if (!classCode.trim()) return;
    setJoinBusy(true);
    setJoinMessage(null);
    try {
      const result = await studentAcademicApi.joinClass(classCode.trim());
      setJoinMessage(result.message);
      setClassCode("");
      await loadDashboard();
    } catch (joinError) {
      setJoinMessage(getErrorMessage(joinError, "Không thể tham gia lớp học."));
    } finally {
      setJoinBusy(false);
    }
  };

  const student = dashboard?.student;
  const assignments = dashboard?.assignments_status;

  return (
    <>
      <PageHeader
        title={`Chào ${student?.name || "em"}`}
        description="Môn học, việc cần làm và thời khóa biểu của em được tập trung tại đây."
        actions={<Button onClick={() => { setJoinMessage(null); setJoinOpen(true); }}><Plus className="size-4" aria-hidden="true" />Tham gia lớp</Button>}
      />

      {error ? (
        <ErrorState title="Không tải được trang học tập" description={error} action={<Button variant="secondary" onClick={() => void loadDashboard()}>Thử lại</Button>} />
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : (
        <>
          <section aria-labelledby="student-overview-title">
            <div className="mb-3"><h2 id="student-overview-title" className="text-base font-extrabold text-ink">Tổng quan học tập</h2></div>
            <Surface className="grid overflow-hidden md:grid-cols-3">
              {[
                {
                  label: "Lớp học",
                  value: student?.class_name || "Chưa tham gia",
                  note: "Lớp hiện tại của em",
                  icon: School,
                  tone: "bg-brand-soft text-brand-strong",
                  bar: "bg-brand",
                  valueClassName: "text-2xl",
                },
                {
                  label: "Bài tập cần làm",
                  value: assignments?.pending ?? 0,
                  note: `Trong tổng số ${assignments?.total ?? 0} bài tập`,
                  icon: BookOpenCheck,
                  tone: "bg-sun-soft text-sun",
                  bar: "bg-sun",
                  valueClassName: "text-3xl",
                },
                {
                  label: "Đã hoàn thành",
                  value: assignments?.completed ?? 0,
                  note: "Bài tập đã nộp",
                  icon: CheckCircle2,
                  tone: "bg-mint-soft text-mint",
                  bar: "bg-mint",
                  valueClassName: "text-3xl",
                },
              ].map((metric, index) => (
                <div key={metric.label} className={cn("relative overflow-hidden p-5", index < 2 && "border-b border-line md:border-b-0 md:border-r")}>
                  <div className={cn("absolute inset-x-0 top-0 h-1", metric.bar)} aria-hidden="true" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink-soft">{metric.label}</p>
                      <p className={cn("mt-3 font-extrabold tracking-[-0.04em] text-ink", metric.valueClassName)}>{metric.value}</p>
                    </div>
                    <div className={cn("grid size-11 shrink-0 place-items-center rounded-[13px]", metric.tone)}>
                      <metric.icon className="size-5" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-ink-soft">{metric.note}</p>
                </div>
              ))}
            </Surface>
          </section>

          {today && <TodayCenter data={today} audience="student" />}

          {gradebook && <StudentGradebookSummary gradebook={gradebook} />}

          <section className="mt-7" aria-labelledby="subjects-title">
            <div className="mb-3 flex items-center justify-between gap-3"><div><h2 id="subjects-title" className="text-base font-extrabold text-ink">Môn học của em</h2><p className="mt-1 text-sm text-ink-soft">Chọn môn để xem bài tập và bài kiểm tra.</p></div><Link href="/student/thoi-khoa-bieu" className="inline-flex items-center gap-2 text-sm font-bold text-brand-strong"><CalendarDays className="size-4" />Thời khóa biểu</Link></div>
            {subjects.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <SubjectCard key={subject.id} id={subject.id} name={subject.name} teacher={subject.teacher} taskCount={subject.task_count} />)}</div> : <Surface><EmptyState title="Chưa có môn học" description="Tham gia lớp bằng mã lớp để bắt đầu nhận môn học, bài tập và bài kiểm tra." icon={School} action={<Button onClick={() => setJoinOpen(true)}>Nhập mã lớp</Button>} /></Surface>}
          </section>

          <section className="mt-7" aria-label="Truy cập nhanh">
            <Surface className="p-5 sm:p-6"><h2 className="font-extrabold text-ink">Truy cập nhanh</h2><div className="mt-3 grid gap-2">{[
              { href: "/student/lop-hoc", label: "Lớp học của em", icon: School },
              { href: "/student/thoi-khoa-bieu", label: "Thời khóa biểu", icon: CalendarDays },
            ].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-12 items-center gap-3 rounded-[13px] bg-surface-subtle px-3.5 text-sm font-bold text-ink transition-transform hover:translate-x-0.5"><Icon className="size-4 text-brand-strong" /><span className="flex-1">{label}</span><ArrowRight className="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5" /></Link>)}</div></Surface>
          </section>
        </>
      )}

      <Dialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Tham gia lớp học"
        description="Nhập mã do giáo viên cung cấp. Mã lớp không phân biệt chữ hoa và chữ thường."
        size="small"
        footer={<><Button variant="secondary" onClick={() => setJoinOpen(false)}>Đóng</Button><Button onClick={() => void joinClass()} disabled={joinBusy || !classCode.trim()}>{joinBusy ? "Đang tham gia..." : "Tham gia lớp"}</Button></>}
      >
        <Field label="Mã lớp" name="student-class-code" helper="Ví dụ: 10A1-X7K9">
          <Input id="student-class-code" value={classCode} onChange={(event) => setClassCode(event.target.value.toUpperCase())} placeholder="Nhập mã lớp" autoComplete="off" />
        </Field>
        {joinMessage && <p role="status" className="mt-4 rounded-[10px] bg-surface-subtle px-4 py-3 text-sm font-bold text-ink">{joinMessage}</p>}
      </Dialog>
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Brain, CalendarDays, CheckCircle2, Flame, Heart, Plus, School, Smile, Sparkles, Video, Zap } from "lucide-react";

import ChatBot from "@/components/ChatBot";
import SubjectCard from "@/components/student/SubjectCard";
import { Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface, StatusBadge } from "@/components/ui/primitives";
import { gamificationApi, getErrorMessage, studentAcademicApi, type StudentDashboard, type StudentSubject } from "@/lib/api";

interface GamificationStats {
  level: number;
  xp: number;
  coins: number;
  streak: number;
  badges_earned: number;
  total_badges: number;
  xp_progress: number;
}

interface CheckInResult {
  message: string;
  already_checked?: boolean;
  xp_earned?: number;
  coins_earned?: number;
}

const scoreCards = [
  { key: "happiness_score" as const, label: "Mức độ hạnh phúc", icon: Smile },
  { key: "engagement_score" as const, label: "Mức độ gắn kết", icon: Heart },
  { key: "mental_health_score" as const, label: "Sức khỏe tinh thần", icon: Brain },
];

function statusLabel(status?: string) {
  if (status === "needs_attention") return "Cần hỗ trợ";
  if (status === "warning") return "Cần theo dõi";
  return "Ổn định";
}

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInResult | null>(null);
  const [checkInBusy, setCheckInBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, subjectData] = await Promise.all([
        studentAcademicApi.getDashboard(),
        studentAcademicApi.getSubjects(),
      ]);
      setDashboard(dashboardData);
      setSubjects(subjectData);
      try {
        setGamification(await gamificationApi.getMyStats() as GamificationStats);
      } catch {
        setGamification(null);
      }
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

  const performCheckIn = async () => {
    setCheckInBusy(true);
    try {
      const result = await gamificationApi.checkIn() as CheckInResult;
      setCheckIn(result);
      setGamification(await gamificationApi.getMyStats() as GamificationStats);
    } catch (checkInError) {
      setCheckIn({ message: getErrorMessage(checkInError, "Không thể điểm danh lúc này.") });
    } finally {
      setCheckInBusy(false);
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
          {dashboard?.online_session?.active && dashboard.online_session.room_url && (
            <Surface className="mb-6 flex flex-col gap-4 border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-emerald-600 text-white"><Video className="size-5" aria-hidden="true" /></div><div><h2 className="font-extrabold text-ink">Lớp học trực tuyến đang diễn ra</h2><p className="mt-1 text-sm leading-6 text-ink-soft">Giáo viên đã mở phòng học cho lớp của em.</p></div></div>
              <a href={`https://meet.jit.si/${dashboard.online_session.room_url}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">Vào lớp ngay</a>
            </Surface>
          )}

          <section aria-labelledby="student-overview-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 id="student-overview-title" className="text-base font-extrabold text-ink">Tổng quan hôm nay</h2><StatusBadge>{statusLabel(student?.status)}</StatusBadge></div>
            <Surface className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
              {scoreCards.map(({ key, label, icon: Icon }) => (
                <div key={key} className="border-b border-line p-5 sm:border-r xl:border-b-0"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-ink-soft">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink">{student?.[key] ?? 0}%</p></div><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><Icon className="size-5" aria-hidden="true" /></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-subtle"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, student?.[key] ?? 0))}%` }} /></div></div>
              ))}
              <div className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-ink-soft">Bài tập cần làm</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink">{assignments?.pending ?? 0}</p></div><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><BookOpenCheck className="size-5" aria-hidden="true" /></div></div><p className="mt-4 text-xs text-ink-soft">Đã hoàn thành {assignments?.completed ?? 0}/{assignments?.total ?? 0} bài</p></div>
            </Surface>
          </section>

          <section className="mt-7" aria-labelledby="subjects-title">
            <div className="mb-3 flex items-center justify-between gap-3"><div><h2 id="subjects-title" className="text-base font-extrabold text-ink">Môn học của em</h2><p className="mt-1 text-sm text-ink-soft">Chọn môn để xem bài tập và bài kiểm tra.</p></div><Link href="/student/thoi-khoa-bieu" className="inline-flex items-center gap-2 text-sm font-bold text-brand-strong"><CalendarDays className="size-4" />Thời khóa biểu</Link></div>
            {subjects.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <SubjectCard key={subject.id} id={subject.id} name={subject.name} teacher={subject.teacher} taskCount={subject.task_count} />)}</div> : <Surface><EmptyState title="Chưa có môn học" description="Tham gia lớp bằng mã lớp để bắt đầu nhận môn học, bài tập và bài kiểm tra." icon={School} action={<Button onClick={() => setJoinOpen(true)}>Nhập mã lớp</Button>} /></Surface>}
          </section>

          <section className="mt-7 grid gap-4 lg:grid-cols-[1.35fr_1fr]" aria-label="Tiến độ và truy cập nhanh">
            <Surface className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold text-ink">Tiến độ học tập</h2><p className="mt-1 text-sm leading-6 text-ink-soft">Duy trì nhịp học đều đặn bằng điểm danh hằng ngày.</p></div><Button variant="secondary" onClick={() => void performCheckIn()} disabled={checkInBusy}><Flame className="size-4" />{checkInBusy ? "Đang ghi nhận..." : "Điểm danh"}</Button></div>
              {gamification ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[
                { label: "Cấp độ", value: gamification.level, icon: Zap },
                { label: "Điểm XP", value: gamification.xp, icon: Sparkles },
                { label: "Chuỗi ngày", value: gamification.streak, icon: Flame },
                { label: "Huy hiệu", value: `${gamification.badges_earned}/${gamification.total_badges}`, icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-[12px] bg-surface-subtle p-4"><Icon className="size-4 text-brand-strong" /><p className="mt-3 text-xl font-extrabold text-ink">{value}</p><p className="mt-1 text-xs font-bold text-ink-soft">{label}</p></div>)}</div> : <p className="mt-5 text-sm text-ink-soft">Chưa có dữ liệu tiến độ.</p>}
              {checkIn && <p role="status" className="mt-4 rounded-[10px] bg-brand-soft px-4 py-3 text-sm font-bold text-brand-strong">{checkIn.message}</p>}
            </Surface>
            <Surface className="p-5"><h2 className="font-extrabold text-ink">Truy cập nhanh</h2><div className="mt-3 divide-y divide-line">{[
              { href: "/student/lop-hoc", label: "Lớp học của em", icon: School },
              { href: "/student/thoi-khoa-bieu", label: "Thời khóa biểu", icon: CalendarDays },
              { href: "/student/ai-tutor", label: "Trợ lý học tập", icon: Brain },
            ].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 py-3 text-sm font-bold text-ink"><Icon className="size-4 text-brand-strong" /><span className="flex-1">{label}</span><ArrowRight className="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5" /></Link>)}</div></Surface>
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
      <ChatBot />
    </>
  );
}

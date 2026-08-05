"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Brain, GraduationCap, Heart, School, Smile, UserRound, Users, Video } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { assignmentsApi, getErrorMessage, studentAcademicApi, teacherQuizzesApi, type Assignment, type StudentClassDetails, type TeacherQuiz } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ClassTab = "overview" | "assignments" | "quizzes";

export default function StudentClassPage() {
  const { user } = useAuth();
  const [classData, setClassData] = useState<StudentClassDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ClassTab>("overview");

  const loadData = useCallback(async () => {
    if (!user?.class_id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [details, assignmentData, quizData] = await Promise.all([studentAcademicApi.getClass(user.class_id), assignmentsApi.list(), teacherQuizzesApi.list()]);
      setClassData(details);
      setAssignments(assignmentData.filter((item) => item.class_id === user.class_id));
      setQuizzes(quizData.filter((item) => item.class_id === user.class_id && item.status === "active"));
    } catch (loadError) { setError(getErrorMessage(loadError, "Không thể tải lớp học.")); }
    finally { setLoading(false); }
  }, [user?.class_id]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <><PageHeader title="Lớp học" description="Đang tải thông tin lớp..." /><Skeleton className="h-80" /></>;
  if (!user?.class_id) return <EmptyState title="Em chưa tham gia lớp" description="Quay lại trang tổng quan và nhập mã lớp do giáo viên cung cấp." icon={School} action={<Link href="/student" className="inline-flex min-h-11 items-center rounded-[10px] bg-brand px-4 text-sm font-bold text-white">Về trang tổng quan</Link>} />;
  if (error || !classData) return <ErrorState title="Không tải được lớp học" description={error || "Không tìm thấy thông tin lớp."} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} />;

  const signals = [
    { label: "Hạnh phúc", value: classData.happiness_score, icon: Smile },
    { label: "Gắn kết", value: classData.engagement_score, icon: Heart },
    { label: "Tinh thần", value: classData.mental_health_score, icon: Brain },
  ];

  return (
    <>
      <PageHeader title={classData.name} description={`Khối ${classData.grade} · ${classData.student_count} học sinh · Giáo viên chủ nhiệm ${classData.teacher_name || "chưa phân công"}`} actions={classData.online_enabled && classData.meeting_link ? <a href={classData.meeting_link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"><Video className="size-4" />Vào lớp trực tuyến</a> : undefined} />

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-[12px] border border-line bg-surface p-1" role="tablist" aria-label="Thông tin lớp học">{[["overview", "Tổng quan"], ["assignments", `Bài tập (${assignments.length})`], ["quizzes", `Kiểm tra (${quizzes.length})`]].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key as ClassTab)} className={`min-h-10 whitespace-nowrap rounded-[9px] px-4 text-sm font-bold ${tab === key ? "bg-brand text-white" : "text-ink-soft hover:bg-surface-subtle hover:text-ink"}`}>{label}</button>)}</div>

      {tab === "overview" && <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><Surface className="p-5"><h2 className="font-extrabold text-ink">Tín hiệu lớp học</h2><p className="mt-1 text-sm text-ink-soft">Chỉ số tổng hợp giúp cả lớp theo dõi môi trường học tập.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{signals.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-[12px] bg-surface-subtle p-4"><div className="flex items-center justify-between"><Icon className="size-4 text-brand-strong" /><span className="text-xl font-extrabold text-ink">{value}%</span></div><p className="mt-3 text-xs font-bold text-ink-soft">{label}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>)}</div></Surface><Surface className="p-5"><h2 className="font-extrabold text-ink">Thông tin lớp</h2><div className="mt-4 grid gap-3">{[{ label: "Giáo viên chủ nhiệm", value: classData.teacher_name || "Chưa phân công", icon: UserRound }, { label: "Sĩ số", value: `${classData.student_count} học sinh`, icon: Users }, { label: "Khối lớp", value: classData.grade, icon: GraduationCap }].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-[10px] bg-surface-subtle p-3"><Icon className="size-4 text-brand-strong" /><div><p className="text-xs text-ink-soft">{label}</p><p className="text-sm font-extrabold text-ink">{value}</p></div></div>)}</div></Surface></div>}

      {tab === "assignments" && (assignments.length ? <div className="grid gap-3">{assignments.map((item) => <Surface key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-ink">{item.title}</h3><p className="mt-1 text-sm text-ink-soft">{item.subject || "Bài tập chung"} · {item.total_points} điểm</p></div><Link href={`/student/assignment/${item.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-bold text-white">Mở bài tập <ArrowRight className="size-4" /></Link></Surface>)}</div> : <EmptyState title="Chưa có bài tập" description="Giáo viên chưa giao bài tập cho lớp." icon={BookOpenCheck} />)}

      {tab === "quizzes" && (quizzes.length ? <div className="grid gap-3">{quizzes.map((item) => <Surface key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-ink">{item.title}</h3><p className="mt-1 text-sm text-ink-soft">{item.subject || "Kiểm tra chung"} · {item.total_questions} câu</p></div><Link href={`/student/quiz/${item.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-bold text-white">Vào kiểm tra <ArrowRight className="size-4" /></Link></Surface>)}</div> : <EmptyState title="Chưa có bài kiểm tra đang mở" description="Bài kiểm tra sẽ xuất hiện khi giáo viên phát hành." icon={Brain} />)}
    </>
  );
}

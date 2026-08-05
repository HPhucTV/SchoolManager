"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, Brain, CheckCircle2, Clock3, Mail, Phone, UserRound, Video } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, studentAcademicApi, type SubjectDetails } from "@/lib/api";

type SubjectTab = "overview" | "assignments" | "quizzes";

function formatDate(value?: string | null) {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function StudentSubjectPage() {
  const params = useParams<{ id: string }>();
  const subjectName = decodeURIComponent(params.id);
  const [data, setData] = useState<SubjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SubjectTab>("overview");

  const loadSubject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await studentAcademicApi.getSubject(subjectName)); }
    catch (loadError) { setError(getErrorMessage(loadError, "Không thể tải môn học.")); }
    finally { setLoading(false); }
  }, [subjectName]);

  useEffect(() => { void loadSubject(); }, [loadSubject]);

  if (loading) return <><PageHeader title={subjectName} description="Đang tải nội dung môn học..." /><Skeleton className="h-72" /></>;
  if (error || !data) return <ErrorState title="Không tải được môn học" description={error || "Không tìm thấy dữ liệu môn học."} action={<Button variant="secondary" onClick={() => void loadSubject()}>Thử lại</Button>} />;

  const activeAssignments = data.assignments.filter((item) => item.status !== "submitted").length;
  const pendingQuizzes = data.quizzes.filter((item) => !item.has_attempted).length;

  return (
    <>
      <PageHeader title={data.subject} description="Theo dõi giáo viên, bài tập và bài kiểm tra của môn học này." actions={data.class_info?.online_enabled && data.class_info.meeting_link ? <a href={data.class_info.meeting_link.startsWith("http") ? data.class_info.meeting_link : `https://${data.class_info.meeting_link}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"><Video className="size-4" />Vào lớp trực tuyến</a> : undefined} />

      <Surface className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><UserRound className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-soft">Giáo viên phụ trách</p><h2 className="mt-1 font-extrabold text-ink">{data.class_info?.teacher_name || "Chưa phân công"}</h2></div></div>
        <div className="flex flex-wrap gap-2">{data.class_info?.teacher_email && <a className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-line px-3 text-sm font-bold text-ink hover:bg-surface-subtle" href={`mailto:${data.class_info.teacher_email}`}><Mail className="size-4" />Email</a>}{data.class_info?.teacher_phone && <a className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-line px-3 text-sm font-bold text-ink hover:bg-surface-subtle" href={`tel:${data.class_info.teacher_phone}`}><Phone className="size-4" />Gọi điện</a>}</div>
      </Surface>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-[12px] border border-line bg-surface p-1" role="tablist" aria-label="Nội dung môn học">{[
        ["overview", "Tổng quan"], ["assignments", `Bài tập (${data.assignments.length})`], ["quizzes", `Kiểm tra (${data.quizzes.length})`],
      ].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key as SubjectTab)} className={`min-h-10 whitespace-nowrap rounded-[9px] px-4 text-sm font-bold transition-colors ${tab === key ? "bg-brand text-white" : "text-ink-soft hover:bg-surface-subtle hover:text-ink"}`}>{label}</button>)}</div>

      {tab === "overview" && <div className="grid gap-4 md:grid-cols-2"><Surface className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-ink-soft">Bài tập cần làm</p><p className="mt-3 text-3xl font-extrabold text-ink">{activeAssignments}</p></div><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><BookOpenCheck className="size-5" /></div></div><Button className="mt-5" variant="secondary" onClick={() => setTab("assignments")}>Xem bài tập <ArrowRight className="size-4" /></Button></Surface><Surface className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-ink-soft">Kiểm tra chưa làm</p><p className="mt-3 text-3xl font-extrabold text-ink">{pendingQuizzes}</p></div><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><Brain className="size-5" /></div></div><Button className="mt-5" variant="secondary" onClick={() => setTab("quizzes")}>Xem bài kiểm tra <ArrowRight className="size-4" /></Button></Surface></div>}

      {tab === "assignments" && (data.assignments.length ? <div className="grid gap-3">{data.assignments.map((assignment) => <Surface key={assignment.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-ink">{assignment.title}</h3><p className="mt-2 flex items-center gap-2 text-sm text-ink-soft"><Clock3 className="size-4" />Hạn nộp: {formatDate(assignment.deadline)}</p></div>{assignment.status === "submitted" ? <div className="text-sm font-bold text-success"><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4" />Đã nộp</span>{assignment.score !== null && <p className="mt-1 text-right text-lg">{assignment.score} điểm</p>}</div> : <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-bold text-white hover:bg-brand-strong" href={`/student/assignment/${assignment.id}`}>Làm bài <ArrowRight className="size-4" /></Link>}</Surface>)}</div> : <EmptyState title="Chưa có bài tập" description="Giáo viên chưa giao bài tập cho môn học này." icon={BookOpenCheck} />)}

      {tab === "quizzes" && (data.quizzes.length ? <div className="grid gap-3">{data.quizzes.map((quiz) => <Surface key={quiz.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold text-ink">{quiz.title}</h3><p className="mt-2 text-sm text-ink-soft">{quiz.total_questions} câu hỏi</p></div>{quiz.has_attempted ? <div className="text-sm font-bold text-success"><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4" />Đã hoàn thành</span>{quiz.score !== null && <p className="mt-1 text-right text-lg">{quiz.score}%</p>}</div> : <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-bold text-white hover:bg-brand-strong" href={`/student/quiz/${quiz.id}`}>Vào kiểm tra <ArrowRight className="size-4" /></Link>}</Surface>)}</div> : <EmptyState title="Chưa có bài kiểm tra" description="Giáo viên chưa mở bài kiểm tra cho môn học này." icon={Brain} />)}
    </>
  );
}

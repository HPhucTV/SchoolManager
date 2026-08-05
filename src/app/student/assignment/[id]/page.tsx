"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Send } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog, ErrorState } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, studentCourseworkApi, type Assignment, type AssignmentSubmission } from "@/lib/api";

export default function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assignmentId = Number(id);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionData] = await Promise.all([studentCourseworkApi.getAssignment(assignmentId), studentCourseworkApi.getSubmission(assignmentId)]);
      setAssignment(assignmentData);
      setSubmission(submissionData);
    } catch (loadError) { setError(getErrorMessage(loadError, "Không thể tải bài tập.")); }
    finally { setLoading(false); }
  }, [assignmentId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const submit = async () => {
    if (!assignment) return;
    setSubmitting(true);
    try {
      const result = await studentCourseworkApi.submitAssignment(assignment.id, assignment.questions.map((question) => ({ question_id: question.id as number, answer_text: answers[question.id as number] })));
      setSubmission(result);
      setConfirmOpen(false);
      toast.success("Đã nộp bài tập");
    } catch (submitError) { toast.error(getErrorMessage(submitError, "Không thể nộp bài.")); }
    finally { setSubmitting(false); }
  };

  if (loading) return <><PageHeader title="Bài tập" description="Đang tải nội dung bài tập..." /><Skeleton className="h-80" /></>;
  if (error || !assignment) return <ErrorState title="Không tải được bài tập" description={error || "Không tìm thấy bài tập."} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} />;

  const deadlinePassed = Boolean(assignment.deadline && new Date(assignment.deadline) < new Date());
  const unanswered = assignment.questions.filter((question) => !answers[question.id as number]?.trim()).length;

  return (
    <>
      <PageHeader title={assignment.title} description={assignment.description || `${assignment.subject || "Bài tập"} · ${assignment.questions.length} câu · ${assignment.total_points} điểm`} actions={<Link href="/student" className="inline-flex min-h-11 items-center rounded-[10px] border border-line bg-surface px-4 text-sm font-bold text-ink hover:bg-surface-subtle">Về tổng quan</Link>} />
      <Surface className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ink-soft"><span>{assignment.subject || "Bài tập chung"}</span><span>{assignment.total_points} điểm</span>{assignment.deadline && <span className={`inline-flex items-center gap-2 ${deadlinePassed ? "text-danger" : ""}`}><Clock3 className="size-4" />Hạn {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(assignment.deadline))}</span>}</div>{submission && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-success"><CheckCircle2 className="size-4" />{submission.status === "graded" ? `Đã chấm: ${submission.total_score}/${assignment.total_points}` : "Đã nộp"}</span>}</Surface>

      <div className="grid gap-4">{[...assignment.questions].map((question, index) => {
        const questionId = question.id as number;
        const submittedAnswer = submission?.answers.find((answer) => answer.question_id === questionId);
        const options = [["A", question.option_a], ["B", question.option_b], ["C", question.option_c], ["D", question.option_d]].filter((entry) => entry[1]);
        return <Surface key={questionId} className="p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-extrabold uppercase tracking-[0.06em] text-brand-strong">Câu {index + 1}</span><h2 className="mt-2 text-base font-extrabold leading-7 text-ink">{question.question_text}</h2></div><span className="shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-bold text-ink-soft">{question.points} điểm</span></div>
          {question.question_type === "essay" ? <Textarea className="mt-4" aria-label={`Câu trả lời câu ${index + 1}`} value={submission ? submittedAnswer?.answer_text || "" : answers[questionId] || ""} onChange={(event) => setAnswers({ ...answers, [questionId]: event.target.value })} disabled={Boolean(submission)} placeholder="Nhập câu trả lời của em" /> : <fieldset className="mt-4 grid gap-2"><legend className="sr-only">Chọn đáp án câu {index + 1}</legend>{options.map(([option, text]) => { const selected = (submission ? submittedAnswer?.answer_text : answers[questionId]) === option; return <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-sm font-semibold transition-colors ${selected ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-ink hover:border-brand/35"}`}><input type="radio" name={`question-${questionId}`} value={option} checked={selected} onChange={() => setAnswers({ ...answers, [questionId]: option as string })} disabled={Boolean(submission)} /><span className="font-extrabold">{option}</span><span>{text}</span></label>; })}</fieldset>}
          {submittedAnswer && <div className="mt-4 rounded-[10px] bg-surface-subtle px-4 py-3 text-sm text-ink"><p className="font-bold">Điểm: {submittedAnswer.score}/{question.points}</p>{submittedAnswer.feedback && <p className="mt-1 text-ink-soft">Nhận xét: {submittedAnswer.feedback}</p>}</div>}
        </Surface>;
      })}</div>

      {!submission && <div className="sticky bottom-4 mt-6 flex flex-col items-center justify-between gap-3 rounded-[14px] border border-line bg-surface/95 p-4 shadow-[0_16px_50px_rgba(28,52,84,0.16)] backdrop-blur sm:flex-row"><p className="text-sm font-bold text-ink-soft">{unanswered ? `Còn ${unanswered} câu chưa trả lời` : "Em đã trả lời tất cả câu hỏi"}</p><Button onClick={() => setConfirmOpen(true)} disabled={Boolean(unanswered) || deadlinePassed || assignment.status !== "active"}><Send className="size-4" />{deadlinePassed ? "Đã hết hạn" : assignment.status !== "active" ? "Bài đã đóng" : "Nộp bài"}</Button></div>}

      <ConfirmDialog open={confirmOpen} title="Nộp bài tập?" description="Sau khi nộp, em không thể thay đổi câu trả lời." confirmLabel="Nộp bài" tone="primary" busy={submitting} onClose={() => setConfirmOpen(false)} onConfirm={() => void submit()} />
    </>
  );
}

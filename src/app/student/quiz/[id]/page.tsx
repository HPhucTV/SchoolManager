"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Send } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, studentCourseworkApi, type QuizResult, type StudentQuiz } from "@/lib/api";

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function StudentQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const quizId = Number(id);
  const [quiz, setQuiz] = useState<StudentQuiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const previousResult = await studentCourseworkApi.getQuizResult(quizId);
      if (previousResult.attempted) {
        setResult(previousResult);
      } else {
        const quizData = await studentCourseworkApi.getQuiz(quizId);
        setQuiz(quizData);
        if (quizData.deadline) setTimeLeft(Math.max(0, Math.floor((new Date(quizData.deadline).getTime() - Date.now()) / 1000)));
      }
    } catch (loadError) { setError(getErrorMessage(loadError, "Không thể tải bài kiểm tra.")); }
    finally { setLoading(false); }
  }, [quizId]);

  useEffect(() => { void loadQuiz(); }, [loadQuiz]);

  const submitQuiz = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const quizResult = await studentCourseworkApi.submitQuiz(quizId, answers);
      setResult(quizResult);
      setConfirmOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Đã nộp bài kiểm tra");
    } catch (submitError) { toast.error(getErrorMessage(submitError, "Không thể nộp bài kiểm tra.")); }
    finally { setSubmitting(false); }
  }, [answers, quizId, result, submitting]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = window.setInterval(() => setTimeLeft((current) => current === null ? null : Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [result, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && quiz && !result && !submitting) void submitQuiz();
  }, [quiz, result, submitQuiz, submitting, timeLeft]);

  if (loading) return <><PageHeader title="Bài kiểm tra" description="Đang tải đề kiểm tra..." /><Skeleton className="h-80" /></>;
  if (error) return <ErrorState title="Không tải được bài kiểm tra" description={error} action={<Button variant="secondary" onClick={() => void loadQuiz()}>Thử lại</Button>} />;

  if (result) return <Surface className="mx-auto max-w-xl p-7 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-success"><CheckCircle2 className="size-7" /></div><h1 className="mt-5 text-2xl font-extrabold text-ink">Đã hoàn thành bài kiểm tra</h1><p className="mt-2 text-sm text-ink-soft">Kết quả của em đã được ghi nhận.</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-[12px] bg-surface-subtle p-5"><p className="text-xs font-bold text-ink-soft">Số câu đúng</p><p className="mt-2 text-3xl font-extrabold text-ink">{result.score}/{result.total_questions}</p></div><div className="rounded-[12px] bg-surface-subtle p-5"><p className="text-xs font-bold text-ink-soft">Tỷ lệ đúng</p><p className="mt-2 text-3xl font-extrabold text-brand-strong">{result.percentage}%</p></div></div><Link href="/student" className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-bold text-white">Về trang tổng quan</Link></Surface>;
  if (!quiz) return <ErrorState title="Không tìm thấy bài kiểm tra" description="Bài kiểm tra không tồn tại hoặc chưa được mở." />;

  const answered = Object.keys(answers).length;
  const unanswered = quiz.questions.length - answered;

  return (
    <>
      <PageHeader title={quiz.title} description={`${quiz.subject || "Bài kiểm tra"} · ${quiz.topic || "Chủ đề tổng hợp"} · ${quiz.total_questions} câu`} actions={timeLeft !== null ? <span className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] px-4 text-sm font-extrabold ${timeLeft < 300 ? "bg-red-50 text-danger" : "bg-brand-soft text-brand-strong"}`}><Clock3 className="size-4" />{formatTime(timeLeft)}</span> : undefined} />
      <Surface className="mb-5 p-4"><div className="flex items-center justify-between text-sm font-bold"><span className="text-ink-soft">Tiến độ làm bài</span><span className="text-ink">{answered}/{quiz.questions.length} câu</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${quiz.questions.length ? (answered / quiz.questions.length) * 100 : 0}%` }} /></div></Surface>

      <div className="grid gap-4">{quiz.questions.map((question, index) => <Surface key={question.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-extrabold uppercase tracking-[0.06em] text-brand-strong">Câu {index + 1}</span><h2 className="mt-2 text-base font-extrabold leading-7 text-ink">{question.question_text}</h2></div><span className="shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-bold text-ink-soft">{question.difficulty === "easy" ? "Dễ" : question.difficulty === "hard" ? "Khó" : "Trung bình"}</span></div><fieldset className="mt-4 grid gap-2"><legend className="sr-only">Chọn đáp án câu {index + 1}</legend>{(["A", "B", "C", "D"] as const).map((option) => { const text = question[`option_${option.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"]; const selected = answers[question.id] === option; return <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-sm font-semibold transition-colors ${selected ? "border-brand bg-brand-soft text-brand-strong" : "border-line text-ink hover:border-brand/35"}`}><input type="radio" name={`quiz-question-${question.id}`} value={option} checked={selected} onChange={() => setAnswers({ ...answers, [question.id]: option })} /><span className="font-extrabold">{option}</span><span>{text}</span></label>; })}</fieldset></Surface>)}</div>

      <div className="sticky bottom-4 mt-6 flex flex-col items-center justify-between gap-3 rounded-[14px] border border-line bg-surface/95 p-4 shadow-[0_16px_50px_rgba(28,52,84,0.16)] backdrop-blur sm:flex-row"><p className="text-sm font-bold text-ink-soft">{unanswered ? `Còn ${unanswered} câu chưa trả lời` : "Em đã trả lời tất cả câu hỏi"}</p><Button onClick={() => setConfirmOpen(true)} disabled={submitting || timeLeft === 0}><Send className="size-4" />Nộp bài</Button></div>
      <ConfirmDialog open={confirmOpen} title="Nộp bài kiểm tra?" description={unanswered ? `Em còn ${unanswered} câu chưa trả lời. Em vẫn muốn nộp bài?` : "Câu trả lời sẽ được chấm ngay sau khi nộp."} confirmLabel="Nộp bài" tone="primary" busy={submitting} onClose={() => setConfirmOpen(false)} onConfirm={() => void submitQuiz()} />
    </>
  );
}

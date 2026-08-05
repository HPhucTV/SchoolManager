"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, HelpCircle, Lightbulb, RefreshCw, Trophy, XCircle } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { gamesApi, getErrorMessage, type CrosswordQuestion } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function CrosswordGame() {
  const [question, setQuestion] = useState<CrosswordQuestion | null>(null);
  const [answer, setAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [correct, setCorrect] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  async function loadQuestion() {
    setLoading(true);
    setError("");
    setMessage("");
    setCorrect(false);
    setHintVisible(false);
    try {
      const nextQuestion = await gamesApi.getCrossword();
      setQuestion(nextQuestion);
      setAnswer(Array.from({ length: nextQuestion.length }, () => ""));
      inputRefs.current = [];
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải ô chữ."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadQuestion(); }, []);

  function changeLetter(index: number, value: string) {
    const letter = value.replace(/[^a-zA-ZÀ-ỹ]/g, "").slice(-1).toUpperCase();
    setAnswer((current) => current.map((item, itemIndex) => itemIndex === index ? letter : item));
    if (letter) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !answer[index]) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft") inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight") inputRefs.current[index + 1]?.focus();
  }

  async function checkAnswer() {
    if (!question || answer.some((letter) => !letter)) { setMessage("Hãy điền đủ các ô trước khi kiểm tra."); return; }
    setChecking(true);
    setError("");
    try {
      const result = await gamesApi.checkCrossword(question.id, answer.join(""));
      setCorrect(result.correct);
      setMessage(result.message);
      if (result.correct) setScore((current) => current + result.bonus_score);
    } catch (checkError) {
      setError(getErrorMessage(checkError, "Không thể kiểm tra đáp án."));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <PageHeader title="Ô chữ kiến thức" description="Một câu hỏi ngắn, một đáp án bí mật và một chút điểm thưởng cho phiên học hôm nay." actions={<Link href="/student/entertain" className="inline-flex min-h-9 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-xs font-bold text-ink-soft hover:border-brand/40 hover:text-ink"><ArrowLeft className="size-4" />Góc giải trí</Link>} />
      {error && <ErrorState className="mb-5" title="Không thể tải trò chơi" description={error} action={<Button variant="secondary" size="small" onClick={() => void loadQuestion()}><RefreshCw className="size-4" />Thử lại</Button>} />}
      {loading && !question ? <Surface className="mx-auto max-w-3xl space-y-4 p-6"><Skeleton className="h-5 w-32" /><Skeleton className="h-16 w-full" /><Skeleton className="h-20 w-full" /></Surface> : question ? <Surface className="mx-auto max-w-3xl p-6 text-center sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand-strong">{question.topic}</span><span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-strong"><Trophy className="size-4" />{score} điểm</span></div><div className="mx-auto mt-7 max-w-2xl"><HelpCircle className="mx-auto size-7 text-brand-strong" /><h2 className="mt-3 text-xl font-extrabold leading-8 text-ink">{question.question}</h2></div><div className="mt-7 flex flex-wrap justify-center gap-2" aria-label={`Đáp án gồm ${question.length} chữ cái`}>{answer.map((letter, index) => <input key={index} ref={(element) => { inputRefs.current[index] = element; }} id={`crossword-${index}`} aria-label={`Chữ cái thứ ${index + 1}`} value={letter} maxLength={1} disabled={correct || checking} onChange={(event) => changeLetter(index, event.target.value)} onKeyDown={(event) => handleKeyDown(index, event)} className={cn("size-12 rounded-[10px] border-2 bg-surface text-center text-xl font-extrabold uppercase text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/10 sm:size-14", correct ? "border-emerald-300 bg-emerald-50 text-success" : "border-line")} autoComplete="off" />)}</div><div className="mt-7 flex flex-wrap justify-center gap-2">{!correct ? <><Button variant="secondary" onClick={() => setHintVisible((value) => !value)}><Lightbulb className="size-4" />{hintVisible ? "Ẩn gợi ý" : "Xem gợi ý"}</Button><Button onClick={() => void checkAnswer()} disabled={checking}>{checking ? "Đang kiểm tra..." : "Kiểm tra đáp án"}</Button></> : <Button onClick={() => void loadQuestion()}><RefreshCw className="size-4" />Câu tiếp theo</Button>}</div>{hintVisible && <p className="mx-auto mt-5 max-w-xl rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><Lightbulb className="mr-2 inline size-4" />{question.hint}</p>}{message && <p role="status" className={cn("mt-5 flex items-center justify-center gap-2 text-sm font-extrabold", correct ? "text-success" : "text-danger")}>{correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}{message}</p>}</Surface> : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Heart, HelpCircle, Lightbulb, RefreshCw, SkipForward, Sparkles, XCircle } from "lucide-react";

import { ErrorState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { gamesApi, getErrorMessage, type Riddle } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RiddlesPage() {
  const [riddle, setRiddle] = useState<Riddle | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [skips, setSkips] = useState(3);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState<"won" | "lost" | null>(null);
  const [error, setError] = useState("");
  const nextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadNext([]);
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  async function loadNext(currentHistory: number[]) {
    setLoading(true);
    setError("");
    setFeedback(null);
    setAnswer("");
    setHintVisible(false);
    try {
      const response = await gamesApi.nextRiddle(currentHistory);
      if (!response.riddle) { setRiddle(null); setGameOver("won"); return; }
      setRiddle(response.riddle);
      setHistory((previous) => [...previous, response.riddle!.id]);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải câu đố."));
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!riddle || !answer.trim() || loading || gameOver || feedback?.correct) return;
    setLoading(true);
    setError("");
    try {
      const response = await gamesApi.checkRiddle(riddle.id, answer.trim());
      if (response.result.correct) {
        setScore((value) => value + 10);
        setFeedback({ correct: true, text: "Chính xác! +10 điểm." });
        nextTimeoutRef.current = setTimeout(() => { void loadNext(history); }, 900);
      } else {
        const nextHearts = hearts - 1;
        setHearts(nextHearts);
        if (nextHearts <= 0) {
          const reveal = await gamesApi.revealRiddle(riddle.id);
          setFeedback({ correct: false, text: `Đáp án đúng là: ${reveal.result.correct_answer}` });
          setGameOver("lost");
        } else {
          setFeedback({ correct: false, text: "Chưa đúng. Bạn còn một cơ hội khác." });
        }
      }
    } catch (answerError) {
      setError(getErrorMessage(answerError, "Không thể kiểm tra đáp án."));
    } finally {
      setLoading(false);
    }
  }

  async function skip() {
    if (!riddle || skips <= 0 || loading || gameOver || feedback?.correct) return;
    setSkips((value) => value - 1);
    await loadNext(history);
  }

  function restart() {
    setHistory([]);
    setScore(0);
    setHearts(3);
    setSkips(3);
    setGameOver(null);
    void loadNext([]);
  }

  return (
    <div>
      <PageHeader title="Giải đố vui" description="Một trò chơi ngắn để khởi động sự tò mò. Bạn có ba trái tim và ba lượt bỏ qua." actions={<div className="flex items-center gap-2 rounded-full bg-surface-subtle px-3 py-2 text-sm font-extrabold text-ink"><Heart className="size-4 text-danger" fill="currentColor" />{hearts}<span className="mx-1 text-line">·</span><Sparkles className="size-4 text-brand-strong" />{score}</div>} />
      {error && <ErrorState className="mb-5" title="Không thể tiếp tục" description={error} action={<Button variant="secondary" size="small" onClick={() => void loadNext(history)}><RefreshCw className="size-4" />Thử lại</Button>} />}
      {loading && !riddle ? <Surface className="mx-auto max-w-2xl space-y-4 p-6"><Skeleton className="h-5 w-32" /><Skeleton className="h-24 w-full" /><Skeleton className="h-11 w-full" /></Surface> : gameOver ? <Surface className="mx-auto max-w-2xl p-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand-strong">{gameOver === "won" ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}</div><h2 className="mt-4 text-xl font-extrabold text-ink">{gameOver === "won" ? "Bạn đã hoàn thành kho câu đố" : "Hết lượt thử"}</h2><p className="mt-2 text-sm leading-6 text-ink-soft">Điểm phiên này: <strong className="text-brand-strong">{score}</strong>. Bạn có thể bắt đầu lại bất cứ lúc nào.</p>{feedback && <p className="mt-4 rounded-[10px] bg-surface-subtle px-4 py-3 text-sm font-bold text-ink">{feedback.text}</p>}<Button className="mt-5" onClick={restart}><RefreshCw className="size-4" />Chơi lại</Button></Surface> : riddle ? <Surface className="mx-auto max-w-2xl p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand-strong">{riddle.category || "Đố vui"}</span><div className="flex gap-2"><Button variant="secondary" size="small" disabled={skips <= 0 || loading} onClick={() => void skip()}><SkipForward className="size-4" />Bỏ qua ({skips})</Button><Button variant="ghost" size="small" disabled={!riddle.hint || hintVisible || loading} onClick={() => setHintVisible(true)}><Lightbulb className="size-4" />Gợi ý</Button></div></div><div className="mt-7 flex gap-3"><HelpCircle className="mt-1 size-6 shrink-0 text-brand-strong" /><h2 className="text-xl font-extrabold leading-8 text-ink">{riddle.question}</h2></div>{hintVisible && riddle.hint && <p className="mt-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><Lightbulb className="mr-2 inline size-4" />{riddle.hint}</p>}<Field name="riddle-answer" label="Đáp án của bạn" helper="Bạn có thể nhập câu trả lời ngắn bằng tiếng Việt." className="mt-7"><Input value={answer} disabled={loading} placeholder="Nhập đáp án..." onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submitAnswer(); }} /></Field><Button className="mt-4 w-full" disabled={!answer.trim() || loading} onClick={() => void submitAnswer()}>{loading ? "Đang kiểm tra..." : "Kiểm tra đáp án"}</Button>{feedback && <p role="status" className={cn("mt-4 flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-extrabold", feedback.correct ? "bg-emerald-50 text-success" : "bg-red-50 text-danger")}>{feedback.correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}{feedback.text}</p>}</Surface> : null}
    </div>
  );
}

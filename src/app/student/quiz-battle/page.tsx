"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Hash, Loader2, Medal, RefreshCw, Swords, Users } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface, StatusBadge } from "@/components/ui/primitives";
import { getErrorMessage, quizBattleApi, type ActiveBattle, type BattleLeaderboardEntry, type BattleQuestion, type BattleStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

type BattleView = "lobby" | "waiting" | "playing" | "result";
type BattleAnswerResult = { correct: boolean; points_earned: number; total_score: number; battle_finished: boolean; correct_answer?: string };
type Answer = "" | "A" | "B" | "C" | "D";

const OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d"] as const;
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function StudentQuizBattlePage() {
  const [activeBattles, setActiveBattles] = useState<ActiveBattle[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [battleId, setBattleId] = useState<number | null>(null);
  const [battle, setBattle] = useState<BattleStatus | null>(null);
  const [question, setQuestion] = useState<BattleQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [answerResult, setAnswerResult] = useState<BattleAnswerResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<BattleLeaderboardEntry[]>([]);
  const [view, setView] = useState<BattleView>("lobby");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const submitAnswerRef = useRef<((id: number, index: number, answer: Answer, timeTaken: number) => Promise<void>) | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const loadActive = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setActiveBattles(await quizBattleApi.getActive());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách trận đấu."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActive();
    return () => { stopPolling(); stopTimer(); };
  }, [loadActive, stopPolling, stopTimer]);

  const showResults = useCallback(async (id: number) => {
    stopPolling();
    stopTimer();
    try {
      setLeaderboard(await quizBattleApi.getLeaderboard(id));
      setView("result");
    } catch (resultError) {
      setError(getErrorMessage(resultError, "Không thể tải kết quả trận đấu."));
    }
  }, [stopPolling, stopTimer]);

  const loadQuestion = useCallback(async (id: number, index: number) => {
    setBusy(true);
    setError("");
    try {
      const nextQuestion = await quizBattleApi.getQuestion(id, index);
      if (nextQuestion.finished) {
        await showResults(id);
        return;
      }
      setQuestion(nextQuestion);
      setQuestionIndex(index);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setTimeLeft(nextQuestion.time_limit ?? 30);
      startTimeRef.current = Date.now();
      stopTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft((current) => {
          if (current <= 1) {
            stopTimer();
            void submitAnswerRef.current?.(id, index, "", (Date.now() - startTimeRef.current) / 1000);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch (questionError) {
      setError(getErrorMessage(questionError, "Không thể tải câu hỏi."));
    } finally {
      setBusy(false);
    }
  }, [showResults, stopTimer]);

  const pollBattle = useCallback((id: number) => {
    stopPolling();
    const refresh = async () => {
      try {
        const nextBattle = await quizBattleApi.getStatus(id);
        setBattle(nextBattle);
        if (nextBattle.status === "active") {
          stopPolling();
          setView("playing");
          await loadQuestion(id, 0);
        } else if (nextBattle.status === "finished") {
          await showResults(id);
        }
      } catch (pollError) {
        stopPolling();
        setError(getErrorMessage(pollError, "Không thể theo dõi trận đấu."));
      }
    };
    void refresh();
    pollRef.current = setInterval(() => { void refresh(); }, 2000);
  }, [loadQuestion, showResults, stopPolling]);

  async function join(code: string) {
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) { setError("Mã trận gồm 6 ký tự."); return; }
    setBusy(true);
    setError("");
    try {
      const response = await quizBattleApi.join(normalized);
      setBattleId(response.battle_id);
      setView("waiting");
      pollBattle(response.battle_id);
    } catch (joinError) {
      setError(getErrorMessage(joinError, "Không thể tham gia trận đấu."));
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(id: number, index: number, answer: Answer, timeTaken: number) {
    if (selectedAnswer !== null && answer !== "") return;
    stopTimer();
    setSelectedAnswer(answer);
    setBusy(true);
    try {
      const response = await quizBattleApi.submitAnswer(id, { question_index: index, answer, time_taken: timeTaken });
      setAnswerResult(response);
      if (response.battle_finished) window.setTimeout(() => { void showResults(id); }, 1200);
      else window.setTimeout(() => { void loadQuestion(id, index + 1); }, 1400);
    } catch (answerError) {
      setError(getErrorMessage(answerError, "Không thể ghi nhận câu trả lời."));
      setSelectedAnswer(null);
    } finally {
      setBusy(false);
    }
  }

  submitAnswerRef.current = submitAnswer;

  function reset() {
    stopPolling();
    stopTimer();
    setView("lobby");
    setBattleId(null);
    setBattle(null);
    setQuestion(null);
    setLeaderboard([]);
    setError("");
    void loadActive();
  }

  return (
    <div>
      <PageHeader title="Quiz Battle" description="Thử sức cùng bạn bè trong một trận đấu kiến thức có giới hạn thời gian." actions={<Button variant="secondary" size="small" onClick={() => void loadActive()}><RefreshCw className="size-4" />Làm mới</Button>} />
      {error && <ErrorState className="mb-5" title="Có vấn đề xảy ra" description={error} action={<Button variant="secondary" size="small" onClick={() => setError("")}>Đóng</Button>} />}

      {view === "lobby" && <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]"><Surface className="p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><Hash className="size-5" /></div><div><h2 className="text-base font-extrabold text-ink">Nhập mã trận đấu</h2><p className="text-sm text-ink-soft">Nhờ giáo viên chia sẻ mã gồm 6 ký tự.</p></div></div><Field name="battle-code" label="Mã trận" helper="Ví dụ: ABC123" className="mt-6"><Input value={joinCode} maxLength={6} autoCapitalize="characters" autoComplete="off" className="text-center text-lg font-extrabold tracking-[0.3em]" placeholder="ABC123" onChange={(event) => setJoinCode(event.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter") void join(joinCode); }} /></Field><Button className="mt-4 w-full" disabled={busy || joinCode.length !== 6} onClick={() => void join(joinCode)}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}Tham gia trận</Button></Surface><Surface className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-ink">Trận đang mở</h2><p className="mt-1 text-sm text-ink-soft">Các trận trong lớp của bạn.</p></div><StatusBadge><Users className="size-3" />{activeBattles.length} trận</StatusBadge></div>{loading ? <div className="mt-5 grid gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : activeBattles.length === 0 ? <EmptyState icon={Swords} title="Chưa có trận nào" description="Khi giáo viên mở trận, bạn sẽ thấy lời mời ở đây." /> : <div className="mt-5 grid gap-3">{activeBattles.map((item) => <div key={item.id} className="rounded-[12px] border border-line bg-surface-subtle p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-ink">{item.quiz_title}</h3><p className="mt-1 text-xs text-ink-soft">{item.quiz_subject} · {item.participants_count} người · {item.time_per_question}s/câu</p></div><StatusBadge>{item.status === "waiting" ? "Đang chờ" : "Đang diễn ra"}</StatusBadge></div>{item.joined ? <p className="mt-3 text-xs font-bold text-success">Bạn đã tham gia trận này.</p> : <Button size="small" className="mt-3" onClick={() => void join(item.battle_code)}>Tham gia</Button>}</div>)}</div>}</Surface></div>}

      {view === "waiting" && <Surface className="mx-auto max-w-2xl p-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand-strong"><Clock3 className="size-7" /></div><h2 className="mt-5 text-xl font-extrabold text-ink">Đang chờ giáo viên bắt đầu</h2><p className="mt-2 text-sm text-ink-soft">Mã trận <strong className="text-brand-strong">{battle?.battle_code ?? "..."}</strong></p><div className="mt-6 flex flex-wrap justify-center gap-2">{battle?.participants?.map((participant) => <span key={participant.id} className="rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-xs font-bold text-ink">{participant.name}{participant.is_me ? " (Bạn)" : ""}</span>)}</div><p className="mt-6 text-sm text-ink-soft">Danh sách sẽ tự cập nhật khi trận bắt đầu.</p><Button variant="secondary" className="mt-5" onClick={reset}>Rời phòng chờ</Button></Surface>}

      {view === "playing" && question && <div className="mx-auto max-w-3xl"><div className="mb-4 flex items-center justify-between gap-3"><span className="text-sm font-bold text-ink-soft">Câu {questionIndex + 1}/{question.total_questions ?? "?"}</span><span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold", timeLeft <= 5 ? "bg-red-50 text-danger" : "bg-brand-soft text-brand-strong")}><Clock3 className="size-4" />{timeLeft}s</span></div><Surface className="p-6 text-center sm:p-8"><p className="text-lg font-extrabold leading-8 text-ink">{question.question_text}</p></Surface><div className="mt-4 grid gap-3 sm:grid-cols-2">{OPTION_KEYS.map((key, index) => { const answer = OPTION_LABELS[index]; const option = question[key]; if (!option) return null; const selected = selectedAnswer === answer; const correct = answerResult?.correct && selected; const wrong = answerResult && selected && !answerResult.correct; return <button key={key} type="button" disabled={selectedAnswer !== null || busy} onClick={() => { if (battleId) void submitAnswer(battleId, questionIndex, answer, (Date.now() - startTimeRef.current) / 1000); }} className={cn("flex min-h-20 items-center gap-3 rounded-[12px] border p-4 text-left text-sm font-bold transition-[border-color,background-color,transform] active:translate-y-px", correct ? "border-emerald-300 bg-emerald-50 text-success" : wrong ? "border-red-300 bg-red-50 text-danger" : selected ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface hover:border-brand/40 hover:bg-surface-subtle", selectedAnswer !== null && !selected && "opacity-60")}><span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-xs font-extrabold text-brand-strong">{answer}</span>{option}</button>; })}</div>{answerResult && <p role="status" className={cn("mt-4 rounded-[10px] px-4 py-3 text-center text-sm font-extrabold", answerResult.correct ? "bg-emerald-50 text-success" : "bg-red-50 text-danger")}>{answerResult.correct ? `Chính xác! +${answerResult.points_earned} điểm.` : "Chưa đúng, hãy bình tĩnh cho câu tiếp theo."}</p>}</div>}

      {view === "result" && <Surface className="mx-auto max-w-2xl p-6 sm:p-8"><div className="text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand-strong"><Medal className="size-7" /></div><h2 className="mt-4 text-xl font-extrabold text-ink">Kết quả trận đấu</h2><p className="mt-1 text-sm text-ink-soft">Cảm ơn bạn đã tham gia và học cùng cả lớp.</p></div><div className="mt-6 divide-y divide-line">{leaderboard.map((entry) => <div key={`${entry.rank}-${entry.name}`} className={cn("flex items-center gap-3 py-3", entry.is_me && "rounded-[10px] bg-brand-soft px-3")}><span className="w-8 text-center text-sm font-extrabold text-ink-soft">#{entry.rank}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-ink">{entry.name}{entry.is_me ? " (Bạn)" : ""}</p><p className="text-xs text-ink-soft">{entry.correct}/{entry.total} câu đúng</p></div><span className="text-sm font-extrabold text-brand-strong">{entry.score} điểm</span></div>)}</div><Button className="mt-6 w-full" onClick={reset}>Về sảnh Quiz Battle</Button></Surface>}
    </div>
  );
}

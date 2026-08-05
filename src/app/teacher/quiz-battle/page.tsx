"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, RefreshCw, Swords, Users } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, StatusBadge, Surface } from "@/components/ui/primitives";
import { getErrorMessage, quizBattleApi, teacherQuizzesApi, type BattleStatus, type TeacherQuiz } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function TeacherQuizBattlePage() {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [createdBattle, setCreatedBattle] = useState<{ id: number; battle_code: string; quiz_title: string; total_questions: number; time_per_question: number } | null>(null);
  const [battle, setBattle] = useState<BattleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"load" | "create" | "start" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const loadQuizzes = useCallback(async () => {
    setBusy("load");
    setError("");
    try {
      setQuizzes(await teacherQuizzesApi.list());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải kho quiz."));
    } finally {
      setBusy(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuizzes();
    return stopPolling;
  }, [loadQuizzes, stopPolling]);

  const pollBattle = useCallback((id: number) => {
    stopPolling();
    const refresh = async () => {
      try {
        const status = await quizBattleApi.getStatus(id);
        setBattle(status);
        if (status.status === "finished") stopPolling();
      } catch (pollError) {
        stopPolling();
        setError(getErrorMessage(pollError, "Không thể theo dõi trận đấu."));
      }
    };
    void refresh();
    pollRef.current = setInterval(() => { void refresh(); }, 3000);
  }, [stopPolling]);

  async function createBattle() {
    if (!selectedQuiz) { setError("Hãy chọn một quiz trước khi tạo trận."); return; }
    setBusy("create");
    setError("");
    try {
      const result = await quizBattleApi.create({ quiz_id: selectedQuiz, time_per_question: timePerQuestion });
      setCreatedBattle(result);
      setBattle(null);
      setNotice("Đã tạo trận. Chia sẻ mã cho học sinh trong lớp.");
      pollBattle(result.id);
    } catch (createError) {
      setError(getErrorMessage(createError, "Không thể tạo trận Quiz Battle."));
    } finally {
      setBusy(null);
    }
  }

  async function startBattle() {
    if (!createdBattle) return;
    setBusy("start");
    setError("");
    try {
      await quizBattleApi.start(createdBattle.id);
      setNotice("Trận đấu đã bắt đầu.");
      setBattle(await quizBattleApi.getStatus(createdBattle.id));
    } catch (startError) {
      setError(getErrorMessage(startError, "Không thể bắt đầu trận đấu."));
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    stopPolling();
    setCreatedBattle(null);
    setBattle(null);
    setSelectedQuiz(null);
    setNotice("");
    setError("");
  }

  async function copyCode() {
    if (!createdBattle) return;
    try {
      await navigator.clipboard.writeText(createdBattle.battle_code);
      setNotice("Đã sao chép mã trận.");
    } catch {
      setNotice(`Mã trận: ${createdBattle.battle_code}`);
    }
  }

  return (
    <div>
      <PageHeader title="Quiz Battle cho lớp" description="Tạo một phòng thi nhanh, chia sẻ mã và theo dõi số người tham gia theo thời gian thực." actions={<Button variant="secondary" size="small" onClick={() => void loadQuizzes()} disabled={busy === "load"}><RefreshCw className="size-4" />Làm mới quiz</Button>} />
      {error && <ErrorState className="mb-5" title="Có vấn đề xảy ra" description={error} action={<Button variant="secondary" size="small" onClick={() => setError("")}>Đóng</Button>} />}
      {notice && <p role="status" className="mb-5 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-success dark:border-emerald-900 dark:bg-emerald-950/30">{notice}</p>}

      {!createdBattle ? <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><Surface className="p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><Swords className="size-5" /></div><div><h2 className="text-base font-extrabold text-ink">Tạo trận mới</h2><p className="text-sm text-ink-soft">Chọn quiz đã có câu hỏi và đặt nhịp độ.</p></div></div>{loading ? <div className="mt-6 grid gap-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : quizzes.length === 0 ? <EmptyState icon={Swords} title="Chưa có quiz để thi" description="Tạo và kích hoạt quiz trước khi mở Quiz Battle." /> : <div className="mt-6 grid gap-2">{quizzes.map((quiz) => <button key={quiz.id} type="button" onClick={() => setSelectedQuiz(quiz.id)} className={cn("flex items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors", selectedQuiz === quiz.id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/40")}><span className="min-w-0"><span className="block truncate text-sm font-extrabold text-ink">{quiz.title}</span><span className="mt-1 block text-xs text-ink-soft">{quiz.subject || "Chưa phân môn"} · {quiz.total_questions} câu · {quiz.status === "active" ? "Đang mở" : quiz.status}</span></span>{selectedQuiz === quiz.id && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-white"><Check className="size-4" /></span>}</button>)}</div>}<div className="mt-6"><label htmlFor="time-per-question" className="text-sm font-bold text-ink">Thời gian mỗi câu</label><div className="mt-2 flex flex-wrap items-center gap-2"><Select id="time-per-question" value={timePerQuestion} onChange={(event) => setTimePerQuestion(Number(event.target.value))} className="w-32"><option value={15}>15 giây</option><option value={20}>20 giây</option><option value={30}>30 giây</option><option value={45}>45 giây</option><option value={60}>60 giây</option></Select><Input aria-label="Thời gian tùy chỉnh" type="number" min={5} max={120} value={timePerQuestion} onChange={(event) => setTimePerQuestion(Math.min(120, Math.max(5, Number(event.target.value) || 5)))} className="w-28" /></div></div><Button className="mt-6 w-full" disabled={!selectedQuiz || busy !== null} onClick={() => void createBattle()}>{busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}Tạo trận đấu</Button></Surface><Surface className="p-5 sm:p-6"><h2 className="text-base font-extrabold text-ink">Gợi ý vận hành</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-ink-soft"><li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />Chia sẻ mã trận trên lớp, không đăng ở kênh công khai.</li><li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />Chỉ bắt đầu khi học sinh đã vào phòng chờ.</li><li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />Mỗi câu có cùng thời lượng để đảm bảo công bằng.</li></ul></Surface></div> : <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><Surface className="p-6 text-center"><p className="text-sm font-bold text-ink-soft">Mã trận đấu</p><p className="mt-3 text-4xl font-extrabold tracking-[0.25em] text-brand-strong">{createdBattle.battle_code}</p><Button variant="secondary" size="small" className="mt-4" onClick={() => void copyCode()}><Copy className="size-4" />Sao chép mã</Button><p className="mt-5 text-sm leading-6 text-ink-soft">{createdBattle.quiz_title}<br />{createdBattle.total_questions} câu · {createdBattle.time_per_question}s/câu</p><Button className="mt-6 w-full" disabled={busy !== null || battle?.status === "active"} onClick={() => void startBattle()}>{busy === "start" ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}{battle?.status === "active" ? "Đang diễn ra" : "Bắt đầu trận"}</Button><Button variant="ghost" className="mt-2 w-full" onClick={reset}>Tạo trận khác</Button></Surface><Surface className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-ink">Phòng chờ</h2><p className="mt-1 text-sm text-ink-soft">Danh sách tự cập nhật mỗi 3 giây.</p></div><StatusBadge><Users className="size-3" />{battle?.participants?.length ?? 0} người</StatusBadge></div>{battle?.participants?.length ? <div className="mt-5 divide-y divide-line">{battle.participants.map((participant) => <div key={participant.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-extrabold text-ink">{participant.name}</p><p className="text-xs text-ink-soft">Sẵn sàng tham gia</p></div><span className="text-xs font-bold text-brand-strong">Đã vào</span></div>)}</div> : <EmptyState icon={Users} title="Chưa có học sinh" description="Chờ học sinh nhập mã trận để tham gia." />}{battle?.status === "finished" && <p className="mt-4 rounded-[10px] bg-emerald-50 px-3 py-2 text-sm font-bold text-success">Trận đã kết thúc. Kết quả đã được ghi nhận.</p>}</Surface></div>}
    </div>
  );
}

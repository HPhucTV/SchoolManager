"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, Brain, CheckCircle2, Compass, Lightbulb, RefreshCw, Target, TrendingDown, TrendingUp } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { AI_TUTOR_USAGE_NOTICE, aiTutorApi, getErrorMessage, type TutorAnalysis, type TutorLearningPath, type TutorRecommendations } from "@/lib/api";
import { cn } from "@/lib/utils";

type TutorTab = "overview" | "recommendations" | "path";

function progressTone(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 60) return "bg-amber-500";
  return "bg-brand";
}

export default function AITutorPage() {
  const [analysis, setAnalysis] = useState<TutorAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<TutorRecommendations | null>(null);
  const [learningPath, setLearningPath] = useState<TutorLearningPath | null>(null);
  const [tab, setTab] = useState<TutorTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextAnalysis, nextRecommendations, nextPath] = await Promise.all([
        aiTutorApi.getAnalysis(),
        aiTutorApi.getRecommendations(),
        aiTutorApi.getLearningPath(),
      ]);
      setAnalysis(nextAnalysis);
      setRecommendations(nextRecommendations);
      setLearningPath(nextPath);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tạo tổng quan học tập."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="AI gia sư học tập"
        description="Một bảng phân tích cục bộ giúp bạn nhìn ra điểm mạnh, khoảng trống và bước tiếp theo."
        actions={<Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className={cn("size-4", loading && "animate-spin")} />Cập nhật phân tích</Button>}
      />

      <div className="mb-5 flex items-start gap-3 rounded-[12px] border border-brand/20 bg-brand-soft px-4 py-3 text-sm leading-6 text-brand-strong"><Brain className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p><strong>Trạng thái rõ ràng:</strong> {AI_TUTOR_USAGE_NOTICE} Không có cuộc trò chuyện với mô hình bên ngoài trong màn này.</p></div>
      {error && <ErrorState className="mb-5" title="Không thể tải phân tích" description={error} action={<Button variant="secondary" size="small" onClick={() => void load()}>Thử lại</Button>} />}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-64 lg:col-span-4" /></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[{ label: "Điểm trung bình", value: `${analysis?.overall_avg ?? 0}%`, icon: Target }, { label: "Bài kiểm tra", value: analysis?.total_quizzes ?? 0, icon: BookOpenCheck }, { label: "Bài tập", value: analysis?.total_assignments ?? 0, icon: Compass }, { label: "Cấp độ", value: analysis?.level ?? 1, icon: Brain }].map((item) => <Surface key={item.label} className="p-4"><item.icon className="size-5 text-brand-strong" /><p className="mt-3 text-xl font-extrabold text-ink">{item.value}</p><p className="text-xs font-bold text-ink-soft">{item.label}</p></Surface>)}
          </div>

          <Tabs<TutorTab> label="Các phần phân tích" value={tab} onChange={setTab} options={[{ value: "overview", label: "Tổng quan" }, { value: "recommendations", label: "Gợi ý ôn tập" }, { value: "path", label: "Lộ trình" }]} className="mt-6" />

          {tab === "overview" && <div className="grid gap-4 lg:grid-cols-2"><Surface className="p-5 sm:p-6"><div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-success" /><h2 className="text-base font-extrabold text-ink">Điểm mạnh</h2></div>{analysis?.strengths?.length ? <ul className="mt-4 grid gap-2">{analysis.strengths.map((item) => <li key={item} className="rounded-[10px] bg-emerald-50 px-3 py-2 text-sm font-semibold text-success dark:bg-emerald-950/30">{item}</li>)}</ul> : <EmptyState title="Chưa đủ dữ liệu" description="Hoàn thành thêm bài để hệ thống nhận ra điểm mạnh." className="min-h-32" />}</Surface><Surface className="p-5 sm:p-6"><div className="flex items-center gap-2"><Target className="size-5 text-brand-strong" /><h2 className="text-base font-extrabold text-ink">Nên củng cố</h2></div>{analysis?.weaknesses?.length ? <ul className="mt-4 grid gap-2">{analysis.weaknesses.map((item) => <li key={item} className="rounded-[10px] bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{item}</li>)}</ul> : <EmptyState title="Chưa có cảnh báo" description="Tiếp tục học đều để duy trì phong độ." className="min-h-32" />}</Surface><Surface className="p-5 sm:col-span-2 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-base font-extrabold text-ink">Theo môn học</h2><span className="text-xs font-bold text-ink-soft">Dựa trên dữ liệu đã hoàn thành</span></div>{analysis?.subjects?.length ? <div className="mt-4 grid gap-4">{analysis.subjects.map((subject) => { const value = Math.min(100, Math.max(0, subject.avg_score)); const TrendIcon = subject.trend === "improving" ? TrendingUp : subject.trend === "declining" ? TrendingDown : Compass; return <div key={subject.subject}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-ink">{subject.subject}</p><p className="text-xs text-ink-soft">{subject.total_tests} bài · {subject.topics.length} chủ đề</p></div><div className="flex items-center gap-1 text-xs font-bold text-ink-soft"><TrendIcon className="size-4 text-brand-strong" />{value}%</div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle"><div className={cn("h-full rounded-full", progressTone(value))} style={{ width: `${value}%` }} /></div></div>; })}</div> : <EmptyState icon={BookOpenCheck} title="Chưa có dữ liệu môn học" description="Làm thêm bài kiểm tra để bắt đầu phân tích." />}</Surface></div>}

          {tab === "recommendations" && <Surface className="p-5 sm:p-6">{recommendations?.ai_advice && <div className="flex gap-3 rounded-[12px] border border-brand/20 bg-brand-soft p-4"><Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-strong" /><div><h2 className="text-sm font-extrabold text-brand-strong">Gợi ý từ dữ liệu học tập</h2><p className="mt-1 text-sm leading-6 text-ink-soft">{recommendations.ai_advice}</p></div></div>}{recommendations?.recommendations?.length ? <div className="mt-5 grid gap-3">{recommendations.recommendations.map((item) => <article key={`${item.subject}-${item.topic}`} className="rounded-[12px] border border-line bg-surface-subtle p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-ink">{item.subject} · {item.topic}</p><p className="mt-1 text-sm leading-6 text-ink-soft">{item.suggestion}</p></div><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", item.priority === "high" ? "bg-red-50 text-danger dark:bg-red-950/30" : item.priority === "medium" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200" : "bg-emerald-50 text-success dark:bg-emerald-950/30")}>{item.priority === "high" ? "Ưu tiên" : item.priority === "medium" ? "Nên làm sớm" : "Duy trì"}</span></div><p className="mt-3 text-xs font-bold text-brand-strong">Bước tiếp theo: {item.recommended_action}</p></article>)}</div> : <EmptyState icon={Lightbulb} title="Chưa có gợi ý mới" description="Hoàn thành thêm bài để nhận đề xuất phù hợp hơn." />}<p className="mt-5 text-center text-xs font-bold text-ink-soft">Chuỗi học tập: {recommendations?.study_streak ?? 0} ngày · Đã phân tích: {recommendations?.total_analyzed ?? 0} bài</p></Surface>}

          {tab === "path" && <Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-base font-extrabold text-ink">Lộ trình theo môn</h2><p className="mt-1 text-sm text-ink-soft">Các chặng được sắp xếp từ dữ liệu đã có, không phải lời hứa về kết quả.</p></div><span className="text-sm font-extrabold text-brand-strong">{learningPath?.overall_mastery ?? 0}% tổng thể</span></div>{learningPath?.path?.length ? <div className="mt-5 grid gap-3">{learningPath.path.map((item) => <article key={item.subject} className="rounded-[12px] border border-line bg-surface-subtle p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-extrabold text-ink">{item.subject}</h3><p className="mt-1 text-xs text-ink-soft">{item.stage} · {item.topics_completed}/{item.total_tests} bài đã hoàn thành</p></div><span className="text-sm font-extrabold text-brand-strong">{item.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }} /></div><p className="mt-3 text-sm leading-6 text-ink-soft"><strong className="text-ink">Bước tiếp theo:</strong> {item.next_step}</p></article>)}</div> : <EmptyState icon={Compass} title="Lộ trình đang chờ dữ liệu" description="Hoàn thành thêm bài kiểm tra để bắt đầu xây dựng lộ trình." />}</Surface>}
        </>
      )}
    </div>
  );
}

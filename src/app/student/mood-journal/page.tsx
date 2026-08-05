"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, CalendarDays, HeartHandshake, LifeBuoy, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";

import { Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { getErrorMessage, type MoodAnalytics, type MoodEntry, wellnessApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const MOODS = [
  { level: 1, emoji: "😢", label: "Rất buồn" },
  { level: 2, emoji: "😟", label: "Buồn" },
  { level: 3, emoji: "😐", label: "Bình thường" },
  { level: 4, emoji: "🙂", label: "Vui" },
  { level: 5, emoji: "😄", label: "Rất vui" },
] as const;

type JournalTab = "log" | "history" | "analytics";

export default function MoodJournalPage() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<JournalTab>("log");
  const [showSOS, setShowSOS] = useState(false);
  const [sosMessage, setSOSMessage] = useState("");
  const [sosAnonymous, setSOSAnonymous] = useState(true);
  const [sosSending, setSOSSending] = useState(false);
  const [sosSent, setSOSSent] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [entries, summary] = await Promise.all([
        wellnessApi.getMoodHistory(30),
        wellnessApi.getMoodAnalytics(),
      ]);
      setHistory(entries);
      setAnalytics(summary);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải nhật ký cảm xúc."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submitMood() {
    const mood = MOODS.find((item) => item.level === selectedMood);
    if (!mood) return;
    setSubmitting(true);
    setError("");
    try {
      await wellnessApi.createMood({
        mood_level: mood.level,
        mood_emoji: mood.emoji,
        note: note.trim() || undefined,
      });
      setSelectedMood(null);
      setNote("");
      setSuccess("Đã lưu cảm xúc hôm nay.");
      await loadData();
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Không thể lưu cảm xúc."));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendSOS() {
    if (!sosMessage.trim()) return;
    setSOSSending(true);
    setError("");
    try {
      await wellnessApi.createSOS({ message: sosMessage.trim(), is_anonymous: sosAnonymous });
      setSosStateAfterSuccess();
    } catch (sendError) {
      setError(getErrorMessage(sendError, "Không thể gửi tín hiệu hỗ trợ."));
    } finally {
      setSOSSending(false);
    }
  }

  function setSosStateAfterSuccess() {
    setSOSSent(true);
    setSOSMessage("");
  }

  function closeSOS() {
    setShowSOS(false);
    setSOSSent(false);
    setSOSMessage("");
  }

  const trend = analytics?.trend ?? "stable";
  const trendLabel = trend === "improving" ? "Đang cải thiện" : trend === "declining" ? "Cần quan tâm thêm" : "Ổn định";
  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : BarChart3;

  return (
    <div>
      <PageHeader
        title="Nhật ký cảm xúc"
        description="Ghi nhận riêng tư để hiểu mình hơn. Nội dung ghi chú chỉ xuất hiện trong lịch sử của bạn."
        actions={
          <Button variant="danger" onClick={() => setShowSOS(true)}>
            <LifeBuoy className="size-4" aria-hidden="true" /> Cần hỗ trợ
          </Button>
        }
      />

      {error && <ErrorState className="mb-5" title="Có lỗi xảy ra" description={error} action={<Button variant="secondary" size="small" onClick={() => void loadData()}>Thử lại</Button>} />}
      {success && <p role="status" className="mb-5 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-success dark:border-emerald-900 dark:bg-emerald-950/30">{success}</p>}

      <Tabs<JournalTab>
        label="Nội dung nhật ký"
        value={tab}
        onChange={setTab}
        options={[
          { value: "log", label: "Ghi nhận hôm nay" },
          { value: "history", label: "Lịch sử 30 ngày" },
          { value: "analytics", label: "Tổng quan" },
        ]}
      />

      {loading ? (
        <Surface className="space-y-4 p-6"><Skeleton className="h-7 w-56" /><Skeleton className="h-28 w-full" /><Skeleton className="h-24 w-full" /></Surface>
      ) : tab === "log" ? (
        <Surface className="p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><HeartHandshake className="size-5" aria-hidden="true" /></div>
            <div><h2 className="text-lg font-extrabold text-ink">Hôm nay bạn cảm thấy thế nào?</h2><p className="text-sm text-ink-soft">Chọn mức gần nhất với cảm xúc hiện tại.</p></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Chọn mức cảm xúc">
            {MOODS.map((mood) => (
              <button
                key={mood.level}
                type="button"
                aria-pressed={selectedMood === mood.level}
                className={cn(
                  "flex min-h-28 flex-col items-center justify-center gap-2 rounded-[12px] border px-3 py-4 text-center transition-[border-color,background-color,transform] active:translate-y-px",
                  selectedMood === mood.level ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-ink-soft hover:border-brand/45 hover:bg-surface-subtle",
                )}
                onClick={() => setSelectedMood(mood.level)}
              >
                <span className="text-3xl" aria-hidden="true">{mood.emoji}</span>
                <span className="text-xs font-extrabold">{mood.label}</span>
              </button>
            ))}
          </div>
          <Field name="mood-note" label="Ghi chú riêng" helper={`${note.length}/500 ký tự`} className="mt-6">
            <Textarea value={note} maxLength={500} placeholder="Bạn có thể ghi lại điều khiến mình cảm thấy như vậy." onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button className="mt-5 w-full sm:w-auto" disabled={!selectedMood || submitting} onClick={() => void submitMood()}>
            {submitting ? "Đang lưu..." : "Lưu cảm xúc"}
          </Button>
        </Surface>
      ) : tab === "history" ? (
        <Surface>
          {history.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Chưa có ghi nhận" description="Ghi lại cảm xúc đầu tiên để bắt đầu lịch sử riêng của bạn." action={<Button onClick={() => setTab("log")}>Ghi nhận ngay</Button>} />
          ) : (
            <div className="divide-y divide-line">
              {history.map((entry) => (
                <article key={entry.id} className="flex items-start gap-4 px-5 py-4 sm:px-6">
                  <span className="text-2xl" aria-hidden="true">{entry.mood_emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-ink">{MOODS.find((mood) => mood.level === entry.mood_level)?.label || "Cảm xúc"}</h3>
                    {entry.note && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{entry.note}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-ink-soft" dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString("vi-VN")}</time>
                </article>
              ))}
            </div>
          )}
        </Surface>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Surface className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink-soft">Trung bình 7 ngày</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink">{analytics?.avg_week ?? 0}<span className="text-lg text-ink-soft">/5</span></p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-strong"><TrendIcon className="size-4" aria-hidden="true" />{trendLabel}</div>
            <p className="mt-5 text-sm leading-6 text-ink-soft">Trung bình 30 ngày: <strong className="text-ink">{analytics?.avg_month ?? 0}/5</strong>. Tổng cộng {analytics?.total_entries ?? 0} ghi nhận.</p>
          </Surface>
          <Surface className="p-5 sm:p-6">
            <h2 className="text-base font-extrabold text-ink">Phân bổ cảm xúc</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {MOODS.map((mood) => (
                <div key={mood.level} className="rounded-[12px] bg-surface-subtle p-3 text-center">
                  <span className="text-2xl" aria-hidden="true">{mood.emoji}</span>
                  <p className="mt-2 text-xl font-extrabold text-ink">{analytics?.distribution[mood.level] ?? 0}</p>
                  <p className="text-xs font-bold text-ink-soft">{mood.label}</p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      )}

      <Dialog
        open={showSOS}
        onClose={closeSOS}
        title={sosSent ? "Đã gửi tín hiệu hỗ trợ" : "Gửi tín hiệu cần giúp đỡ"}
        description={sosSent ? "Giáo viên chủ nhiệm đã nhận được thông báo." : "Tín hiệu được gửi đến giáo viên chủ nhiệm của lớp bạn."}
        size="small"
        footer={sosSent ? <Button onClick={closeSOS}>Đóng</Button> : <><Button variant="secondary" onClick={closeSOS}>Hủy</Button><Button variant="danger" disabled={!sosMessage.trim() || sosSending} onClick={() => void sendSOS()}>{sosSending ? "Đang gửi..." : "Gửi tín hiệu"}</Button></>}
      >
        {sosSent ? (
          <div className="rounded-[12px] bg-brand-soft p-4 text-sm leading-6 text-brand-strong">Bạn không đơn độc. Nếu đang gặp nguy hiểm ngay lúc này, hãy liên hệ một người lớn tin cậy hoặc dịch vụ khẩn cấp tại nơi bạn sống.</div>
        ) : (
          <div className="grid gap-4">
            <div className="flex gap-3 rounded-[12px] border border-line bg-surface-subtle p-4 text-sm leading-6 text-ink-soft"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-strong" aria-hidden="true" /><span>Khi chọn ẩn danh, tên và mã học sinh sẽ không xuất hiện trong danh sách SOS của giáo viên.</span></div>
            <Field name="sos-message" label="Điều bạn muốn chia sẻ" required helper={`${sosMessage.length}/1000 ký tự`}>
              <Textarea value={sosMessage} maxLength={1000} placeholder="Hãy mô tả ngắn gọn điều bạn đang cần hỗ trợ." onChange={(event) => setSOSMessage(event.target.value)} />
            </Field>
            <label className="flex min-h-11 items-center gap-3 rounded-[10px] border border-line px-3.5 text-sm font-bold text-ink"><input type="checkbox" checked={sosAnonymous} onChange={(event) => setSOSAnonymous(event.target.checked)} className="size-4 accent-[var(--brand)]" />Gửi ẩn danh</label>
          </div>
        )}
      </Dialog>
    </div>
  );
}

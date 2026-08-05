"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, LockKeyhole, MessageSquareText } from "lucide-react";

import { Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, type SOSAlert, wellnessApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type AlertFilter = "all" | SOSAlert["status"];

const statusLabel: Record<SOSAlert["status"], string> = {
  pending: "Chờ xử lý",
  reviewing: "Đang xem xét",
  resolved: "Đã giải quyết",
};

const statusClass: Record<SOSAlert["status"], string> = {
  pending: "border-red-200 bg-red-50 text-danger dark:border-red-900 dark:bg-red-950/30",
  reviewing: "border-amber-200 bg-amber-50 text-warning dark:border-amber-900 dark:bg-amber-950/30",
  resolved: "border-emerald-200 bg-emerald-50 text-success dark:border-emerald-900 dark:bg-emerald-950/30",
};

export default function TeacherWellnessPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [nextStatus, setNextStatus] = useState<"reviewing" | "resolved">("reviewing");
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAlerts(await wellnessApi.getSOSAlerts(filter === "all" ? undefined : filter));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải tín hiệu hỗ trợ."));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  function openReview(alert: SOSAlert) {
    setSelectedAlert(alert);
    setNextStatus(alert.status === "pending" ? "reviewing" : "resolved");
    setReviewNote(alert.reviewer_note || "");
  }

  async function updateAlert() {
    if (!selectedAlert) return;
    setSaving(true);
    setError("");
    try {
      await wellnessApi.updateSOS(selectedAlert.id, { status: nextStatus, reviewer_note: reviewNote.trim() || undefined });
      setSelectedAlert(null);
      await loadAlerts();
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Không thể cập nhật tín hiệu hỗ trợ."));
    } finally {
      setSaving(false);
    }
  }

  const pendingCount = alerts.filter((alert) => alert.status === "pending").length;

  return (
    <div>
      <PageHeader title="Hỗ trợ sức khỏe tinh thần" description="Xử lý tín hiệu hỗ trợ trong phạm vi lớp phụ trách. Danh tính ẩn danh không được hiển thị hoặc suy đoán." />
      <div className="mb-5 flex gap-3 rounded-[12px] border border-line bg-brand-soft p-4 text-sm leading-6 text-brand-strong"><LockKeyhole className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p>Dữ liệu này nhạy cảm. Chỉ sử dụng để hỗ trợ học sinh và không sao chép sang kênh công khai.</p></div>
      {pendingCount > 0 && <p role="status" className="mb-5 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-danger dark:border-red-900 dark:bg-red-950/30">Có {pendingCount} tín hiệu đang chờ xử lý.</p>}
      {error && <ErrorState className="mb-5" title="Không thể xử lý dữ liệu" description={error} action={<Button variant="secondary" size="small" onClick={() => void loadAlerts()}>Thử lại</Button>} />}

      <div className="mb-5 max-w-xs">
        <Field name="sos-filter" label="Trạng thái">
          <Select value={filter} onChange={(event) => setFilter(event.target.value as AlertFilter)}>
            <option value="all">Tất cả</option><option value="pending">Chờ xử lý</option><option value="reviewing">Đang xem xét</option><option value="resolved">Đã giải quyết</option>
          </Select>
        </Field>
      </div>

      <Surface>
        {loading ? (
          <div className="space-y-3 p-5"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="Không có tín hiệu trong bộ lọc" description="Các tín hiệu mới của học sinh thuộc lớp bạn sẽ xuất hiện tại đây." />
        ) : (
          <div className="divide-y divide-line">
            {alerts.map((alert) => (
              <article key={alert.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><h2 className="text-sm font-extrabold text-ink">{alert.student_name}</h2><time className="mt-1 block text-xs text-ink-soft" dateTime={alert.created_at}>{new Date(alert.created_at).toLocaleString("vi-VN")}</time></div>
                  <span className={cn("w-fit rounded-[8px] border px-2.5 py-1 text-xs font-extrabold", statusClass[alert.status])}>{statusLabel[alert.status]}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap rounded-[10px] bg-surface-subtle p-4 text-sm leading-6 text-ink">{alert.message}</p>
                {alert.reviewer_note && <p className="mt-3 text-sm leading-6 text-ink-soft"><strong className="text-ink">Ghi chú xử lý:</strong> {alert.reviewer_note}</p>}
                {alert.status !== "resolved" && <Button className="mt-4" variant="secondary" size="small" onClick={() => openReview(alert)}><MessageSquareText className="size-4" aria-hidden="true" />Cập nhật xử lý</Button>}
              </article>
            ))}
          </div>
        )}
      </Surface>

      <Dialog
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        title="Cập nhật tín hiệu hỗ trợ"
        description="Ghi lại trạng thái xử lý, không nhập thông tin nhạy cảm không cần thiết."
        size="small"
        footer={<><Button variant="secondary" disabled={saving} onClick={() => setSelectedAlert(null)}>Hủy</Button><Button disabled={saving} onClick={() => void updateAlert()}>{saving ? "Đang lưu..." : "Lưu cập nhật"}</Button></>}
      >
        <div className="grid gap-4">
          <Field name="review-status" label="Trạng thái">
            <Select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as "reviewing" | "resolved")}><option value="reviewing">Đang xem xét</option><option value="resolved">Đã giải quyết</option></Select>
          </Field>
          <Field name="review-note" label="Ghi chú" helper={`${reviewNote.length}/1000 ký tự`}>
            <Textarea value={reviewNote} maxLength={1000} onChange={(event) => setReviewNote(event.target.value)} placeholder="Ví dụ: Đã liên hệ riêng và thống nhất bước hỗ trợ tiếp theo." />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

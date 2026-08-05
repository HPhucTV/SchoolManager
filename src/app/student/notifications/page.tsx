"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, CalendarDays, CheckCheck, ExternalLink, FileText } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, notificationsApi, type NotificationItem } from "@/lib/api";
import { cn } from "@/lib/utils";

type NotificationFilter = "all" | "unread";

const iconByType = {
  quiz: BookOpen,
  activity: CalendarDays,
  event: CalendarDays,
  assignment: FileText,
} as const;

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setNotifications(await notificationsApi.list());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải thông báo."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const visibleNotifications = useMemo(
    () => filter === "unread" ? notifications.filter((notification) => !notification.is_read) : notifications,
    [filter, notifications],
  );

  async function markRead(id: number) {
    const previous = notifications;
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item));
    try {
      await notificationsApi.markRead(id);
    } catch (markError) {
      setNotifications(previous);
      setError(getErrorMessage(markError, "Không thể đánh dấu thông báo."));
    }
  }

  async function markAllRead() {
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    try {
      await notificationsApi.markAllRead();
    } catch (markError) {
      setNotifications(previous);
      setError(getErrorMessage(markError, "Không thể cập nhật tất cả thông báo."));
    }
  }

  return (
    <div>
      <PageHeader
        title="Thông báo"
        description="Theo dõi bài tập, bài kiểm tra và hoạt động mới của lớp."
        actions={<Button variant="secondary" disabled={unreadCount === 0} onClick={() => void markAllRead()}><CheckCheck className="size-4" aria-hidden="true" />Đánh dấu đã đọc</Button>}
      />

      {error && <ErrorState className="mb-5" title="Không thể cập nhật thông báo" description={error} action={<Button variant="secondary" size="small" onClick={() => void loadNotifications()}>Thử lại</Button>} />}

      <div className="mb-5 flex gap-2" role="group" aria-label="Lọc thông báo">
        <Button variant={filter === "all" ? "primary" : "secondary"} size="small" onClick={() => setFilter("all")}>Tất cả</Button>
        <Button variant={filter === "unread" ? "primary" : "secondary"} size="small" onClick={() => setFilter("unread")}>Chưa đọc ({unreadCount})</Button>
      </div>

      <Surface>
        {loading ? (
          <div className="space-y-3 p-5"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
        ) : visibleNotifications.length === 0 ? (
          <EmptyState icon={Bell} title={filter === "unread" ? "Bạn đã đọc hết" : "Chưa có thông báo"} description={filter === "unread" ? "Các thông báo mới sẽ xuất hiện tại đây." : "Khi lớp có nội dung mới, bạn sẽ thấy thông báo ở đây."} />
        ) : (
          <div className="divide-y divide-line">
            {visibleNotifications.map((notification) => {
              const Icon = iconByType[notification.type as keyof typeof iconByType] || Bell;
              return (
                <article key={notification.id} className={cn("relative flex gap-4 px-5 py-4 sm:px-6", !notification.is_read && "bg-brand-soft/55")}>
                  <div className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-surface-subtle text-brand-strong"><Icon className="size-[18px]" aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className="text-sm font-extrabold text-ink">{notification.title}</h2>
                      <time className="shrink-0 text-xs text-ink-soft" dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString("vi-VN")}</time>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink-soft">{notification.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {notification.action_url && (
                        <Link href={notification.action_url} onClick={() => void markRead(notification.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-[9px] bg-brand px-3 text-xs font-bold text-white hover:bg-brand-strong">
                          {notification.action_label || "Mở nội dung"}<ExternalLink className="size-3.5" aria-hidden="true" />
                        </Link>
                      )}
                      {!notification.is_read && <Button variant="secondary" size="small" onClick={() => void markRead(notification.id)}>Đánh dấu đã đọc</Button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}

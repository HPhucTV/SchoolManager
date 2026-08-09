import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
} from "lucide-react";

import { Surface } from "@/components/ui/primitives";
import type { TodayDashboard } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TodayCenterProps {
  data: TodayDashboard;
  audience: "teacher" | "student";
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ hạn";
  const day = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${day} lúc ${time}`;
}

export function TodayCenter({ data, audience }: TodayCenterProps) {
  const scheduleHref = audience === "teacher" ? "/teacher/thoi-khoa-bieu" : "/student/thoi-khoa-bieu";

  return (
    <section className="mt-7" aria-labelledby="today-center-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="today-center-title" className="text-base font-extrabold text-ink">Hôm nay</h2>
          <p className="mt-1 text-sm capitalize text-ink-soft">{formatDate(data.date)}</p>
        </div>
        {audience === "student" && (
          <Link href="/student/notifications" className="inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
            <Bell className="size-4" />
            {data.unread_notifications
              ? `${data.unread_notifications} thông báo chưa đọc`
              : "Thông báo"}
          </Link>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[12px] bg-brand-soft text-brand-strong">
                <CalendarDays className="size-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-ink">Lịch trong ngày</h3>
                <p className="text-xs text-ink-soft">{data.schedule.length} tiết học</p>
              </div>
            </div>
            <Link href={scheduleHref} className="text-xs font-bold text-brand-strong hover:underline">Xem lịch</Link>
          </div>
          {data.schedule.length ? (
            <div className="grid gap-1 p-3">
              {data.schedule.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-[13px] px-2.5 py-3 hover:bg-surface-subtle">
                  <div className="min-w-20 rounded-[10px] bg-surface-subtle px-2 py-1.5 text-center text-xs font-extrabold text-ink">
                    {item.start_time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">{item.subject}</p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                      <span>{item.class_name}</span>
                      {item.room && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{item.room}</span>}
                      {audience === "student" && item.teacher_name && <span>{item.teacher_name}</span>}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-ink-soft">{item.end_time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-9 text-center">
              <CheckCircle2 className="mx-auto size-6 text-mint" />
              <p className="mt-3 text-sm font-bold text-ink">Không có tiết học hôm nay</p>
              <p className="mt-1 text-xs text-ink-soft">Lịch trống để bạn chủ động sắp xếp công việc.</p>
            </div>
          )}
        </Surface>

        <Surface className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <span className="grid size-10 place-items-center rounded-[12px] bg-sun-soft text-sun">
              <BookOpenCheck className="size-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-ink">Việc cần làm</h3>
              <p className="text-xs text-ink-soft">Quá hạn và sắp đến hạn trong 7 ngày</p>
            </div>
          </div>
          {data.work_items.length ? (
            <div className="grid gap-1 p-3">
              {data.work_items.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={item.action_url}
                  className="group flex items-center gap-3 rounded-[13px] px-2.5 py-3 transition-colors hover:bg-surface-subtle"
                >
                  <span className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-[11px]",
                    item.is_overdue ? "bg-coral-soft text-coral" : "bg-sun-soft text-sun",
                  )}>
                    <Clock3 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-ink-soft">
                      {item.subject || item.class_name} · {item.is_overdue ? "Quá hạn" : formatDeadline(item.deadline)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-9 text-center">
              <CheckCircle2 className="mx-auto size-6 text-mint" />
              <p className="mt-3 text-sm font-bold text-ink">Không có việc gấp</p>
              <p className="mt-1 text-xs text-ink-soft">Các bài đã hoàn thành hoặc chưa gần đến hạn.</p>
            </div>
          )}
        </Surface>
      </div>

      {audience === "teacher" && (
        <Surface className="mt-4 overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[12px] bg-coral-soft text-coral">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-ink">Cần chú ý</h3>
                <p className="text-xs text-ink-soft">Chỉ hiển thị tín hiệu có dữ liệu thật</p>
              </div>
            </div>
            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-extrabold text-ink-soft">
              {data.attention.length}
            </span>
          </div>
          {data.attention.length ? (
            <div className="grid gap-2 p-3 md:grid-cols-2">
              {data.attention.map((item) => (
                <Link
                  key={item.id}
                  href={item.action_url}
                  className="group flex items-start gap-3 rounded-[14px] border border-line bg-surface-elevated p-3.5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand/35"
                >
                  <span className={cn(
                    "mt-0.5 size-2.5 shrink-0 rounded-full",
                    item.priority === "high" ? "bg-coral" : "bg-sun",
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{item.description}</p>
                    <p className="mt-1 text-[11px] font-bold text-brand-strong">{item.class_name}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto size-6 text-mint" />
              <p className="mt-3 text-sm font-bold text-ink">Chưa có tín hiệu cần xử lý</p>
            </div>
          )}
        </Surface>
      )}
    </section>
  );
}

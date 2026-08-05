"use client";

import { Clock3, MapPin, Plus, Trash2 } from "lucide-react";

import type { ScheduleItem as AcademicScheduleItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export type ScheduleItem = AcademicScheduleItem;

interface TimetableGridProps {
  schedules: ScheduleItem[];
  onCellClick?: (day: string, timeSlot: string) => void;
  onItemClick?: (item: ScheduleItem) => void;
  onDeleteItem?: (item: ScheduleItem) => void | Promise<void>;
  editable?: boolean;
}

const DAYS = [
  ["Monday", "Thứ 2"],
  ["Tuesday", "Thứ 3"],
  ["Wednesday", "Thứ 4"],
  ["Thursday", "Thứ 5"],
  ["Friday", "Thứ 6"],
  ["Saturday", "Thứ 7"],
] as const;

const SLOTS = [
  ["07:00", "07:45", "Tiết 1"], ["07:50", "08:35", "Tiết 2"], ["08:40", "09:25", "Tiết 3"],
  ["09:35", "10:20", "Tiết 4"], ["10:25", "11:10", "Tiết 5"], ["13:00", "13:45", "Tiết 6"],
  ["13:50", "14:35", "Tiết 7"], ["14:40", "15:25", "Tiết 8"], ["15:35", "16:20", "Tiết 9"],
  ["16:25", "17:10", "Tiết 10"],
] as const;

export default function TimetableGrid({ schedules, onCellClick, onItemClick, onDeleteItem, editable = false }: TimetableGridProps) {
  const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const findItem = (day: string, start: string) => schedules.find((item) => item.day_of_week === day && item.start_time === start);

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_14px_40px_rgba(28,52,84,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">Thời khóa biểu từ thứ 2 đến thứ 7</caption>
          <thead>
            <tr className="border-b border-line bg-surface-subtle">
              <th scope="col" className="w-24 px-3 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft">Tiết</th>
              {DAYS.map(([day, label]) => <th key={day} scope="col" className={cn("border-l border-line px-3 py-3 text-center text-sm font-extrabold text-ink", day === currentDay && "bg-brand-soft text-brand-strong")}><span>{label}</span><span className="mt-1 block text-[11px] font-semibold text-ink-soft">{schedules.filter((item) => item.day_of_week === day).length} tiết</span></th>)}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map(([start, end, label], slotIndex) => (
              <tr key={start} className={cn("border-b border-line last:border-b-0", slotIndex === 5 && "border-t-4 border-t-surface-subtle")}>
                <th scope="row" className="bg-surface-subtle/60 px-3 py-2 align-top"><span className="block text-xs font-extrabold text-ink">{label}</span><span className="mt-1 block text-[11px] font-medium text-ink-soft">{start}</span></th>
                {DAYS.map(([day, dayLabel]) => {
                  const item = findItem(day, start);
                  return (
                    <td key={day} className={cn("h-20 border-l border-line p-1.5 align-top", day === currentDay && "bg-brand-soft/30")}>
                      {item ? (
                        <div className="group relative flex h-full min-h-16 flex-col justify-center rounded-[10px] border border-brand/20 bg-brand-soft px-3 py-2">
                          <button type="button" className="text-left" onClick={() => onItemClick?.(item)} aria-label={`Mở ${item.subject}, ${dayLabel} từ ${start} đến ${end}`}>
                            <span className="block text-sm font-extrabold text-brand-strong">{item.subject}</span>
                            <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink-soft"><Clock3 className="size-3" />{start} - {end}</span>
                            {item.room && <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink-soft"><MapPin className="size-3" />{item.room}</span>}
                          </button>
                          {editable && onDeleteItem && <button type="button" className="absolute right-1 top-1 grid size-7 place-items-center rounded-md text-danger opacity-0 transition-opacity hover:bg-red-50 focus:opacity-100 group-hover:opacity-100" aria-label={`Xóa tiết ${item.subject}`} onClick={() => void onDeleteItem(item)}><Trash2 className="size-3.5" /></button>}
                        </div>
                      ) : editable ? (
                        <button type="button" className="grid h-full min-h-16 w-full place-items-center rounded-[10px] border border-dashed border-line text-ink-soft transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand-strong" onClick={() => onCellClick?.(day, start)} aria-label={`Thêm tiết ${dayLabel} lúc ${start}`}><Plus className="size-4" /></button>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, BookMarked, CheckCircle2 } from "lucide-react";

import { Surface } from "@/components/ui/primitives";
import type { StudentGradebook } from "@/lib/api";
import { cn } from "@/lib/utils";


function scoreLabel(score?: number | null) {
  return score === null || score === undefined ? "Chưa có điểm" : `${score}%`;
}

export function StudentGradebookSummary({ gradebook }: { gradebook: StudentGradebook }) {
  return (
    <section className="mt-7" aria-labelledby="student-gradebook-title">
      <div className="mb-3">
        <h2 id="student-gradebook-title" className="text-base font-extrabold text-ink">Sổ điểm gọn</h2>
        <p className="mt-1 text-sm text-ink-soft">Điểm đã chấm từ bài tập và bài kiểm tra.</p>
      </div>
      <Surface className="overflow-hidden">
        <div className="grid border-b border-line bg-brand-soft/55 p-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6">
          <div>
            <p className="text-xs font-bold text-ink-soft">Điểm trung bình hiện có</p>
            <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-ink">
              {scoreLabel(gradebook.overall_average)}
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:mt-0">
            Chỉ tính các bài đã có điểm. Môn chưa được chấm không làm giảm kết quả hiện tại.
          </p>
        </div>

        {gradebook.subjects.length ? (
          <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
            {gradebook.subjects.map((subject) => (
              <Link
                key={subject.subject}
                href={`/student/subject/${encodeURIComponent(subject.subject)}`}
                className="group flex items-center gap-3 rounded-[14px] border border-line bg-surface-elevated p-3.5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand/35"
              >
                <span className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-[12px]",
                  subject.needs_review ? "bg-coral-soft text-coral" : "bg-mint-soft text-mint",
                )}>
                  {subject.needs_review ? <BookMarked className="size-5" /> : <CheckCircle2 className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{subject.subject}</p>
                  <p className="mt-1 text-xs text-ink-soft">{subject.completed_items}/{subject.total_items} bài đã hoàn thành</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-ink">{scoreLabel(subject.overall_average)}</p>
                  <ArrowRight className="ml-auto mt-1 size-4 text-ink-soft transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-9 text-center">
            <BookMarked className="mx-auto size-6 text-brand-strong" />
            <p className="mt-3 text-sm font-bold text-ink">Chưa có dữ liệu điểm</p>
            <p className="mt-1 text-xs text-ink-soft">Kết quả sẽ xuất hiện sau khi bài được chấm.</p>
          </div>
        )}
      </Surface>
    </section>
  );
}

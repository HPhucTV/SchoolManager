import Link from "next/link";
import { createElement } from "react";
import { ArrowRight, Beaker, BookOpen, Calculator, Dumbbell, Globe, GraduationCap, Languages, Music, Palette, type LucideIcon } from "lucide-react";

interface SubjectCardProps {
  id: string;
  name: string;
  teacher: string;
  taskCount?: number;
  color?: string;
}

const SUBJECT_ICONS: Array<[RegExp, LucideIcon]> = [
  [/toán/i, Calculator],
  [/(văn|việt)/i, BookOpen],
  [/(anh|ngoại ngữ)/i, Languages],
  [/(lý|hóa|sinh|khoa học)/i, Beaker],
  [/(sử|địa)/i, Globe],
  [/nhạc/i, Music],
  [/(mỹ thuật|vẽ)/i, Palette],
  [/thể dục/i, Dumbbell],
];

function getSubjectIcon(name: string) {
  return SUBJECT_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? GraduationCap;
}

export default function SubjectCard({ name, teacher, taskCount = 0 }: SubjectCardProps) {
  const icon = createElement(getSubjectIcon(name), { className: "size-5", "aria-hidden": true });

  return (
    <Link
      href={`/student/subject/${encodeURIComponent(name)}`}
      className="group flex h-full flex-col rounded-[14px] border border-line bg-surface p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_12px_30px_rgba(28,52,84,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong">
          {icon}
        </div>
        {taskCount > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{taskCount} việc cần làm</span>}
      </div>
      <h3 className="mt-5 text-base font-extrabold text-ink">{name}</h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-ink-soft">Giáo viên: {teacher}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
        Mở môn học <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

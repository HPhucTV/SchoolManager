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

const SUBJECT_TONES: Array<[RegExp, string]> = [
  [/toán/i, "bg-brand-soft text-brand-strong"],
  [/(văn|việt)/i, "bg-coral-soft text-coral"],
  [/(anh|ngoại ngữ)/i, "bg-mint-soft text-mint"],
  [/(lý|hóa|sinh|khoa học)/i, "bg-sun-soft text-sun"],
  [/(sử|địa)/i, "bg-mint-soft text-mint"],
  [/(nhạc|mỹ thuật|vẽ)/i, "bg-coral-soft text-coral"],
  [/thể dục/i, "bg-sun-soft text-sun"],
];

function getSubjectIcon(name: string) {
  return SUBJECT_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? GraduationCap;
}

export default function SubjectCard({ name, teacher, taskCount = 0 }: SubjectCardProps) {
  const icon = createElement(getSubjectIcon(name), { className: "size-5", "aria-hidden": true });
  const tone = SUBJECT_TONES.find(([pattern]) => pattern.test(name))?.[1] ?? "bg-brand-soft text-brand-strong";

  return (
    <Link
      href={`/student/subject/${encodeURIComponent(name)}`}
      className="group flex h-full flex-col rounded-[18px] border border-line bg-surface p-5 shadow-[0_10px_28px_var(--shadow-color)] transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:border-brand/35 hover:shadow-[0_16px_36px_var(--shadow-color)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-11 place-items-center rounded-[13px] ${tone}`}>
          {icon}
        </div>
        {taskCount > 0 && <span className="rounded-full bg-sun-soft px-2.5 py-1 text-xs font-bold text-sun">{taskCount} việc cần làm</span>}
      </div>
      <h3 className="mt-5 text-base font-extrabold text-ink">{name}</h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-ink-soft">Giáo viên: {teacher}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
        Mở môn học <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

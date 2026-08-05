"use client";

import Link from "next/link";
import { ArrowRight, Brain, Gamepad2, MessageCircle, Puzzle, Sparkles } from "lucide-react";

import { PageHeader, Surface } from "@/components/ui/primitives";

const GAMES = [
  { href: "/student/entertain/memory", title: "Lật hình rèn trí nhớ", description: "Ghép cặp biểu tượng và luyện khả năng tập trung.", icon: Brain, accent: "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-200" },
  { href: "/student/entertain/riddles", title: "Giải đố vui", description: "Một câu đố ngắn, một gợi ý vừa đủ và thật nhiều tò mò.", icon: Puzzle, accent: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-200" },
  { href: "/student/entertain/word-chain", title: "Nối từ tiếng Việt", description: "Nối tiếp từ vựng cùng AI và giữ chuỗi suy nghĩ thật nhanh.", icon: MessageCircle, accent: "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200" },
  { href: "/student/games/crossword", title: "Ô chữ kiến thức", description: "Giải một ô chữ nhỏ để ôn lại vốn từ và kiến thức trên lớp.", icon: Gamepad2, accent: "bg-brand-soft text-brand-strong" },
];

export default function GameCenterPage() {
  return (
    <div>
      <PageHeader title="Góc giải trí học tập" description="Nghỉ ngắn giữa các buổi học bằng những trò chơi nhẹ, có điểm dừng rõ ràng và không gây áp lực." />
      <div className="mb-6 flex items-start gap-3 rounded-[12px] border border-brand/20 bg-brand-soft px-4 py-3 text-sm leading-6 text-brand-strong"><Sparkles className="mt-0.5 size-5 shrink-0" /><p>Mỗi trò chơi được thiết kế cho một phiên ngắn. Hãy chọn hoạt động phù hợp với năng lượng hiện tại của bạn.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((game) => <Link key={game.href} href={game.href} className="group"><Surface className="h-full p-5 transition-[border-color,transform,box-shadow] group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-[0_18px_42px_rgba(28,52,84,0.1)]"><div className={`grid size-12 place-items-center rounded-[14px] ${game.accent}`}><game.icon className="size-6" /></div><div className="mt-5 flex items-start justify-between gap-4"><div><h2 className="text-base font-extrabold text-ink">{game.title}</h2><p className="mt-1 text-sm leading-6 text-ink-soft">{game.description}</p></div><ArrowRight className="mt-1 size-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-brand-strong" /></div><span className="mt-5 inline-flex text-xs font-extrabold text-brand-strong">Chơi ngay</span></Surface></Link>)}
      </div>
    </div>
  );
}

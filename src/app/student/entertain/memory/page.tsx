"use client";

import { useEffect, useRef, useState } from "react";
import { Anchor, Bird, BookOpen, Camera, Coffee, Crown, Flower2, Gamepad2, Gift, Heart, Lightbulb, Moon, Music, RefreshCw, Smile, Star, Sun, Trophy, Zap, type LucideIcon } from "lucide-react";

import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ICONS: LucideIcon[] = [Heart, Sun, Smile, Star, Zap, Moon, Music, Coffee, Flower2, Crown, Anchor, Camera, Gift, Bird, BookOpen, Lightbulb];
const LEVELS = { easy: { pairs: 6, label: "Dễ", columns: "grid-cols-3 sm:grid-cols-4" }, medium: { pairs: 8, label: "Vừa", columns: "grid-cols-4" }, hard: { pairs: 12, label: "Khó", columns: "grid-cols-4 sm:grid-cols-6" } } as const;
type Level = keyof typeof LEVELS;
interface MemoryCard { id: number; iconIndex: number; isFlipped: boolean; isMatched: boolean; }

function shuffledCards(level: Level): MemoryCard[] {
  const pairs = LEVELS[level].pairs;
  const deck = Array.from({ length: pairs * 2 }, (_, index) => ({ id: index, iconIndex: index % pairs, isFlipped: false, isMatched: false }));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }
  return deck;
}

export default function MemoryGamePage() {
  const [level, setLevel] = useState<Level>("easy");
  const [cards, setCards] = useState<MemoryCard[]>(() => shuffledCards("easy"));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [won, setWon] = useState(false);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (flipTimerRef.current) clearTimeout(flipTimerRef.current); }, []);

  function restart(nextLevel: Level = level) {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    setLevel(nextLevel);
    setCards(shuffledCards(nextLevel));
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setWon(false);
  }

  function chooseCard(index: number) {
    if (won || flipped.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;
    const nextCards = cards.map((card, cardIndex) => cardIndex === index ? { ...card, isFlipped: true } : card);
    const nextFlipped = [...flipped, index];
    setCards(nextCards);
    setFlipped(nextFlipped);
    if (nextFlipped.length !== 2) return;
    setMoves((value) => value + 1);
    const [first, second] = nextFlipped;
    if (nextCards[first].iconIndex === nextCards[second].iconIndex) {
      flipTimerRef.current = setTimeout(() => {
        setCards((current) => current.map((card, cardIndex) => cardIndex === first || cardIndex === second ? { ...card, isMatched: true } : card));
        setFlipped([]);
        setMatched((value) => {
          const nextValue = value + 1;
          if (nextValue === LEVELS[level].pairs) setWon(true);
          return nextValue;
        });
      }, 350);
    } else {
      flipTimerRef.current = setTimeout(() => {
        setCards((current) => current.map((card, cardIndex) => cardIndex === first || cardIndex === second ? { ...card, isFlipped: false } : card));
        setFlipped([]);
      }, 800);
    }
  }

  return (
    <div>
      <PageHeader title="Lật hình rèn trí nhớ" description="Ghép đúng các cặp biểu tượng với ít lượt lật nhất có thể." actions={<Button variant="secondary" size="small" onClick={() => restart()}><RefreshCw className="size-4" />Chơi lại</Button>} />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><Surface className="p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-[12px] bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-200"><Gamepad2 className="size-5" /></div><div><h2 className="text-base font-extrabold text-ink">Chọn mức độ</h2><p className="text-sm text-ink-soft">Bàn lớn hơn sẽ cần nhiều lượt tập trung hơn.</p></div></div><div className="mt-5 grid gap-2">{(Object.keys(LEVELS) as Level[]).map((item) => <button key={item} type="button" onClick={() => restart(item)} className={cn("flex items-center justify-between rounded-[10px] border px-4 py-3 text-left", level === item ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/40")}><span><span className="block text-sm font-extrabold text-ink">{LEVELS[item].label}</span><span className="text-xs text-ink-soft">{LEVELS[item].pairs} cặp</span></span>{level === item && <span className="text-xs font-extrabold text-brand-strong">Đang chọn</span>}</button>)}</div><div className="mt-6 grid grid-cols-2 gap-2"><div className="rounded-[10px] bg-surface-subtle p-3"><p className="text-xl font-extrabold text-ink">{moves}</p><p className="text-xs font-bold text-ink-soft">Lượt lật</p></div><div className="rounded-[10px] bg-surface-subtle p-3"><p className="text-xl font-extrabold text-ink">{matched}/{LEVELS[level].pairs}</p><p className="text-xs font-bold text-ink-soft">Cặp đã ghép</p></div></div>{won && <div className="mt-5 rounded-[12px] bg-emerald-50 p-4 text-center dark:bg-emerald-950/30"><Trophy className="mx-auto size-6 text-success" /><p className="mt-2 text-sm font-extrabold text-success">Hoàn thành! Bạn đã ghép đủ tất cả.</p><Button size="small" className="mt-3" onClick={() => restart()}>Chơi ván mới</Button></div>}</Surface><Surface className="p-5 sm:p-6"><div className={cn("mx-auto grid max-w-xl gap-2", LEVELS[level].columns)} aria-label="Bàn chơi lật hình">{cards.map((card, index) => { const Icon = ICONS[card.iconIndex]; const visible = card.isFlipped || card.isMatched; return <button key={card.id} type="button" aria-label={visible ? `Thẻ ${index + 1}` : `Lật thẻ ${index + 1}`} aria-pressed={visible} onClick={() => chooseCard(index)} className={cn("grid aspect-square place-items-center rounded-[12px] border text-brand-strong transition-[background-color,border-color,transform] active:translate-y-px", visible ? card.isMatched ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" : "border-brand/35 bg-brand-soft" : "border-line bg-surface-subtle hover:border-brand/40 hover:bg-surface")}><Icon className={cn("size-7 sm:size-9", visible ? "opacity-100" : "opacity-0")} aria-hidden="true" />{!visible && <span className="text-lg font-extrabold text-brand/55">?</span>}</button>; })}</div></Surface></div>
    </div>
  );
}

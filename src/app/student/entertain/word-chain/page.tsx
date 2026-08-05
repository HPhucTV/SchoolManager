"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Heart, Info, MessageCircle, RefreshCw, Send, SkipForward, Trophy, XCircle } from "lucide-react";

import { ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { gamesApi, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message { id: number; text: string; sender: "student" | "assistant" | "system"; }
type EndReason = "time" | "hearts" | "win" | null;

const INITIAL_MESSAGE: Message = { id: 1, text: "Mình là AI Nối Từ. Hãy bắt đầu bằng một cụm từ gồm hai tiếng nhé.", sender: "assistant" };

export default function WordChainPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [hearts, setHearts] = useState(3);
  const [skips, setSkips] = useState(3);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState<EndReason>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => setTimeLeft((current) => {
      if (current <= 1) { setGameOver("time"); return 0; }
      return current - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function loseHeart(message: string) {
    setHearts((current) => {
      const next = current - 1;
      if (next <= 0) setGameOver("hearts");
      return next;
    });
    setNotice(message);
  }

  async function sendWord() {
    const word = input.trim().toLowerCase();
    if (!word || loading || gameOver) return;
    const parts = word.split(/\s+/);
    if (parts.length !== 2) { setInput(""); loseHeart("Hãy nhập đúng một cụm gồm hai tiếng."); return; }
    const previous = history[history.length - 1];
    if (previous && parts[0] !== previous.split(/\s+/).at(-1)) { setInput(""); loseHeart(`Cụm mới cần bắt đầu bằng “${previous.split(/\s+/).at(-1)}”.`); return; }

    setInput("");
    setNotice("");
    setError("");
    setMessages((current) => [...current, { id: Date.now(), text: word, sender: "student" }]);
    setLoading(true);
    try {
      const response = await gamesApi.playWordChain(word, history);
      if (!response.valid) {
        loseHeart(response.message || "Cụm từ này chưa được ghi nhận. Bạn thử cụm khác nhé.");
      } else if (response.next_word) {
        setMessages((current) => [...current, { id: Date.now() + 1, text: response.next_word!, sender: "assistant" }]);
        setHistory((current) => [...current, word, response.next_word!]);
        setScore((current) => current + 1);
      } else {
        setMessages((current) => [...current, { id: Date.now() + 1, text: response.message || "AI đã hết từ. Bạn thắng rồi!", sender: "assistant" }]);
        setScore((current) => current + 5);
        setGameOver("win");
      }
    } catch (sendError) {
      setError(getErrorMessage(sendError, "Không thể kết nối đến trò chơi."));
    } finally {
      setLoading(false);
    }
  }

  function skip() {
    if (skips <= 0 || loading || gameOver) return;
    setSkips((current) => current - 1);
    setHistory(["bắt đầu"]);
    setMessages((current) => [...current, { id: Date.now(), text: "Bạn đã bỏ qua lượt này.", sender: "system" }, { id: Date.now() + 1, text: "bắt đầu", sender: "assistant" }]);
    setNotice("Lượt mới bắt đầu bằng cụm “bắt đầu”.");
  }

  function restart() {
    setMessages([INITIAL_MESSAGE]);
    setHistory([]);
    setInput("");
    setTimeLeft(90);
    setHearts(3);
    setSkips(3);
    setScore(0);
    setGameOver(null);
    setNotice("");
    setError("");
  }

  const formatTime = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;

  return (
    <div>
      <PageHeader title="Nối từ tiếng Việt" description="Giữ chuỗi từ vựng trong 90 giây. Mỗi cụm gồm hai tiếng và nối từ cuối của lượt trước." actions={<div className="flex items-center gap-3"><span className={cn("inline-flex items-center gap-1.5 text-sm font-extrabold", hearts === 1 ? "text-danger" : "text-ink-soft")} aria-label={`${hearts} trái tim`}><Heart className="size-4" fill="currentColor" />{hearts}</span><span className={cn("inline-flex items-center gap-1.5 text-sm font-extrabold", timeLeft <= 10 ? "text-danger" : "text-brand-strong")}><Clock3 className="size-4" />{formatTime}</span><span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-strong"><Trophy className="size-4" />{score}</span></div>} />
      {error && <ErrorState className="mb-5" title="Không thể gửi lượt chơi" description={error} action={<Button variant="secondary" size="small" onClick={() => setError("")}>Đóng</Button>} />}
      <div className="mx-auto max-w-2xl"><Surface className="overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><div className="flex items-center gap-2"><MessageCircle className="size-5 text-brand-strong" /><h2 className="text-sm font-extrabold text-ink">Phòng nối từ</h2></div><Button variant="secondary" size="small" disabled={skips <= 0 || loading || Boolean(gameOver)} onClick={skip}><SkipForward className="size-4" />Bỏ qua ({skips})</Button></div><div className="max-h-[58vh] min-h-[22rem] space-y-3 overflow-y-auto bg-surface-subtle px-4 py-5 sm:px-6">{messages.map((message) => <div key={message.id} className={cn("flex", message.sender === "student" ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] rounded-[12px] px-4 py-3 text-sm leading-6", message.sender === "student" ? "bg-brand text-white" : message.sender === "system" ? "border border-line bg-surface text-ink-soft" : "bg-surface text-ink shadow-sm")}><p>{message.text}</p><span className="mt-1 block text-[11px] font-bold opacity-70">{message.sender === "student" ? "Bạn" : message.sender === "assistant" ? "Trợ lý" : "Hệ thống"}</span></div></div>)}{loading && <div className="flex items-center gap-2 text-sm font-bold text-ink-soft"><span className="flex gap-1"><i className="size-1.5 rounded-full bg-brand" /><i className="size-1.5 rounded-full bg-brand" /><i className="size-1.5 rounded-full bg-brand" /></span>Đang tìm từ tiếp theo...</div>}<div ref={messagesEndRef} /></div>{notice && !gameOver && <p role="status" className="border-t border-line bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{notice}</p>}{gameOver && <div className="border-t border-line bg-brand-soft px-5 py-5 text-center"><div className="mx-auto grid size-10 place-items-center rounded-full bg-surface text-brand-strong">{gameOver === "win" ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}</div><h3 className="mt-3 text-base font-extrabold text-ink">{gameOver === "win" ? "Bạn đã thắng" : gameOver === "time" ? "Hết giờ" : "Hết trái tim"}</h3><p className="mt-1 text-sm text-ink-soft">Điểm phiên này: {score}</p><Button size="small" className="mt-3" onClick={restart}><RefreshCw className="size-4" />Chơi lại</Button></div>}<div className="border-t border-line p-4"><label htmlFor="next-word" className="sr-only">Cụm từ tiếp theo</label><div className="flex gap-2"><Input id="next-word" aria-describedby="next-word-help" value={input} disabled={loading || Boolean(gameOver)} placeholder="Ví dụ: học tập" onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendWord(); }} /><Button size="icon" aria-label="Gửi cụm từ" disabled={loading || Boolean(gameOver) || !input.trim()} onClick={() => void sendWord()}><Send className="size-4" /></Button></div><p id="next-word-help" className="mt-2 text-xs text-ink-soft">Hai tiếng, bắt đầu bằng tiếng cuối của cụm trước.</p></div></Surface><p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-ink-soft"><Info className="size-3.5" />Không trừ điểm khi câu trả lời không hợp lệ; chỉ mất một trái tim.</p></div>
    </div>
  );
}

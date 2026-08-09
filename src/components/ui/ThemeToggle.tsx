"use client";

import { SunMoon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme
      || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("schoolmanager-theme", nextTheme);
  };

  return (
    <button
      type="button"
      aria-label="Chuyển giao diện sáng hoặc tối"
      title="Chuyển giao diện sáng hoặc tối"
      onClick={toggleTheme}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-[13px] border border-line bg-surface text-ink-soft shadow-[0_6px_18px_var(--shadow-color)] transition-[color,border-color,background-color,transform] hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand-strong active:translate-y-0",
        className,
      )}
    >
      <SunMoon className="size-[19px]" />
    </button>
  );
}

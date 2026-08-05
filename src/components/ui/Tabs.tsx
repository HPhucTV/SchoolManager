"use client";

import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  label: string;
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ label, options, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("mb-5 flex max-w-full gap-1 overflow-x-auto rounded-[12px] border border-line bg-surface-subtle p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={cn(
            "min-h-10 shrink-0 rounded-[9px] px-4 text-sm font-bold transition-colors",
            value === option.value
              ? "bg-surface text-brand-strong shadow-sm"
              : "text-ink-soft hover:bg-surface/65 hover:text-ink",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

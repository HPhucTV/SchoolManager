import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
  subtitle?: string;
}

export function BrandMark({ compact = false, className, subtitle }: BrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Image
        src="/logo.png"
        alt="Biểu trưng SchoolManager"
        width={44}
        height={44}
        className="size-10 shrink-0 rounded-[12px] shadow-[0_8px_24px_rgba(21,87,176,0.18)]"
      />
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-current">
            SchoolManager
          </div>
          {subtitle && <div className="truncate text-[11px] font-medium text-ink-soft">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}

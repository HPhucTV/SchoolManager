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
        className="size-11 shrink-0 rounded-[14px] shadow-[0_8px_20px_color-mix(in_srgb,var(--brand)_22%,transparent)]"
      />
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-[16px] font-extrabold tracking-[-0.025em] text-current">
            SchoolManager
          </div>
          {subtitle && <div className="mt-0.5 truncate text-[11px] font-semibold text-ink-soft">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}

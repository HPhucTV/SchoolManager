import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-4 text-sm font-bold transition-[background-color,color,border-color,transform,box-shadow] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white shadow-[0_8px_20px_rgba(21,87,176,0.18)] hover:bg-brand-strong",
        secondary: "border border-line bg-surface text-ink hover:border-brand/40 hover:bg-brand-soft",
        ghost: "text-ink-soft hover:bg-surface-subtle hover:text-ink",
        danger: "bg-red-50 text-danger hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70",
      },
      size: {
        default: "h-11",
        small: "h-9 min-h-9 px-3 text-xs",
        large: "h-12 px-5 text-base",
        icon: "size-11 min-h-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export function Surface({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-line bg-surface shadow-[0_14px_40px_rgba(28,52,84,0.06)]",
        className,
      )}
      {...props}
    />
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-ink sm:text-[30px]">{title}</h1>
        <p className="mt-1 max-w-[65ch] text-sm leading-6 text-ink-soft">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[10px] bg-surface-subtle", className)} />;
}

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-success dark:bg-emerald-950/40">
      {children}
    </span>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "small" | "large" | "icon";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "border border-brand bg-brand text-white shadow-[0_8px_18px_color-mix(in_srgb,var(--brand)_24%,transparent)] hover:border-brand-strong hover:bg-brand-strong",
  secondary: "border border-line bg-surface-elevated text-ink shadow-[0_4px_12px_var(--shadow-color)] hover:border-brand/40 hover:bg-brand-soft",
  ghost: "text-ink-soft hover:bg-surface-subtle hover:text-ink",
  danger: "border border-red-200 bg-red-50 text-danger hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:hover:bg-red-950/70",
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  default: "h-11",
  small: "h-9 min-h-9 px-3 text-xs",
  large: "h-12 px-5 text-base",
  icon: "size-11 min-h-11 px-0",
};

export function buttonVariants({
  variant = "primary",
  size = "default",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-4 text-sm font-bold transition-[background-color,color,border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55",
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export function Surface({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-line bg-surface shadow-[0_14px_36px_var(--shadow-color)]",
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
    <div className="page-intro relative mb-8 overflow-hidden rounded-[22px] border border-line px-5 py-6 sm:flex sm:items-end sm:justify-between sm:gap-6 sm:px-7 sm:py-7">
      <div className="relative max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-ink sm:text-[32px]">{title}</h1>
        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-ink-soft sm:text-[15px]">{description}</p>
      </div>
      {actions && <div className="relative mt-5 flex shrink-0 flex-wrap gap-2 sm:mt-0">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[14px] bg-surface-subtle", className)} />;
}

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-success dark:border-emerald-900 dark:bg-emerald-950/40">
      {children}
    </span>
  );
}

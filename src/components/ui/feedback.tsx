"use client";

import * as React from "react";
import { AlertTriangle, Inbox, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./primitives";

interface StatePanelProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox, className }: StatePanelProps) {
  return (
    <div className={cn("grid min-h-52 place-items-center px-5 py-10 text-center", className)}>
      <div className="max-w-md">
        <div className="mx-auto grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-extrabold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StatePanelProps) {
  return (
    <div className={cn("rounded-[12px] border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/30", className)} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-danger">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "small" | "medium" | "large";
}

export function Dialog({ open, onClose, title, description, children, footer, size = "medium" }: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!open) return;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !panelRef.current) return;
      const elements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "my-6 w-full rounded-[16px] border border-line bg-surface shadow-[0_24px_70px_rgba(15,23,42,0.28)]",
          size === "small" && "max-w-md",
          size === "medium" && "max-w-xl",
          size === "large" && "max-w-3xl",
        )}
      >
        <div className="flex items-start justify-between gap-5 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-extrabold text-ink">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-1 shrink-0" aria-label="Đóng hộp thoại" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  busy,
  tone = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="small"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Đang xử lý..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-ink-soft">Hành động chỉ được thực hiện sau khi bạn xác nhận.</p>
    </Dialog>
  );
}

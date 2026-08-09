import * as React from "react";

import { cn } from "@/lib/utils";

const controlClassName =
  "min-h-11 w-full rounded-[12px] border border-line bg-surface-elevated px-3.5 text-sm text-ink shadow-[0_3px_10px_var(--shadow-color)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-soft/65 hover:border-brand/35 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-70";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(controlClassName, className)} {...props} />,
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(controlClassName, className)} {...props} />,
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlClassName, "min-h-28 resize-y py-3", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

interface FieldProps {
  children: React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  label: string;
  name: string;
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function Field({ children, label, name, helper, error, required, className }: FieldProps) {
  const inputId = children.props.id || name;
  const descriptionId = helper || error ? `${inputId}-description` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={inputId} className="text-sm font-bold text-ink">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
      </label>
      {React.cloneElement(children, {
        id: inputId,
        "aria-describedby": descriptionId,
        "aria-invalid": Boolean(error),
      })}
      {(error || helper) && (
        <p id={descriptionId} className={cn("text-xs leading-5", error ? "font-semibold text-danger" : "text-ink-soft")}>
          {error || helper}
        </p>
      )}
    </div>
  );
}

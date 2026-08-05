import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./primitives";
import { Input } from "./forms";

interface FilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchLabel?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function FilterToolbar({
  searchValue,
  onSearchChange,
  searchLabel = "Tìm kiếm",
  children,
  actions,
}: FilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">{searchLabel}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchLabel}
            className="pl-10"
          />
        </label>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, totalItems, itemLabel = "mục", onPageChange, className }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  return (
    <div className={cn("flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-ink-soft">
        Trang <strong className="text-ink">{page}</strong> / {safeTotalPages}
        {typeof totalItems === "number" && <> · {totalItems} {itemLabel}</>}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" aria-hidden="true" /> Trước
        </Button>
        <Button variant="secondary" size="small" disabled={page >= safeTotalPages} onClick={() => onPageChange(page + 1)}>
          Sau <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

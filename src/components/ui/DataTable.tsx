import * as React from "react";

import { cn } from "@/lib/utils";
import { EmptyState } from "./feedback";
import { Skeleton } from "./primitives";

export interface DataColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  ariaLabel: string;
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  ariaLabel,
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Dữ liệu sẽ xuất hiện tại đây khi được tạo.",
}: DataTableProps<T>) {
  if (!loading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm" aria-label={ariaLabel}>
        <thead>
          <tr className="border-b border-line bg-surface-subtle/70">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-ink-soft",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading
            ? Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4"><Skeleton className="h-5 w-full max-w-36" /></td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-surface-subtle/55">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3.5 align-middle text-ink",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

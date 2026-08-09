"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export interface RoleNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface RoleShellProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  homeHref: string;
  navItems: RoleNavItem[];
  roleLabel: string;
}

export function RoleShell({ children, headerActions, homeHref, navItems, roleLabel }: RoleShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPage = navItems.find(
    (item) => pathname === item.href || (item.href !== homeHref && pathname.startsWith(`${item.href}/`)),
  );
  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SM";

  return (
    <div className="school-grid min-h-[100dvh] text-ink">
      {menuOpen && (
        <button
          type="button"
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-line bg-surface/96 px-4 py-5 shadow-[12px_0_40px_var(--shadow-color)] backdrop-blur-xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2 pb-5">
          <Link href={homeHref} onClick={() => setMenuOpen(false)}>
            <BrandMark subtitle={roleLabel} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mx-2 h-px bg-line" />
        <p className="px-3 pb-2 pt-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-soft">Điều hướng</p>
        <nav aria-label={`Điều hướng ${roleLabel}`} className="flex flex-1 flex-col gap-1 overflow-y-auto py-1 pr-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "group relative flex min-h-12 items-center gap-3 rounded-[13px] px-3 text-sm font-semibold transition-[color,background-color,transform]",
                  active
                    ? "bg-brand-soft text-brand-strong shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_12%,transparent)]"
                    : "text-ink-soft hover:translate-x-0.5 hover:bg-surface-subtle hover:text-ink",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px]", active ? "bg-surface-elevated" : "group-hover:bg-surface")}>
                  <item.icon className="size-[18px]" strokeWidth={1.8} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-[16px] border border-line bg-surface-subtle p-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand text-xs font-extrabold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-ink">{user?.name || "Người dùng"}</p>
              <p className="truncate text-[11px] font-semibold text-ink-soft">{roleLabel}</p>
            </div>
            <Button variant="ghost" size="icon" className="size-10 min-h-10 text-danger hover:bg-coral-soft hover:text-danger" aria-label="Đăng xuất" title="Đăng xuất" onClick={logout}>
              <LogOut className="size-[18px]" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/88 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Mở menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0">
                <p className="hidden text-[11px] font-semibold text-ink-soft sm:block">{roleLabel}</p>
                <p className="truncate text-sm font-extrabold text-ink">{currentPage?.label || "Tổng quan"}</p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              {headerActions}
              <ThemeToggle />
              <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand text-sm font-extrabold text-white shadow-[0_6px_18px_color-mix(in_srgb,var(--brand)_24%,transparent)] lg:hidden">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

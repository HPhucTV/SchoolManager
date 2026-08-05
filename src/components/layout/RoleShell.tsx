"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/primitives";

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
    <div className="min-h-[100dvh] bg-canvas text-ink">
      {menuOpen && (
        <button
          type="button"
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-surface px-4 py-5 transition-transform duration-200 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
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

        <nav aria-label={`Điều hướng ${roleLabel}`} className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto py-1 pr-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-soft text-brand-strong"
                    : "text-ink-soft hover:bg-surface-subtle hover:text-ink",
                )}
              >
                <item.icon className="size-[19px]" strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button variant="danger" className="w-full justify-start" onClick={logout}>
          <LogOut className="size-[18px]" />
          Đăng xuất
        </Button>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
                <p className="truncate text-sm font-bold text-ink">{currentPage?.label || roleLabel}</p>
                <p className="hidden text-xs text-ink-soft sm:block">Không gian làm việc của {roleLabel.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              {headerActions}
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-48 truncate text-sm font-bold text-ink">{user?.name || "Người dùng"}</p>
                <p className="text-xs text-ink-soft">{roleLabel}</p>
              </div>
              <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand text-sm font-extrabold text-white">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

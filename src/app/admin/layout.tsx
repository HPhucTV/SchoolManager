"use client";

import { BookOpen, GraduationCap, LayoutDashboard, Settings, Users } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { RoleShell, type RoleNavItem } from "@/components/layout/RoleShell";

const navItems: RoleNavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/giao-vien", label: "Giáo viên", icon: Users },
  { href: "/admin/lop-hoc", label: "Lớp học", icon: BookOpen },
  { href: "/admin/hoc-sinh", label: "Học sinh", icon: GraduationCap },
  { href: "/admin/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <RoleShell homeHref="/admin" navItems={navItems} roleLabel="Quản trị viên">
        {children}
      </RoleShell>
    </ProtectedRoute>
  );
}

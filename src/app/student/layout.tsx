"use client";

import {
  Bell,
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  School,
  Settings,
} from "lucide-react";

import { RoleShell, type RoleNavItem } from "@/components/layout/RoleShell";
import ProtectedRoute from "@/components/ProtectedRoute";

const navItems: RoleNavItem[] = [
  { href: "/student", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/student/lop-hoc", label: "Lớp học", icon: School },
  { href: "/student/thoi-khoa-bieu", label: "Thời khóa biểu", icon: CalendarDays },
  { href: "/student/notifications", label: "Thông báo", icon: Bell },
  { href: "/student/mood-journal", label: "Nhật ký cảm xúc", icon: HeartHandshake },
  { href: "/student/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <RoleShell homeHref="/student" navItems={navItems} roleLabel="Học sinh">
        {children}
      </RoleShell>
    </ProtectedRoute>
  );
}

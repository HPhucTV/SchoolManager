"use client";

import {
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  School,
  Settings,
} from "lucide-react";

import { RoleShell, type RoleNavItem } from "@/components/layout/RoleShell";
import ProtectedRoute from "@/components/ProtectedRoute";

const navItems: RoleNavItem[] = [
  { href: "/teacher", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/teacher/lop-hoc", label: "Lớp học", icon: School },
  { href: "/teacher/bai-tap", label: "Bài tập", icon: ClipboardList },
  { href: "/teacher/kiem-tra", label: "Kiểm tra", icon: BookOpenCheck },
  { href: "/teacher/thoi-khoa-bieu", label: "Thời khóa biểu", icon: CalendarDays },
  { href: "/teacher/suc-khoe", label: "Sức khỏe tinh thần", icon: HeartPulse },
  { href: "/teacher/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <RoleShell
        homeHref="/teacher"
        navItems={navItems}
        roleLabel="Giáo viên"
      >
        {children}
      </RoleShell>
    </ProtectedRoute>
  );
}

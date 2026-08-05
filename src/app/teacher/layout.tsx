"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  School,
  Search,
  Settings,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

import GlobalSearch from "@/components/layout/GlobalSearch";
import { RoleShell, type RoleNavItem } from "@/components/layout/RoleShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeacherChatBot from "@/components/TeacherChatBot";
import { Button } from "@/components/ui/primitives";

const navItems: RoleNavItem[] = [
  { href: "/teacher", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/teacher/lop-hoc", label: "Lớp học", icon: School },
  { href: "/teacher/bai-tap", label: "Bài tập", icon: ClipboardList },
  { href: "/teacher/kiem-tra", label: "Kiểm tra", icon: BookOpenCheck },
  { href: "/teacher/thoi-khoa-bieu", label: "Thời khóa biểu", icon: CalendarDays },
  { href: "/teacher/hoc-sinh", label: "Học sinh", icon: Users },
  { href: "/teacher/thong-ke", label: "Thống kê", icon: BarChart3 },
  { href: "/teacher/hoat-dong", label: "Hoạt động", icon: Activity },
  { href: "/teacher/phan-tich", label: "Phân tích học tập", icon: ChartNoAxesCombined },
  { href: "/teacher/suc-khoe", label: "Sức khỏe tinh thần", icon: HeartPulse },
  { href: "/teacher/thi-dua", label: "Thi đua", icon: Trophy },
  { href: "/teacher/quiz-battle", label: "Quiz Battle", icon: Swords },
  { href: "/teacher/bai-kiem-tra", label: "Kho đề kiểm tra", icon: GraduationCap },
  { href: "/teacher/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <RoleShell
        homeHref="/teacher"
        navItems={navItems}
        roleLabel="Giáo viên"
        headerActions={
          <Button variant="secondary" size="small" onClick={() => setSearchOpen(true)} aria-label="Mở tìm kiếm toàn cục">
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden md:inline">Tìm kiếm</span>
          </Button>
        }
      >
        {children}
      </RoleShell>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <TeacherChatBot />
    </ProtectedRoute>
  );
}

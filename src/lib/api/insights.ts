import { apiRequest } from "./client";

export interface TodayScheduleItem {
  id: number;
  subject: string;
  start_time: string;
  end_time: string;
  room?: string | null;
  class_id: number;
  class_name: string;
  teacher_name?: string | null;
}

export interface TodayWorkItem {
  kind: "assignment" | "quiz";
  id: number;
  title: string;
  subject?: string | null;
  deadline: string;
  is_overdue: boolean;
  class_id: number;
  class_name: string;
  action_url: string;
}

export interface AttentionItem {
  id: string;
  kind: "sos" | "missing_assignment" | "low_quiz_score";
  priority: "high" | "medium";
  title: string;
  description: string;
  class_id: number;
  class_name: string;
  student_id?: number | null;
  action_url: string;
  occurred_at?: string | null;
}

export interface TodayDashboard {
  date: string;
  schedule: TodayScheduleItem[];
  work_items: TodayWorkItem[];
  attention: AttentionItem[];
  unread_notifications: number;
}

export interface GradebookStudent {
  student_id: number;
  student_name: string;
  student_email: string;
  assignment_average?: number | null;
  quiz_average?: number | null;
  overall_average?: number | null;
  graded_items: number;
  total_items: number;
  missing_items: number;
  needs_attention: boolean;
}

export interface ClassGradebook {
  class_id: number;
  class_name: string;
  assignment_count: number;
  quiz_count: number;
  students: GradebookStudent[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface StudentSubjectGrade {
  subject: string;
  assignment_average?: number | null;
  quiz_average?: number | null;
  overall_average?: number | null;
  completed_items: number;
  graded_items: number;
  total_items: number;
  needs_review: boolean;
}

export interface StudentGradebook {
  class_id?: number | null;
  class_name?: string | null;
  overall_average?: number | null;
  subjects: StudentSubjectGrade[];
}

export const insightsApi = {
  getToday: () => apiRequest<TodayDashboard>("/api/dashboard/today", { cache: "no-store" }),
  getClassGradebook: (classId: number, page = 1, pageSize = 100) =>
    apiRequest<ClassGradebook>(
      `/api/classes/${classId}/gradebook?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" },
    ),
  getStudentGradebook: () =>
    apiRequest<StudentGradebook>("/api/student/gradebook", { cache: "no-store" }),
};

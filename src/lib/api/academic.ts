import { apiRequest } from "./client";

export interface OnlineSession {
  active: boolean;
  room_url: string | null;
}

export interface StudentDashboard {
  student: {
    name: string;
    class_name?: string | null;
    happiness_score: number;
    engagement_score: number;
    mental_health_score: number;
    status: string;
  };
  online_session?: OnlineSession;
  assignments_status?: { total: number; completed: number; pending: number };
  recent_activities?: Array<{ id: number; title: string; description?: string; created_at?: string }>;
  pending_surveys?: Array<{ id: number; title: string; completed: boolean }>;
}

export interface StudentSubject {
  id: string;
  name: string;
  teacher: string;
  task_count: number;
}

export interface SubjectDetails {
  subject: string;
  class_info: {
    meeting_link: string | null;
    online_enabled: boolean;
    teacher_name: string;
    teacher_email?: string;
    teacher_phone?: string;
  } | null;
  assignments: Array<{ id: number; title: string; deadline: string | null; status: string; score: number | null }>;
  quizzes: Array<{ id: number; title: string; total_questions: number; has_attempted: boolean; score: number | null }>;
  notifications: unknown[];
  surveys: unknown[];
}

export interface ScheduleItem {
  id: number;
  subject: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  teacher_id?: number;
  class_id?: number;
  semester?: string;
  year?: string;
}

export interface TeacherClassSummary {
  id: number;
  name: string;
  grade: string;
}

export interface StudentClassDetails extends TeacherClassSummary {
  teacher_id?: number | null;
  teacher_name?: string | null;
  student_count: number;
  happiness_score: number;
  engagement_score: number;
  mental_health_score: number;
  meeting_link?: string | null;
  online_enabled: boolean;
}

interface SchedulePayload {
  subject: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  teacher_id?: number;
  semester: string;
  year: string;
}

export const studentAcademicApi = {
  getDashboard: () => apiRequest<StudentDashboard>("/api/student/dashboard"),
  getSubjects: () => apiRequest<StudentSubject[]>("/api/student/subjects"),
  getSubject: (name: string) => apiRequest<SubjectDetails>(`/api/student/subjects/${encodeURIComponent(name)}`),
  getClass: (id: number) => apiRequest<StudentClassDetails>(`/api/classes/${id}`),
  joinClass: (classCode: string) =>
    apiRequest<{ message: string; class_id?: number; class_name: string }>("/api/student/join-class", {
      method: "POST",
      body: JSON.stringify({ class_code: classCode }),
    }),
  getSchedule: () => apiRequest<ScheduleItem[]>("/api/schedules/my-schedule"),
};

export const teacherAcademicApi = {
  getClasses: () => apiRequest<TeacherClassSummary[]>("/api/classes", { cache: "no-store" }),
  getSchedule: () => apiRequest<ScheduleItem[]>("/api/schedules/my-schedule"),
  createSchedule: (data: SchedulePayload & { class_id: number }) =>
    apiRequest<ScheduleItem>("/api/schedules/", { method: "POST", body: JSON.stringify(data) }),
  updateSchedule: (id: number, data: SchedulePayload) =>
    apiRequest<ScheduleItem>(`/api/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSchedule: (id: number) => apiRequest(`/api/schedules/${id}`, { method: "DELETE" }),
};

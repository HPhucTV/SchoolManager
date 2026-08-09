import { apiRequest } from "./client";

export interface MoodEntry {
  id: number;
  mood_level: number;
  mood_emoji: string;
  note?: string;
  created_at: string;
}

export interface MoodAnalytics {
  avg_week: number;
  avg_month: number;
  trend: "improving" | "stable" | "declining";
  total_entries: number;
  distribution: Record<number, number>;
  recent_entries: Array<Pick<MoodEntry, "mood_level" | "mood_emoji" | "created_at">>;
}

export interface SOSAlert {
  id: number;
  student_id: number | null;
  student_name: string;
  message: string;
  is_anonymous: boolean;
  status: "pending" | "reviewing" | "resolved";
  reviewer_note?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ClassWellness {
  total_students: number;
  avg_mood: number;
  status_counts: Record<string, number>;
  active_sos_count: number;
  students: Array<{ id: number; name: string; status: string; avg_mood: number; has_recent_checkin: boolean }>;
}

export const wellnessApi = {
  createMood: (data: { mood_level: number; mood_emoji: string; note?: string }) =>
    apiRequest<MoodEntry>("/api/wellness/mood", { method: "POST", body: JSON.stringify(data) }),
  getMoodHistory: (days = 30) => apiRequest<MoodEntry[]>(`/api/wellness/mood/history?days=${days}`),
  getMoodAnalytics: () => apiRequest<MoodAnalytics>("/api/wellness/mood/analytics"),
  createSOS: (data: { message: string; is_anonymous?: boolean }) =>
    apiRequest<{ message: string; id: number }>("/api/wellness/sos", { method: "POST", body: JSON.stringify(data) }),
  getSOSAlerts: (status?: SOSAlert["status"]) =>
    apiRequest<SOSAlert[]>(`/api/wellness/sos/alerts${status ? `?status=${status}` : ""}`),
  updateSOS: (id: number, data: { status: "reviewing" | "resolved"; reviewer_note?: string }) =>
    apiRequest<{ message: string }>(`/api/wellness/sos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getClassWellness: (classId: number) => apiRequest<ClassWellness>(`/api/wellness/class/${classId}`),
};

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}

export const notificationsApi = {
  list: () => apiRequest<NotificationItem[]>("/api/notifications"),
  markRead: (id: number) => apiRequest<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () => apiRequest<{ ok: boolean }>("/api/notifications/read-all", { method: "PUT" }),
};

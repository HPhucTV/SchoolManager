import { apiRequest } from "./client";
import type { Activity, DashboardMetrics, Quiz, Statistics, Student, StudentStats } from "./types";

export const activitiesApi = {
  getActivities: ({ limit = 100 }: { limit?: number } = {}) =>
    apiRequest<Activity[]>(`/api/activities/?limit=${limit}`),
  createActivity: (data: Partial<Activity>) =>
    apiRequest<Activity>("/api/activities/", { method: "POST", body: JSON.stringify(data) }),
  updateActivity: (id: number, data: Partial<Activity>) =>
    apiRequest<Activity>(`/api/activities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteActivity: (id: number) => apiRequest(`/api/activities/${id}`, { method: "DELETE" }),
};

export const dashboardApi = {
  getMetrics: () => apiRequest<DashboardMetrics>("/api/dashboard/metrics"),
};

export const studentsApi = {
  getStudents: ({ page = 1, page_size = 10, search = "" }: { page?: number; page_size?: number; search?: string } = {}) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(page_size) });
    if (search) params.set("search", search);
    return apiRequest<{ students: Student[]; total: number }>(`/api/students?${params}`);
  },
  getStats: () => apiRequest<StudentStats>("/api/students/stats"),
};

export const statisticsApi = {
  getStatistics: () => apiRequest<Statistics>("/api/statistics"),
  getClasses: () => apiRequest("/api/statistics/classes"),
};

export const quizzesApi = {
  getQuizzes: () => apiRequest<Quiz[]>("/api/quizzes"),
  createQuiz: <T extends object>(data: T) =>
    apiRequest<Quiz>("/api/quizzes", { method: "POST", body: JSON.stringify(data) }),
  updateQuiz: <T extends object>(id: number, data: T) =>
    apiRequest<Quiz>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteQuiz: (id: number) => apiRequest(`/api/quizzes/${id}`, { method: "DELETE" }),
};

export const classesApi = {
  getClasses: () => apiRequest("/api/auth/classes"),
};

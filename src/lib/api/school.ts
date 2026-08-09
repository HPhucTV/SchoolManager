import { apiRequest } from "./client";
import type { DashboardMetrics, Quiz } from "./types";

export const dashboardApi = {
  getMetrics: () => apiRequest<DashboardMetrics>("/api/dashboard/metrics"),
};

export const quizzesApi = {
  getQuizzes: () => apiRequest<Quiz[]>("/api/quizzes"),
  createQuiz: <T extends object>(data: T) =>
    apiRequest<Quiz>("/api/quizzes", { method: "POST", body: JSON.stringify(data) }),
  updateQuiz: <T extends object>(id: number, data: T) =>
    apiRequest<Quiz>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteQuiz: (id: number) => apiRequest(`/api/quizzes/${id}`, { method: "DELETE" }),
};

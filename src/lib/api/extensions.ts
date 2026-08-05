import { apiRequest } from "./client";

export const wellnessApi = {
  createMood: (data: { mood_level: number; mood_emoji: string; note?: string }) =>
    apiRequest("/api/wellness/mood", { method: "POST", body: JSON.stringify(data) }),
  getMoodHistory: (days = 30) => apiRequest(`/api/wellness/mood/history?days=${days}`),
  getMoodAnalytics: () => apiRequest("/api/wellness/mood/analytics"),
  createSOS: (data: { message: string; is_anonymous?: boolean }) =>
    apiRequest("/api/wellness/sos", { method: "POST", body: JSON.stringify(data) }),
  getSOSAlerts: (status?: string) => apiRequest(`/api/wellness/sos/alerts${status ? `?status=${status}` : ""}`),
  updateSOS: (id: number, data: { status: string; reviewer_note?: string }) =>
    apiRequest(`/api/wellness/sos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getClassWellness: (classId: number) => apiRequest(`/api/wellness/class/${classId}`),
};

export const aiTutorApi = {
  getAnalysis: () => apiRequest("/api/ai-tutor/analysis"),
  getRecommendations: () => apiRequest("/api/ai-tutor/recommendations"),
  getLearningPath: () => apiRequest("/api/ai-tutor/learning-path"),
};

export const gamificationApi = {
  checkIn: () => apiRequest("/api/gamification/check-in", { method: "POST" }),
  getBadges: () => apiRequest("/api/gamification/badges"),
  getMyStats: () => apiRequest("/api/gamification/my-stats"),
  getLeaderboard: (scope = "class") => apiRequest(`/api/gamification/leaderboard?scope=${scope}`),
  getShop: () => apiRequest("/api/gamification/shop"),
  buyItem: (itemId: number) => apiRequest(`/api/gamification/shop/buy/${itemId}`, { method: "POST" }),
};

export const analyticsApi = {
  getStudentTrends: (studentId: number) => apiRequest(`/api/analytics/trends/${studentId}`),
  getEarlyWarnings: () => apiRequest("/api/analytics/early-warning"),
  getClassReport: (classId: number) => apiRequest(`/api/analytics/class-report/${classId}`),
  getMissingWork: () => apiRequest("/api/analytics/missing-work"),
};

export const reportApi = {
  createTeacherReport: (data: { class_id: number; report_type: string; content: string }) =>
    apiRequest("/api/teacher/reports", { method: "POST", body: JSON.stringify(data) }),
  listTeacherReports: () => apiRequest("/api/teacher/reports"),
};

export const quizBattleApi = {
  create: (data: { quiz_id: number; time_per_question?: number }) =>
    apiRequest("/api/battle/create", { method: "POST", body: JSON.stringify(data) }),
  join: (code: string) =>
    apiRequest("/api/battle/join", { method: "POST", body: JSON.stringify({ battle_code: code }) }),
  start: (battleId: number) => apiRequest(`/api/battle/${battleId}/start`, { method: "POST" }),
  getStatus: (battleId: number) => apiRequest(`/api/battle/${battleId}`),
  getQuestion: (battleId: number, index: number) =>
    apiRequest(`/api/battle/${battleId}/question?question_index=${index}`),
  submitAnswer: (battleId: number, data: { question_index: number; answer: string; time_taken: number }) =>
    apiRequest(`/api/battle/${battleId}/answer`, { method: "POST", body: JSON.stringify(data) }),
  getLeaderboard: (battleId: number) => apiRequest(`/api/battle/${battleId}/leaderboard`),
  getActive: () => apiRequest("/api/battle/active"),
};

export const aiGradingApi = {
  gradeSubmission: (assignmentId: number, submissionId: number) =>
    apiRequest(`/api/assignments/${assignmentId}/ai-grade/${submissionId}`, { method: "POST" }),
};

export const searchApi = {
  search: (query: string, type = "all", limit = 20) => {
    const params = new URLSearchParams({ q: query, type, limit: String(limit) });
    return apiRequest(`/api/search?${params}`);
  },
  getSuggestions: (query = "") => apiRequest(`/api/search/suggestions?${new URLSearchParams({ q: query })}`),
  logClick: (data: { query: string; result_type: string; result_id: number }) =>
    apiRequest("/api/search/log-click", { method: "POST", body: JSON.stringify(data) }),
};

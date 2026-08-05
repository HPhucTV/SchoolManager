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

export interface TutorSubject {
  subject: string;
  avg_score: number;
  total_tests: number;
  trend: "improving" | "stable" | "declining";
  topics: Array<{ topic: string; avg_score: number; count: number }>;
}

export interface TutorAnalysis {
  overall_avg: number;
  total_quizzes: number;
  total_assignments: number;
  strengths: string[];
  weaknesses: string[];
  subjects: TutorSubject[];
  level: number;
  xp: number;
}

export interface TutorRecommendations {
  recommendations: Array<{
    subject: string;
    topic: string;
    current_level: number;
    priority: "high" | "medium" | "low";
    suggestion: string;
    recommended_action: string;
  }>;
  ai_advice: string;
  study_streak: number;
  total_analyzed: number;
}

export interface TutorLearningPath {
  overall_mastery: number;
  total_subjects: number;
  total_assessments: number;
  current_level: number;
  xp_to_next: number;
  path: Array<{
    subject: string;
    mastery_level: number;
    stage: string;
    stage_icon: string;
    topics_completed: number;
    total_tests: number;
    next_step: string;
    progress: number;
  }>;
}

export const AI_TUTOR_USAGE_NOTICE = "Phân tích cục bộ từ dữ liệu học tập, không giới hạn lượt xem.";

export const aiTutorApi = {
  getAnalysis: () => apiRequest<TutorAnalysis>("/api/ai-tutor/analysis"),
  getRecommendations: () => apiRequest<TutorRecommendations>("/api/ai-tutor/recommendations"),
  getLearningPath: () => apiRequest<TutorLearningPath>("/api/ai-tutor/learning-path"),
};

export interface GamificationStats {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  badges_earned: number;
  total_badges: number;
  xp_to_next_level: number;
  xp_progress: number;
  equipped_title?: string;
}

export interface BadgeReward {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  earned: boolean;
  earned_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  avatar_url?: string;
  xp: number;
  level: number;
  streak: number;
  is_me: boolean;
  equipped_title?: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  item_type: string;
  icon: string;
  price: number;
  owned: boolean;
}

export interface CheckInResult {
  message: string;
  already_checked: boolean;
  streak: number;
  xp_earned?: number;
  coins_earned?: number;
  total_xp?: number;
  total_coins?: number;
  level?: number;
  leveled_up?: boolean;
}

export const gamificationApi = {
  checkIn: () => apiRequest<CheckInResult>("/api/gamification/check-in", { method: "POST" }),
  getBadges: () => apiRequest<BadgeReward[]>("/api/gamification/badges"),
  getMyStats: () => apiRequest<GamificationStats>("/api/gamification/my-stats"),
  getLeaderboard: (scope: "class" | "school" = "class") =>
    apiRequest<{ leaderboard: LeaderboardEntry[]; my_rank: number; scope: string }>(`/api/gamification/leaderboard?scope=${scope}`),
  getShop: () => apiRequest<{ coins: number; items: ShopItem[] }>("/api/gamification/shop"),
  buyItem: (itemId: number) =>
    apiRequest<{ message: string; coins_remaining: number }>(`/api/gamification/shop/buy/${itemId}`, { method: "POST" }),
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

export interface ActiveBattle {
  id: number;
  battle_code: string;
  quiz_title: string;
  quiz_subject: string;
  status: "waiting" | "active" | "finished";
  participants_count: number;
  time_per_question: number;
  created_by: string;
  created_at: string;
  joined: boolean;
}

export interface BattleParticipant {
  id: number;
  user_id: number;
  name: string;
  score: number;
  answers_correct: number;
  answers_total: number;
  is_me: boolean;
}

export interface BattleStatus {
  id: number;
  battle_code: string;
  quiz_title: string;
  quiz_subject: string;
  status: "waiting" | "active" | "finished";
  current_question: number;
  total_questions: number;
  time_per_question: number;
  started_at?: string;
  participants: BattleParticipant[];
}

export interface BattleQuestion {
  finished: boolean;
  message?: string;
  question_index?: number;
  total_questions?: number;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  already_answered?: boolean;
  time_limit?: number;
}

export interface BattleLeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  correct: number;
  total: number;
  is_me: boolean;
}

export const quizBattleApi = {
  create: (data: { quiz_id: number; time_per_question?: number }) =>
    apiRequest<{ id: number; battle_code: string; quiz_title: string; total_questions: number; status: string; time_per_question: number }>("/api/battle/create", { method: "POST", body: JSON.stringify(data) }),
  join: (code: string) =>
    apiRequest<{ message: string; battle_id: number; participant_id: number; quiz_title?: string; status?: string }>("/api/battle/join", { method: "POST", body: JSON.stringify({ battle_code: code }) }),
  start: (battleId: number) => apiRequest<{ message: string; participants: number }>(`/api/battle/${battleId}/start`, { method: "POST" }),
  getStatus: (battleId: number) => apiRequest<BattleStatus>(`/api/battle/${battleId}`),
  getQuestion: (battleId: number, index: number) =>
    apiRequest<BattleQuestion>(`/api/battle/${battleId}/question?question_index=${index}`),
  submitAnswer: (battleId: number, data: { question_index: number; answer: string; time_taken: number }) =>
    apiRequest<{ correct: boolean; points_earned: number; total_score: number; battle_finished: boolean }>(`/api/battle/${battleId}/answer`, { method: "POST", body: JSON.stringify(data) }),
  getLeaderboard: (battleId: number) => apiRequest<BattleLeaderboardEntry[]>(`/api/battle/${battleId}/leaderboard`),
  getActive: () => apiRequest<ActiveBattle[]>("/api/battle/active"),
};

export interface CrosswordQuestion {
  id: number;
  topic: string;
  question: string;
  hint: string;
  length: number;
}

export interface Riddle {
  id: number;
  question: string;
  hint?: string;
  difficulty?: string;
  category?: string;
}

export const gamesApi = {
  getCrossword: () => apiRequest<CrosswordQuestion>("/api/games/crossword/random"),
  checkCrossword: (id: number, answer: string) =>
    apiRequest<{ correct: boolean; correct_answer?: string; message: string; bonus_score: number }>("/api/games/crossword/check", { method: "POST", body: JSON.stringify({ id, answer }) }),
  nextRiddle: (history: number[]) => apiRequest<{ riddle: Riddle | null }>("/api/ai/riddles/next", { method: "POST", body: JSON.stringify({ history }) }),
  checkRiddle: (riddleId: number, answer: string) =>
    apiRequest<{ result: { correct: boolean; correct_answer?: string } }>("/api/ai/riddles/check", { method: "POST", body: JSON.stringify({ riddle_id: riddleId, answer }) }),
  revealRiddle: (riddleId: number) =>
    apiRequest<{ result: { correct_answer: string } }>("/api/ai/riddles/reveal", { method: "POST", body: JSON.stringify({ riddle_id: riddleId }) }),
  playWordChain: (currentWord: string, history: string[]) =>
    apiRequest<{ valid: boolean; next_word?: string; message?: string }>("/api/ai/word-chain", { method: "POST", body: JSON.stringify({ current_word: currentWord, history }) }),
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

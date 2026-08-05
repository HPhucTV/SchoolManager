export { API_URL, ApiError, apiRequest, getAuthHeaders, getErrorMessage } from "./client";
export * from "./types";
export { adminApi } from "./admin";
export { studentAcademicApi, teacherAcademicApi } from "./academic";
export type { OnlineSession, ScheduleItem, StudentClassDetails, StudentDashboard, StudentSubject, SubjectDetails, TeacherClassSummary } from "./academic";
export { assignmentsApi, studentCourseworkApi, teacherQuizzesApi } from "./coursework";
export type { Assignment, AssignmentQuestion, AssignmentSubmission, QuizResult, StudentQuiz, TeacherQuiz } from "./coursework";
export { activitiesApi, classesApi, dashboardApi, quizzesApi, statisticsApi, studentsApi } from "./school";
export {
  aiGradingApi,
  aiTutorApi,
  analyticsApi,
  gamesApi,
  gamificationApi,
  notificationsApi,
  quizBattleApi,
  reportApi,
  searchApi,
  wellnessApi,
} from "./extensions";
export type {
  ActiveBattle,
  BadgeReward,
  BattleLeaderboardEntry,
  BattleQuestion,
  BattleStatus,
  CheckInResult,
  ClassWellness,
  CrosswordQuestion,
  GamificationStats,
  LeaderboardEntry,
  MoodAnalytics,
  MoodEntry,
  NotificationItem,
  Riddle,
  ShopItem,
  SOSAlert,
  TutorAnalysis,
  TutorLearningPath,
  TutorRecommendations,
} from "./extensions";
export { AI_TUTOR_USAGE_NOTICE } from "./extensions";

import { apiRequest } from "./client";

export const api = { fetch: apiRequest };

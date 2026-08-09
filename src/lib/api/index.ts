export { API_URL, ApiError, apiRequest, getAuthHeaders, getErrorMessage } from "./client";
export * from "./types";
export { adminApi } from "./admin";
export { studentAcademicApi, teacherAcademicApi } from "./academic";
export type { ScheduleItem, StudentClassDetails, StudentDashboard, StudentSubject, SubjectDetails, TeacherClassSummary } from "./academic";
export { assignmentsApi, studentCourseworkApi, teacherQuizzesApi } from "./coursework";
export type { Assignment, AssignmentQuestion, AssignmentSubmission, QuizResult, StudentQuiz, TeacherQuiz } from "./coursework";
export { dashboardApi, quizzesApi } from "./school";
export { insightsApi } from "./insights";
export type {
  AttentionItem,
  ClassGradebook,
  GradebookStudent,
  StudentGradebook,
  StudentSubjectGrade,
  TodayDashboard,
  TodayScheduleItem,
  TodayWorkItem,
} from "./insights";
export {
  notificationsApi,
  wellnessApi,
} from "./extensions";
export type {
  ClassWellness,
  MoodAnalytics,
  MoodEntry,
  NotificationItem,
  SOSAlert,
} from "./extensions";

import { apiRequest } from "./client";

export const api = { fetch: apiRequest };

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
  gamificationApi,
  quizBattleApi,
  reportApi,
  searchApi,
  wellnessApi,
} from "./extensions";

import { apiRequest } from "./client";

export const api = { fetch: apiRequest };

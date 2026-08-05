import { apiRequest } from "./client";

export interface AssignmentQuestion {
  id?: number;
  question_type: "multiple_choice" | "essay";
  question_text: string;
  points: number;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  subject?: string;
  class_id: number;
  deadline?: string;
  total_points: number;
  status: string;
  created_at: string;
  questions: AssignmentQuestion[];
  submission_count: number;
}

export interface AssignmentSubmission {
  id: number;
  student_id: number;
  student_name: string;
  status: string;
  total_score: number;
  submitted_at: string;
  graded_at?: string;
  answers: Array<{ id: number; question_id: number; answer_text: string; is_correct?: boolean; score: number; feedback?: string }>;
}

export interface TeacherQuiz {
  id: number;
  title: string;
  subject?: string;
  topic?: string;
  class_id: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  total_questions: number;
  deadline?: string | null;
  allow_retake: boolean;
  show_answers: boolean;
  status: "draft" | "active" | "closed";
  created_at?: string;
}

export interface StudentQuiz extends TeacherQuiz {
  questions: Array<{ id: number; question_text: string; difficulty: string; option_a: string; option_b: string; option_c: string; option_d: string }>;
}

export interface QuizResult {
  attempted?: boolean;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at?: string;
  show_answers?: boolean;
}

export const assignmentsApi = {
  list: () => apiRequest<Assignment[]>("/api/assignments", { cache: "no-store" }),
  create: (data: Omit<Assignment, "id" | "status" | "created_at" | "submission_count">) =>
    apiRequest<Assignment>("/api/assignments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Omit<Assignment, "id" | "status" | "created_at" | "submission_count">) =>
    apiRequest<Assignment>(`/api/assignments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => apiRequest(`/api/assignments/${id}`, { method: "DELETE" }),
  close: (id: number) => apiRequest(`/api/assignments/${id}/close`, { method: "PATCH" }),
  submissions: (id: number) => apiRequest<AssignmentSubmission[]>(`/api/assignments/${id}/submissions`),
  grade: (submissionId: number, grades: Array<{ answer_id: number; score: number; feedback?: string }>) =>
    apiRequest(`/api/assignments/submissions/${submissionId}/grade`, { method: "PUT", body: JSON.stringify({ grades }) }),
};

interface QuizCreatePayload {
  title: string;
  subject: string;
  topic: string;
  class_id: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  deadline?: string | null;
  allow_retake: boolean;
  show_answers: boolean;
}

export const teacherQuizzesApi = {
  list: () => apiRequest<TeacherQuiz[]>("/api/quizzes", { cache: "no-store" }),
  create: (data: QuizCreatePayload) => apiRequest<TeacherQuiz>("/api/quizzes", { method: "POST", body: JSON.stringify(data) }),
  setStatus: (id: number, status: TeacherQuiz["status"]) => apiRequest<TeacherQuiz>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
  remove: (id: number) => apiRequest(`/api/quizzes/${id}`, { method: "DELETE" }),
};

export const studentCourseworkApi = {
  getAssignment: (id: number) => apiRequest<Assignment>(`/api/assignments/${id}`),
  getSubmission: (id: number) => apiRequest<AssignmentSubmission | null>(`/api/assignments/${id}/my-submission`),
  submitAssignment: (id: number, answers: Array<{ question_id: number; answer_text: string }>) =>
    apiRequest<AssignmentSubmission>(`/api/assignments/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
  getQuiz: (id: number) => apiRequest<StudentQuiz>(`/api/quizzes/${id}`),
  getQuizResult: (id: number) => apiRequest<QuizResult & { attempted: boolean }>(`/api/quizzes/${id}/my-result`),
  submitQuiz: (id: number, answers: Record<number, string>) =>
    apiRequest<QuizResult>(`/api/quizzes/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
};

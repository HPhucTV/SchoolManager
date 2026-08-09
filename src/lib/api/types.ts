export interface DashboardMetrics {
  classes: number;
  students: number;
  open_assignments: number;
  active_quizzes: number;
}

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: "A" | "B" | "C" | "D";
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  id: number;
  title: string;
  subject: string;
  topic: string;
  status: "draft" | "active" | "closed";
  easy_count: number;
  medium_count: number;
  hard_count: number;
  total_questions: number;
  deadline?: string;
  allow_retake: boolean;
  show_answers: boolean;
  class_id: number;
  questions?: Question[];
  created_at?: string;
}

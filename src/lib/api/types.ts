export interface Activity {
  id: number;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "scheduled" | "upcoming";
  progress: number;
  participants_count: number;
  created_at: string;
  type?: string;
  scheduled_date?: string;
}

export interface DashboardMetrics {
  happiness: { value: string; change: string; change_type: "positive" | "negative" | "neutral" };
  engagement: { value: string; change: string; change_type: "positive" | "negative" | "neutral" };
  mental_health: { value: string; change: string; change_type: "positive" | "negative" | "neutral" };
  activities: { value: string; subtitle: string };
}

export interface Student {
  id: number;
  name: string;
  status: "excellent" | "good" | "attention" | "warning";
  happiness_score: number;
  engagement_score: number;
  mental_health_score: number;
  class_id: number;
}

export interface StudentStats {
  total: number;
  excellent: number;
  good: number;
  attention: number;
  warning: number;
  growth_rate?: string;
  total_students?: number;
  total_activities?: number;
  total_surveys?: number;
  weekly_trend?: { week: string; score: number }[];
  class_comparison?: { name: string; score: number; color: string }[];
  detailed_stats?: { name: string; prev: number; curr: number }[];
}

export type Statistics = StudentStats;

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

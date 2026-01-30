const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        return url.toString();
    }

    private getHeaders(options?: FetchOptions): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };

        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            } else {
                console.warn('ApiClient: No token found in localStorage');
            }
        }

        return headers;
    }

    private async handleResponse(response: Response) {
        if (!response.ok) {
            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    console.warn('Unauthorized access. Clearing session and redirecting to login.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Use window.location to force a full refresh and clear React state
                    window.location.href = '/login';
                }
            }
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(options),
            ...options,
        });

        return this.handleResponse(response);
    }

    async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(options),
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return this.handleResponse(response);
    }

    async put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(options),
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return this.handleResponse(response);
    }

    async patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(options),
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return this.handleResponse(response);
    }

    async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders(options),
            ...options,
        });

        return this.handleResponse(response);
    }
}

export const api = new ApiClient(API_BASE_URL);

// ============ Dashboard API ============
export interface DashboardData {
    happiness_score: number;
    engagement_score: number;
    mental_health_score: number;
    activities_completed: number;
    activities_total: number;
    total_students: number;
    students_excellent: number;
    students_warning: number;
    recent_activities: Activity[];
}

export interface DashboardMetrics {
    happiness: { value: string; change: string; change_type: string };
    engagement: { value: string; change: string; change_type: string };
    mental_health: { value: string; change: string; change_type: string };
    activities: { value: string; subtitle: string };
}

export const dashboardApi = {
    getDashboard: () => api.get<DashboardData>('/api/dashboard'),
    getMetrics: () => api.get<DashboardMetrics>('/api/dashboard/metrics'),
};

// ============ Classes API ============
export interface ClassInfo {
    id: number;
    name: string;
    grade?: string;
    teacher_id?: number;
    student_count?: number;
}

export const classesApi = {
    getClasses: () => api.get<ClassInfo[]>('/api/classes'),
    getClass: (id: number) => api.get<ClassInfo>(`/api/classes/${id}`),
};

// ============ Students API ============
export interface Student {
    id: number;
    name: string;
    class_id: number;
    avatar_url?: string;
    happiness_score: number;
    engagement_score: number;
    mental_health_score: number;
    status: 'excellent' | 'good' | 'attention' | 'warning';
    created_at: string;
}

export interface StudentsResponse {
    students: Student[];
    total: number;
    page: number;
    page_size: number;
}

export interface StudentStats {
    total: number;
    excellent: number;
    good: number;
    attention: number;
    warning: number;
}

export const studentsApi = {
    getStudents: (params?: { page?: number; page_size?: number; class_id?: number; status?: string; search?: string }) =>
        api.get<StudentsResponse>('/api/students', { params }),
    getStudent: (id: number) => api.get<Student>(`/api/students/${id}`),
    createStudent: (data: { name: string; class_id: number }) => api.post<Student>('/api/students', data),
    deleteStudent: (id: number) => api.delete(`/api/students/${id}`),
    getStats: () => api.get<StudentStats>('/api/students/stats/summary'),
};

// ============ Activities API ============
export interface Activity {
    id: number;
    title: string;
    description?: string;
    type?: string;
    status: 'completed' | 'in-progress' | 'scheduled';
    progress: number;
    scheduled_date?: string;
    participants_count: number;
    created_by?: number;
    created_at: string;
}

export interface ActivityStats {
    completed: number;
    in_progress: number;
    scheduled: number;
    total: number;
}

export const activitiesApi = {
    getActivities: (params?: { status?: string; type?: string; limit?: number; offset?: number }) =>
        api.get<Activity[]>('/api/activities', { params }),
    getActivity: (id: number) => api.get<Activity>(`/api/activities/${id}`),
    createActivity: (data: { title: string; description?: string; type?: string; scheduled_date?: string }) =>
        api.post<Activity>('/api/activities', data),
    updateActivity: (id: number, data: Partial<Activity>) => api.patch<Activity>(`/api/activities/${id}`, data),
    deleteActivity: (id: number) => api.delete(`/api/activities/${id}`),
    getStats: () => api.get<ActivityStats>('/api/activities/stats/summary'),
};

// ============ Statistics API ============
export interface ClassComparison {
    name: string;
    score: number;
    color: string;
}

export interface WeeklyTrend {
    week: string;
    score: number;
}

export interface Statistics {
    growth_rate: string;
    total_students: number;
    total_activities: number;
    total_surveys: number;
    weekly_trend: WeeklyTrend[];
    class_comparison: ClassComparison[];
    detailed_stats: { name: string; prev: number; curr: number }[];
}

export const statisticsApi = {
    getStatistics: () => api.get<Statistics>('/api/statistics'),
    getClasses: () => api.get<{ id: number; name: string; happiness_score: number; engagement_score: number; mental_health_score: number }[]>('/api/statistics/classes'),
    getTrends: () => api.get('/api/statistics/trends'),
};

// ============ Admin API ============
export const adminApi = {
    // Users
    getUsers: (role?: string) => api.get<any[]>(`/api/admin/users${role ? `?role=${role}` : ''}`),
    createUser: (data: any) => api.post<any>('/api/admin/users', data),
    deleteUser: (id: number) => api.delete(`/api/admin/users/${id}`),

    // Classes
    getClasses: () => api.get<any[]>('/api/admin/classes'),
    createClass: (data: any) => api.post<any>('/api/admin/classes', data),
    updateClass: (id: number, data: any) => api.put<any>(`/api/admin/classes/${id}`, data),

    // Stats
    getStats: () => api.get<any>('/api/admin/stats'),
};

// ============ Quiz API ============
export interface Quiz {
    id: number;
    title: string;
    subject?: string;
    topic?: string;
    class_id?: number;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    deadline?: string;
    allow_retake: boolean;
    status: 'draft' | 'active' | 'closed';
    created_at: string;
    total_questions: number;
    questions?: QuizQuestion[];
}

export interface QuizQuestion {
    id: number;
    question_text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    order_num: number;
    correct_answer?: string;
}

export interface QuizCreate {
    title: string;
    subject: string;
    topic: string;
    class_id: number;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    deadline?: string;
    allow_retake: boolean;
}

export interface QuizResult {
    id: number;
    student_id: number;
    student_name: string;
    score: number;
    total_questions: number;
    percentage: number;
    submitted_at?: string;
}

export const quizzesApi = {
    getQuizzes: (classId?: number) =>
        api.get<Quiz[]>(`/api/quizzes${classId ? `?class_id=${classId}` : ''}`),
    getQuiz: (id: number) => api.get<Quiz>(`/api/quizzes/${id}`),
    createQuiz: (data: QuizCreate) => api.post<Quiz>('/api/quizzes', data),
    updateQuiz: (id: number, data: Partial<Quiz>) => api.patch<any>(`/api/quizzes/${id}`, data),
    deleteQuiz: (id: number) => api.delete(`/api/quizzes/${id}`),
    submitQuiz: (id: number, answers: Record<string, string>) =>
        api.post<any>(`/api/quizzes/${id}/submit`, { answers }),
    getResults: (id: number) => api.get<{ quiz_id: number; title: string; results: QuizResult[] }>(`/api/quizzes/${id}/results`),
    getMyResult: (id: number) => api.get<any>(`/api/quizzes/${id}/my-result`),
};

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://api.schoolmanager.id.vn").replace("http://", "https://");

// --- Types ---

export interface Activity {
    id: number;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'scheduled' | 'upcoming';
    progress: number;
    participants_count: number;
    created_at: string;
    type?: string;
    scheduled_date?: string;
}

export interface DashboardMetrics {
    happiness: { value: string; change: string; change_type: 'positive' | 'negative' | 'neutral' };
    engagement: { value: string; change: string; change_type: 'positive' | 'negative' | 'neutral' };
    mental_health: { value: string; change: string; change_type: 'positive' | 'negative' | 'neutral' };
    activities: { value: string; subtitle: string };
}

export interface Student {
    id: number;
    name: string;
    status: 'excellent' | 'good' | 'attention' | 'warning';
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
    correct_answer: 'A' | 'B' | 'C' | 'D';
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
    id: number;
    title: string;
    subject: string;
    topic: string;
    status: 'draft' | 'active' | 'closed';
    easy_count: number;
    medium_count: number;
    hard_count: number;
    total_questions: number;
    deadline?: string;
    allow_retake: boolean;
    class_id: number;
    questions?: Question[];
    created_at?: string;
}

// --- APIs ---

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    // General helper if needed
    fetch: async (endpoint: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { ...getHeaders(), ...options.headers }
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    }
};

export const activitiesApi = {
    getActivities: async ({ limit = 100 }: { limit?: number } = {}) => {
        try {
            const response = await fetch(`${API_URL}/api/activities/?limit=${limit}`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch activities');
            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    },
    createActivity: async (data: Partial<Activity>): Promise<Activity> => {
        try {
            const response = await fetch(`${API_URL}/api/activities/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create activity');
            return await response.json();
        } catch (error) {
            console.error('Error creating activity:', error);
            throw error;
        }
    },
    updateActivity: async (id: number, data: Partial<Activity>): Promise<Activity> => {
        try {
            const response = await fetch(`${API_URL}/api/activities/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update activity');
            return await response.json();
        } catch (error) {
            console.error('Error updating activity:', error);
            throw error;
        }
    },
    deleteActivity: async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/api/activities/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete activity');
            return await response.json();
        } catch (error) {
            console.error('Error deleting activity:', error);
            throw error;
        }
    }
};

export const dashboardApi = {
    getMetrics: async () => {
        try {
            const response = await fetch(`${API_URL}/api/dashboard/metrics`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch metrics');
            return await response.json();
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            throw error;
        }
    }
};

export const studentsApi = {
    getStudents: async ({ page = 1, page_size = 10, search = '' }: { page?: number; page_size?: number; search?: string } = {}) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: page_size.toString(),
                ...(search && { search })
            });
            const response = await fetch(`${API_URL}/api/students?${params}`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch students');
            return await response.json();
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },
    getStats: async () => {
        try {
            const response = await fetch(`${API_URL}/api/students/stats`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch student stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching student stats:', error);
            throw error;
        }
    }
};

export const statisticsApi = {
    getStatistics: async () => {
        try {
            const response = await fetch(`${API_URL}/api/statistics`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch statistics');
            return await response.json();
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },
    getClasses: async () => {
        try {
            const response = await fetch(`${API_URL}/api/statistics/classes`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch classes stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching classes stats:', error);
            throw error;
        }
    }
};

export const adminApi = {
    getUsers: async (role?: string) => {
        try {
            const params = role ? `?role=${role}` : '';
            const response = await fetch(`${API_URL}/api/auth/users${params}`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
    getClasses: async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/classes`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch classes');
            return await response.json();
        } catch (error) {
            console.error('Error fetching classes:', error);
            throw error;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createUser: async (userData: any) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/users`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to create user');
            return data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },
    deleteUser: async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/users/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete user');
            return await response.json();
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createClass: async (classData: any) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/classes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(classData)
            });
            if (!response.ok) throw new Error('Failed to create class');
            return await response.json();
        } catch (error) {
            console.error('Error creating class:', error);
            throw error;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateClass: async (id: number, classData: any) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/classes/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(classData)
            });
            if (!response.ok) throw new Error('Failed to update class');
            return await response.json();
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateUser: async (id: number, userData: any) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/users/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error('Failed to update user');
            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },
    getStats: async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch admin stats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            throw error;
        }
    },
    downloadStudentTemplate: async () => {
        const response = await fetch(`${API_URL}/api/admin/student-template`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to download template');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mau_danh_sach_hoc_sinh.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    },
    importStudents: async (classId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${API_URL}/api/admin/import-students?class_id=${classId}`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Import failed');
        return data;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changePassword: async (data: any) => {
        const response = await fetch(`${API_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to change password');
        }
        return await response.json();
    }
};

export const quizzesApi = {
    getQuizzes: async () => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            return await response.json();
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            throw error;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createQuiz: async (data: any) => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create quiz');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating quiz:', error);
            throw error;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateQuiz: async (id: number, data: any) => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update quiz');
            return await response.json();
        } catch (error) {
            console.error('Error updating quiz:', error);
            throw error;
        }
    },
    deleteQuiz: async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete quiz');
            return await response.json();
        } catch (error) {
            console.error('Error deleting quiz:', error);
            throw error;
        }
    }
};

export const classesApi = {
    getClasses: async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/classes`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch classes');
            return await response.json();
        } catch (error) {
            console.error('Error fetching classes:', error);
            throw error;
        }
    }
};

// ============================================================
// NEW FEATURE APIs
// ============================================================

export const wellnessApi = {
    createMood: async (data: { mood_level: number; mood_emoji: string; note?: string }) => {
        const res = await fetch(`${API_URL}/api/wellness/mood`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getMoodHistory: async (days = 30) => {
        const res = await fetch(`${API_URL}/api/wellness/mood/history?days=${days}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getMoodAnalytics: async () => {
        const res = await fetch(`${API_URL}/api/wellness/mood/analytics`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    createSOS: async (data: { message: string; is_anonymous?: boolean }) => {
        const res = await fetch(`${API_URL}/api/wellness/sos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getSOSAlerts: async (status?: string) => {
        const url = status ? `${API_URL}/api/wellness/sos/alerts?status=${status}` : `${API_URL}/api/wellness/sos/alerts`;
        const res = await fetch(url, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    updateSOS: async (id: number, data: { status: string; reviewer_note?: string }) => {
        const res = await fetch(`${API_URL}/api/wellness/sos/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getClassWellness: async (classId: number) => {
        const res = await fetch(`${API_URL}/api/wellness/class/${classId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

export const aiTutorApi = {
    getAnalysis: async () => {
        const res = await fetch(`${API_URL}/api/ai-tutor/analysis`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getRecommendations: async () => {
        const res = await fetch(`${API_URL}/api/ai-tutor/recommendations`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getLearningPath: async () => {
        const res = await fetch(`${API_URL}/api/ai-tutor/learning-path`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

export const gamificationApi = {
    checkIn: async () => {
        const res = await fetch(`${API_URL}/api/gamification/check-in`, { method: 'POST', headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getBadges: async () => {
        const res = await fetch(`${API_URL}/api/gamification/badges`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getMyStats: async () => {
        const res = await fetch(`${API_URL}/api/gamification/my-stats`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getLeaderboard: async (scope = 'class') => {
        const res = await fetch(`${API_URL}/api/gamification/leaderboard?scope=${scope}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getShop: async () => {
        const res = await fetch(`${API_URL}/api/gamification/shop`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    buyItem: async (itemId: number) => {
        const res = await fetch(`${API_URL}/api/gamification/shop/buy/${itemId}`, { method: 'POST', headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

export const analyticsApi = {
    getStudentTrends: async (studentId: number) => {
        const res = await fetch(`${API_URL}/api/analytics/trends/${studentId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getEarlyWarnings: async () => {
        const res = await fetch(`${API_URL}/api/analytics/early-warning`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getClassReport: async (classId: number) => {
        const res = await fetch(`${API_URL}/api/analytics/class-report/${classId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

// teacher-specific report endpoints used by chatbot
export const reportApi = {
    createTeacherReport: async (data: { class_id: number; report_type: string; content: string }) => {
        const res = await fetch(`${API_URL}/api/teacher/reports`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to create report');
        }
        return res.json();
    },
    listTeacherReports: async () => {
        const res = await fetch(`${API_URL}/api/teacher/reports`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed');
        return res.json();
    }
};

export const parentApi = {
    getChildren: async () => {
        const res = await fetch(`${API_URL}/api/parent/children`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getChildReport: async (studentId: number) => {
        const res = await fetch(`${API_URL}/api/parent/child/${studentId}/report`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getChildMood: async (studentId: number) => {
        const res = await fetch(`${API_URL}/api/parent/child/${studentId}/mood`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    sendMessage: async (data: { receiver_id: number; message: string }) => {
        const res = await fetch(`${API_URL}/api/parent/message`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getMessages: async () => {
        const res = await fetch(`${API_URL}/api/parent/messages`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getTeachers: async () => {
        const res = await fetch(`${API_URL}/api/parent/teachers`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

export const quizBattleApi = {
    create: async (data: { quiz_id: number; time_per_question?: number }) => {
        const res = await fetch(`${API_URL}/api/battle/create`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    join: async (code: string) => {
        const res = await fetch(`${API_URL}/api/battle/join`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ battle_code: code }) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    start: async (battleId: number) => {
        const res = await fetch(`${API_URL}/api/battle/${battleId}/start`, { method: 'POST', headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getStatus: async (battleId: number) => {
        const res = await fetch(`${API_URL}/api/battle/${battleId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getQuestion: async (battleId: number, index: number) => {
        const res = await fetch(`${API_URL}/api/battle/${battleId}/question?question_index=${index}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    submitAnswer: async (battleId: number, data: { question_index: number; answer: string; time_taken: number }) => {
        const res = await fetch(`${API_URL}/api/battle/${battleId}/answer`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getLeaderboard: async (battleId: number) => {
        const res = await fetch(`${API_URL}/api/battle/${battleId}/leaderboard`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    },
    getActive: async () => {
        const res = await fetch(`${API_URL}/api/battle/active`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

export const aiGradingApi = {
    gradeSubmission: async (assignmentId: number, submissionId: number) => {
        const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/ai-grade/${submissionId}`, { method: 'POST', headers: getHeaders() });
        if (!res.ok) throw new Error('Failed'); return res.json();
    }
};

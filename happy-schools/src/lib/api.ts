export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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

export interface Statistics extends StudentStats { }

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
    createActivity: async (data: any) => {
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
    updateActivity: async (id: number, data: any) => {
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

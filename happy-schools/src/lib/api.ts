// Centralized API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- Types ---

export interface Activity {
    id: number;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'scheduled';
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
    getActivities: async ({ limit = 5 }: { limit?: number } = {}) => {
        try {
            const response = await fetch(`${API_URL}/api/activities?limit=${limit}`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch activities');
            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error);
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

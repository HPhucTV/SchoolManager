'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentActivities from '@/components/dashboard/RecentActivities';
import Notifications from '@/components/dashboard/Notifications';
import FeaturedClass from '@/components/dashboard/FeaturedClass';
import { Smile, Heart, Brain, CalendarDays } from 'lucide-react';
import { dashboardApi, DashboardMetrics } from '@/lib/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardApi.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError('Không thể tải dữ liệu');
        // Fallback to default values
        setMetrics({
          happiness: { value: '87%', change: '↑ 5% so với tuần trước', change_type: 'positive' },
          engagement: { value: '92%', change: '↑ 8% so với tuần trước', change_type: 'positive' },
          mental_health: { value: '85%', change: '↓ 2% so với tuần trước', change_type: 'negative' },
          activities: { value: '12/15', subtitle: '✓ Hoàn thành 80%' },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          color: '#92400e',
          fontSize: '14px'
        }}>
          ⚠️ {error} - Đang hiển thị dữ liệu mẫu
        </div>
      )}

      {/* Metric Cards */}
      <div className="metric-grid" style={{
        display: 'grid',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <style jsx global>{`
          .metric-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          @media (max-width: 1024px) {
            .metric-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 640px) {
            .metric-grid {
              grid-template-columns: 1fr;
            }
          }
          .bottom-grid {
            grid-template-columns: 1.5fr 1fr;
          }
          @media (max-width: 1024px) {
            .bottom-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
        <MetricCard
          title="Mức độ Sôi nổi"
          value={metrics?.happiness.value || '87%'}
          change={metrics?.happiness.change || '↑ 5% so với tuần trước'}
          changeType={metrics?.happiness.change_type as 'positive' | 'negative' | 'neutral' || 'positive'}
          icon={Smile}
          iconBgColor="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
          valueColor="#22c55e"
          onClick={() => window.location.href = '/teacher/thong-ke'}
        />
        <MetricCard
          title="Mức độ Gắn kết"
          value={metrics?.engagement.value || '92%'}
          change={metrics?.engagement.change || '↑ 8% so với tuần trước'}
          changeType={metrics?.engagement.change_type as 'positive' | 'negative' | 'neutral' || 'positive'}
          icon={Heart}
          iconBgColor="linear-gradient(135deg, #f472b6 0%, #ec4899 100%)"
          valueColor="#22c55e"
        />
        <MetricCard
          title="Sức khỏe Tinh thần"
          value={metrics?.mental_health.value || '85%'}
          change={metrics?.mental_health.change || '↓ 2% so với tuần trước'}
          changeType={metrics?.mental_health.change_type as 'positive' | 'negative' | 'neutral' || 'negative'}
          icon={Brain}
          iconBgColor="linear-gradient(135deg, #fb923c 0%, #f97316 100%)"
          valueColor="#22c55e"
        />
        <MetricCard
          title="Hoạt động Tuần này"
          value={metrics?.activities.value || '12/15'}
          subtitle={metrics?.activities.subtitle || '✓ Hoàn thành 80%'}
          icon={CalendarDays}
          iconBgColor="linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"
          valueColor="#8b5cf6"
        />
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid" style={{
        display: 'grid',
        gap: '16px',
      }}>
        {/* Recent Activities */}
        <RecentActivities />

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Notifications />
          <FeaturedClass />
        </div>
      </div>
    </div>
  );
}

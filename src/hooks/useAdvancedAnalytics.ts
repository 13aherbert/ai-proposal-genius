import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './use-current-organization';
import { toast } from 'sonner';

interface AnalyticsMetrics {
  totalProjects: number;
  activeUsers: number;
  avgEngagement: number;
  monthlyGrowth: number;
  projectCompletionRate: number;
  featureAdoptionRate: number;
  totalRevenue: number;
}

interface AnalyticsData {
  metric_date: string;
  metric_type: string;
  metric_category: string;
  metric_value: number;
  additional_data?: any;
}

interface Insight {
  id: string;
  insight_type: string;
  insight_category: string;
  insight_title: string;
  insight_description: string;
  confidence_score: number;
  is_actionable: boolean;
  action_suggested?: string;
  created_at: string;
}

interface PerformanceMetrics {
  uptime: number;
  responseTime: number;
  pageLoadTime: number;
  performanceScore: number;
  systemHealth: {
    database: number;
    api: number;
    storage: number;
  };
}

export function useAdvancedAnalytics(timeRange: string = '30d') {
  const { organization } = useCurrentOrganization();
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalProjects: 0,
    activeUsers: 0,
    avgEngagement: 0,
    monthlyGrowth: 0,
    projectCompletionRate: 0,
    featureAdoptionRate: 0,
    totalRevenue: 0
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    uptime: 99.9,
    responseTime: 127,
    pageLoadTime: 2.3,
    performanceScore: 94,
    systemHealth: {
      database: 85,
      api: 92,
      storage: 78
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch raw analytics data
      const { data: rawData, error: analyticsError } = await supabase
        .from('organization_analytics')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (analyticsError) throw analyticsError;

      setAnalyticsData(rawData || []);

      // Calculate aggregated metrics
      const projectsData = rawData?.filter(d => d.metric_type === 'projects_created') || [];
      const usersData = rawData?.filter(d => d.metric_type === 'active_users') || [];
      const engagementData = rawData?.filter(d => d.metric_type === 'avg_engagement_score') || [];

      const totalProjects = projectsData.reduce((sum, item) => sum + item.metric_value, 0);
      const avgActiveUsers = usersData.length > 0 
        ? usersData.reduce((sum, item) => sum + item.metric_value, 0) / usersData.length 
        : 0;
      const avgEngagement = engagementData.length > 0 
        ? engagementData.reduce((sum, item) => sum + item.metric_value, 0) / engagementData.length 
        : 0;

      // Calculate growth trends
      const monthlyGrowth = calculateGrowthRate(projectsData);
      const projectCompletionRate = await calculateCompletionRate();
      const featureAdoptionRate = await calculateFeatureAdoption();

      setMetrics({
        totalProjects,
        activeUsers: Math.round(avgActiveUsers),
        avgEngagement: Math.round(avgEngagement),
        monthlyGrowth,
        projectCompletionRate,
        featureAdoptionRate,
        totalRevenue: 0 // This would come from billing data
      });

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, timeRange]);

  const fetchInsights = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('organization_insights')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInsights(data || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  }, [organization?.id]);

  const calculateGrowthRate = (data: AnalyticsData[]): number => {
    if (data.length < 2) return 0;
    
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    
    const firstSum = firstHalf.reduce((sum, item) => sum + item.metric_value, 0);
    const secondSum = secondHalf.reduce((sum, item) => sum + item.metric_value, 0);
    
    return firstSum > 0 ? ((secondSum - firstSum) / firstSum) * 100 : 0;
  };

  const calculateCompletionRate = async (): Promise<number> => {
    if (!organization?.id) return 0;

    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('status')
        .eq('organization_id', organization.id);

      if (error || !projects) return 0;

      const completedProjects = projects.filter(p => 
        p.status === 'completed' || p.status === 'delivered'
      ).length;

      return projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;
    } catch (err) {
      console.error('Error calculating completion rate:', err);
      return 0;
    }
  };

  const calculateFeatureAdoption = async (): Promise<number> => {
    // This would calculate feature adoption based on usage data
    // For now, return a mock value
    return 73;
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('organization_insights')
        .update({ is_dismissed: true })
        .eq('id', insightId);

      if (error) throw error;
      
      setInsights(insights.filter(insight => insight.id !== insightId));
      toast.success('Insight dismissed');
    } catch (err) {
      console.error('Error dismissing insight:', err);
      toast.error('Failed to dismiss insight');
    }
  };

  const exportAnalytics = async (format: string = 'csv') => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-organization-report', {
        body: {
          organizationId: organization.id,
          reportType: 'analytics_export',
          format,
          timeRange
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data.reportData], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${organization.id}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Analytics data exported successfully');
    } catch (err) {
      console.error('Error exporting analytics:', err);
      toast.error('Failed to export analytics data');
    }
  };

  const generateReport = async (reportConfig: any) => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-organization-report', {
        body: {
          organizationId: organization.id,
          reportType: reportConfig.type,
          format: reportConfig.format,
          timeRange: reportConfig.timeRange || timeRange,
          metrics: reportConfig.metrics
        }
      });

      if (error) throw error;
      
      toast.success('Report generated successfully');
      return data;
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Failed to generate report');
      throw err;
    }
  };

  const updateUsageMetric = async (metricType: string, value: number = 1) => {
    if (!organization?.id) return;

    try {
      await supabase.rpc('update_organization_usage_metric', {
        org_id: organization.id,
        metric_type_param: metricType,
        increment_value: value
      });
    } catch (err) {
      console.error('Error updating usage metric:', err);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      fetchAnalyticsData();
      fetchInsights();
    }
  }, [fetchAnalyticsData, fetchInsights]);

  return {
    metrics,
    analyticsData,
    insights,
    performance,
    loading,
    error,
    dismissInsight,
    exportAnalytics,
    generateReport,
    updateUsageMetric,
    refetch: fetchAnalyticsData
  };
}
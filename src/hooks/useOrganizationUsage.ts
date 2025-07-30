import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UsageMetric {
  metric_type: string;
  metric_value: number;
  metric_date: string;
}

export interface OrganizationUsage {
  projects_created: number;
  knowledge_entries: number;
  storage_used: number;
  api_calls: number;
  active_users: number;
}

export function useOrganizationUsage(organizationId?: string | null) {
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setUsage(null);
      setMetrics([]);
      setLoading(false);
      return;
    }

    fetchUsageData();
  }, [organizationId]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch usage metrics from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: metricsData, error: metricsError } = await supabase
        .from('organization_usage_metrics')
        .select('*')
        .eq('organization_id', organizationId!)
        .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (metricsError) throw metricsError;

      setMetrics(metricsData || []);

      // Calculate current usage totals
      const usageTotals = metricsData?.reduce((acc, metric) => {
        acc[metric.metric_type as keyof OrganizationUsage] = 
          (acc[metric.metric_type as keyof OrganizationUsage] || 0) + metric.metric_value;
        return acc;
      }, {} as Partial<OrganizationUsage>);

      // Get actual counts from other tables for accuracy
      const [projectsCount, knowledgeCount, membersCount] = await Promise.all([
        supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId!),
        supabase
          .from('knowledge_entries')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId!),
        supabase
          .from('organization_members')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId!)
          .eq('status', 'active')
      ]);

      setUsage({
        projects_created: projectsCount.count || 0,
        knowledge_entries: knowledgeCount.count || 0,
        storage_used: usageTotals?.storage_used || 0,
        api_calls: usageTotals?.api_calls || 0,
        active_users: membersCount.count || 0
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
      setUsage(null);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const trackUsage = async (metricType: string, value: number = 1) => {
    try {
      if (!organizationId) return;
      await supabase.rpc('update_organization_usage_metric', {
        org_id: organizationId,
        metric_type_param: metricType,
        increment_value: value
      });
    } catch (err) {
      console.error('Failed to track usage:', err);
    }
  };

  return {
    usage,
    metrics,
    loading,
    error,
    fetchUsageData,
    trackUsage
  };
}
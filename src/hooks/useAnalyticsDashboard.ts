import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export interface AnalyticsOverview {
  totalProposals: number;
  thisMonthProposals: number;
  avgCompletionDays: number;
  aiUtilizationRate: number;
  winRate: number;
  outcomes: { won: number; lost: number; pending: number; cancelled: number };
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface ROISettings {
  hourly_rate: number;
  manual_hours_per_proposal: number;
  subscription_monthly_cost: number;
}

export interface ProposalWithOutcome {
  project_id: string;
  title: string;
  status: string;
  created_at: string;
  deadline: string | null;
  client_name: string | null;
  automation_completed_at: string | null;
  outcome?: string | null;
}

export function useAnalyticsDashboard() {
  const { organization } = useCurrentOrganization();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  // Fetch all projects with outcomes
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["analytics-projects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("project_id, title, status, created_at, deadline, client_name, automation_completed_at, automation_started_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: outcomes } = await supabase
        .from("proposal_outcomes")
        .select("project_id, outcome")
        .eq("organization_id", orgId);

      const outcomeMap = new Map((outcomes || []).map(o => [o.project_id, o.outcome]));

      return (projectsData || []).map(p => ({
        ...p,
        outcome: outcomeMap.get(p.project_id) || null,
      })) as ProposalWithOutcome[];
    },
    enabled: !!orgId,
  });

  // Fetch sections for AI utilization
  const { data: sections } = useQuery({
    queryKey: ["analytics-sections", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("proposal_sections")
        .select("section_id, content, project_id, assigned_to, workflow_status, created_at")
        .eq("organization_id", orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // ROI Settings
  const { data: roiSettings } = useQuery({
    queryKey: ["roi-settings", orgId],
    queryFn: async () => {
      if (!orgId) return { hourly_rate: 75, manual_hours_per_proposal: 40, subscription_monthly_cost: 0 };
      const { data, error } = await supabase
        .from("analytics_roi_settings")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data || { hourly_rate: 75, manual_hours_per_proposal: 40, subscription_monthly_cost: 0 };
    },
    enabled: !!orgId,
  });

  // Update ROI settings
  const updateROI = useMutation({
    mutationFn: async (settings: ROISettings) => {
      if (!orgId || !session?.user?.id) throw new Error("No org");
      const { error } = await supabase
        .from("analytics_roi_settings")
        .upsert({
          organization_id: orgId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: "organization_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roi-settings", orgId] }),
  });

  // Record outcome
  const recordOutcome = useMutation({
    mutationFn: async ({ projectId, outcome, notes }: { projectId: string; outcome: string; notes?: string }) => {
      if (!orgId || !session?.user?.id) throw new Error("No org");
      const { error } = await supabase
        .from("proposal_outcomes")
        .upsert({
          project_id: projectId,
          organization_id: orgId,
          outcome,
          recorded_by: session.user.id,
          notes,
          updated_at: new Date().toISOString(),
        }, { onConflict: "project_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics-projects", orgId] }),
  });

  // Compute overview
  const overview: AnalyticsOverview = (() => {
    if (!projects) return { totalProposals: 0, thisMonthProposals: 0, avgCompletionDays: 0, aiUtilizationRate: 0, winRate: 0, outcomes: { won: 0, lost: 0, pending: 0, cancelled: 0 } };

    const now = new Date();
    const thisMonth = projects.filter(p => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const completedProjects = projects.filter(p => p.automation_completed_at);
    const avgDays = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => {
          const start = new Date(p.created_at).getTime();
          const end = new Date(p.automation_completed_at!).getTime();
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / completedProjects.length
      : 0;

    const totalSections = sections?.length || 0;
    const aiSections = sections?.filter(s => s.content && s.content.length > 100).length || 0;
    const aiRate = totalSections > 0 ? (aiSections / totalSections) * 100 : 0;

    const outcomes = { won: 0, lost: 0, pending: 0, cancelled: 0 };
    projects.forEach(p => {
      if (p.outcome && p.outcome in outcomes) {
        outcomes[p.outcome as keyof typeof outcomes]++;
      }
    });
    const decided = outcomes.won + outcomes.lost;
    const winRate = decided > 0 ? (outcomes.won / decided) * 100 : 0;

    return {
      totalProposals: projects.length,
      thisMonthProposals: thisMonth.length,
      avgCompletionDays: Math.round(avgDays * 10) / 10,
      aiUtilizationRate: Math.round(aiRate),
      winRate: Math.round(winRate),
      outcomes,
    };
  })();

  // Monthly data for charts
  const monthlyData: MonthlyData[] = (() => {
    if (!projects) return [];
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    projects.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count,
    }));
  })();

  // Pipeline data
  const pipeline = (() => {
    if (!projects) return { draft: [], inProgress: [], submitted: [], won: [], lost: [] };
    const buckets: Record<string, ProposalWithOutcome[]> = { draft: [], inProgress: [], submitted: [], won: [], lost: [] };
    projects.forEach(p => {
      if (p.outcome === 'won') buckets.won.push(p);
      else if (p.outcome === 'lost') buckets.lost.push(p);
      else if (p.status === 'completed' || p.outcome === 'pending') buckets.submitted.push(p);
      else if (p.automation_completed_at) buckets.inProgress.push(p);
      else buckets.draft.push(p);
    });
    return buckets;
  })();

  // ROI calculations
  const roiData = (() => {
    const settings = roiSettings || { hourly_rate: 75, manual_hours_per_proposal: 40, subscription_monthly_cost: 0 };
    const totalProposals = projects?.length || 0;
    const estimatedAiHours = settings.manual_hours_per_proposal * 0.3; // AI saves ~70%
    const hoursSavedPerProposal = settings.manual_hours_per_proposal - estimatedAiHours;
    const totalHoursSaved = hoursSavedPerProposal * totalProposals;
    const costSavingsPerProposal = hoursSavedPerProposal * settings.hourly_rate;
    const totalCostSavings = totalHoursSaved * settings.hourly_rate;
    const totalSubscriptionCost = settings.subscription_monthly_cost * 12;
    const roi = totalSubscriptionCost > 0
      ? ((totalCostSavings - totalSubscriptionCost) / totalSubscriptionCost) * 100
      : totalCostSavings > 0 ? Infinity : 0;

    return {
      hoursSavedPerProposal: Math.round(hoursSavedPerProposal),
      costSavingsPerProposal: Math.round(costSavingsPerProposal),
      totalHoursSaved: Math.round(totalHoursSaved),
      totalCostSavings: Math.round(totalCostSavings),
      roi: roi === Infinity ? 999 : Math.round(roi),
      settings,
    };
  })();

  return {
    overview,
    monthlyData,
    pipeline,
    roiData,
    roiSettings: roiSettings as ROISettings | undefined,
    projects: projects || [],
    isLoading: projectsLoading,
    updateROI,
    recordOutcome,
  };
}

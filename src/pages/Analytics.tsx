import React from "react";
import { useAnalyticsDashboard } from "@/hooks/useAnalyticsDashboard";

import { OverviewCards } from "@/components/analytics/OverviewCards";
import { ProposalsChart } from "@/components/analytics/ProposalsChart";
import { PipelineView } from "@/components/analytics/PipelineView";
import { ROICalculator } from "@/components/analytics/ROICalculator";
import { WinLossChart } from "@/components/analytics/WinLossChart";
import { DeadlineCalendar } from "@/components/analytics/DeadlineCalendar";
import { EmptyAnalytics } from "@/components/analytics/EmptyAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Calendar, DollarSign, Target } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function Analytics() {
  useSEO({
    noindex: true, title: "Analytics — OptiRFP", description: "Track win rate, pipeline value, and proposal performance across your RFPs." });
  const { overview, monthlyData, pipeline, roiData, roiSettings, projects, isLoading, updateROI, recordOutcome } = useAnalyticsDashboard();
  

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (overview.totalProposals === 0) {
    return <EmptyAnalytics />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track proposals, team performance, and ROI
          </p>
        </div>
      </div>

      <OverviewCards overview={overview} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex lg:inline-grid lg:grid-cols-5 lg:w-auto scrollbar-hide">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="winloss" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Win/Loss</span>
          </TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ROI</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProposalsChart data={monthlyData} />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <PipelineView pipeline={pipeline} onUpdateOutcome={(projectId, outcome) => recordOutcome.mutate({ projectId, outcome })} />
        </TabsContent>

        <TabsContent value="winloss" className="space-y-6">
          <WinLossChart outcomes={overview.outcomes} projects={projects} onRecordOutcome={(projectId, outcome) => recordOutcome.mutate({ projectId, outcome })} />
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <ROICalculator roiData={roiData} onUpdateSettings={(settings) => updateROI.mutate(settings)} isUpdating={updateROI.isPending} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <DeadlineCalendar projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

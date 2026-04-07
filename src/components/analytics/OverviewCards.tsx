import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trophy, Clock, Zap } from "lucide-react";
import type { AnalyticsOverview } from "@/hooks/useAnalyticsDashboard";

interface OverviewCardsProps {
  overview: AnalyticsOverview;
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  const cards = [
    {
      title: "Total Proposals",
      value: overview.totalProposals,
      subtitle: `${overview.thisMonthProposals} this month`,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Win Rate",
      value: `${overview.winRate}%`,
      subtitle: `${overview.outcomes.won}W / ${overview.outcomes.lost}L`,
      icon: Trophy,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Avg Completion",
      value: overview.avgCompletionDays > 0 ? `${overview.avgCompletionDays}d` : "—",
      subtitle: "RFP to completion",
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "AI Utilization",
      value: `${overview.aiUtilizationRate}%`,
      subtitle: "Sections using AI",
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

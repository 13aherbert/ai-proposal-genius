import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProposalWithOutcome } from "@/hooks/useAnalyticsDashboard";

interface WinLossChartProps {
  outcomes: { won: number; lost: number; pending: number; cancelled: number };
  projects: ProposalWithOutcome[];
  onRecordOutcome: (projectId: string, outcome: string) => void;
}

const COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(45, 93%, 47%)", "hsl(215, 14%, 60%)"];

export function WinLossChart({ outcomes, projects, onRecordOutcome }: WinLossChartProps) {
  const chartData = [
    { name: "Won", value: outcomes.won },
    { name: "Lost", value: outcomes.lost },
    { name: "Pending", value: outcomes.pending },
    { name: "Cancelled", value: outcomes.cancelled },
  ].filter(d => d.value > 0);

  const unrecordedProjects = projects.filter(p => !p.outcome && (p.status === 'completed' || p.automation_completed_at));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Win/Loss Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              No outcomes recorded yet. Record results below.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-72 overflow-y-auto">
          {unrecordedProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              All completed proposals have outcomes recorded! 🎉
            </p>
          ) : (
            unrecordedProjects.slice(0, 10).map((p) => (
              <div key={p.project_id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Select onValueChange={(val) => onRecordOutcome(p.project_id, val)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">✅ Won</SelectItem>
                    <SelectItem value="lost">❌ Lost</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="cancelled">🚫 Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import type { ProposalWithOutcome } from "@/hooks/useAnalyticsDashboard";

interface PipelineViewProps {
  pipeline: Record<string, ProposalWithOutcome[]>;
  onUpdateOutcome: (projectId: string, outcome: string) => void;
}

const stages = [
  { key: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { key: "inProgress", label: "In Progress", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { key: "submitted", label: "Submitted", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  { key: "won", label: "Won", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { key: "lost", label: "Lost", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
];

export function PipelineView({ pipeline, onUpdateOutcome }: PipelineViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Proposal Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stage) => (
            <div key={stage.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={stage.color}>
                  {stage.label}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {pipeline[stage.key]?.length || 0}
                </span>
              </div>
              <div className="space-y-1.5 min-h-[100px]">
                {(pipeline[stage.key] || []).slice(0, 8).map((project) => (
                  <Link
                    key={project.project_id}
                    to={`/projects/${project.project_id}`}
                    className="block p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <p className="text-xs font-medium truncate">{project.title}</p>
                    {project.client_name && (
                      <p className="text-[10px] text-muted-foreground truncate">{project.client_name}</p>
                    )}
                    {(stage.key === "submitted" || stage.key === "inProgress") && (
                      <Select
                        value={project.outcome || ""}
                        onValueChange={(val) => {
                          onUpdateOutcome(project.project_id, val);
                        }}
                      >
                        <SelectTrigger className="h-6 text-[10px] mt-1 w-full">
                          <SelectValue placeholder="Set outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="won">✅ Won</SelectItem>
                          <SelectItem value="lost">❌ Lost</SelectItem>
                          <SelectItem value="pending">⏳ Pending</SelectItem>
                          <SelectItem value="cancelled">🚫 Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Link>
                ))}
                {(pipeline[stage.key]?.length || 0) > 8 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    +{(pipeline[stage.key]?.length || 0) - 8} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

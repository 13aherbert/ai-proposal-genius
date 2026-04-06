import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProposalSection } from "../useProposalSections";
import { WorkflowStatus, WORKFLOW_LABELS, WORKFLOW_COLORS, WORKFLOW_ICONS } from "../hooks/useSectionWorkflow";
import { Filter, User } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

interface ProposalProgressProps {
  sections: ProposalSection[];
  currentUserId?: string;
  filter: { status: WorkflowStatus | null; assignee: string | null; myOnly: boolean };
  onFilterChange: (f: ProposalProgressProps["filter"]) => void;
}

export function ProposalProgress({ sections, currentUserId, filter, onFilterChange }: ProposalProgressProps) {
  const counts = useMemo(() => {
    const c: Record<WorkflowStatus, number> = { draft: 0, in_review: 0, approved: 0, needs_revision: 0 };
    for (const s of sections) {
      const st = (s.workflow_status || "draft") as WorkflowStatus;
      c[st] = (c[st] || 0) + 1;
    }
    return c;
  }, [sections]);

  const approved = counts.approved;
  const total = sections.length;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
  const allApproved = total > 0 && approved === total;

  const confettiFired = useRef(false);
  useEffect(() => {
    if (allApproved && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    if (!allApproved) confettiFired.current = false;
  }, [allApproved]);

  if (total === 0) return null;

  const statusKeys: WorkflowStatus[] = ["draft", "in_review", "approved", "needs_revision"];

  return (
    <div className="space-y-3">
      {allApproved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center text-sm text-green-800 dark:text-green-300">
          🎉 All sections approved — ready for export!
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium whitespace-nowrap">
          {approved} of {total} sections approved ({pct}%)
        </span>
        <Progress value={pct} className="h-2 flex-1" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusKeys.map(st => (
          <button
            key={st}
            onClick={() =>
              onFilterChange({
                ...filter,
                status: filter.status === st ? null : st,
              })
            }
          >
            <Badge
              variant="outline"
              className={`text-[10px] cursor-pointer border-0 ${WORKFLOW_COLORS[st]} ${
                filter.status === st ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
            >
              {WORKFLOW_ICONS[st]} {counts[st]} {WORKFLOW_LABELS[st]}
            </Badge>
          </button>
        ))}

        {currentUserId && (
          <Button
            variant={filter.myOnly ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => onFilterChange({ ...filter, myOnly: !filter.myOnly })}
          >
            <User className="h-3 w-3" /> My Sections
          </Button>
        )}
      </div>
    </div>
  );
}

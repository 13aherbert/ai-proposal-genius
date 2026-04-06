import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  WorkflowStatus,
  WORKFLOW_LABELS,
  WORKFLOW_COLORS,
  WORKFLOW_ICONS,
} from "../hooks/useSectionWorkflow";

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

export function WorkflowStatusBadge({ status, className }: WorkflowStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium border-0 gap-1 py-0 px-1.5", WORKFLOW_COLORS[status], className)}
    >
      {WORKFLOW_ICONS[status]} {WORKFLOW_LABELS[status]}
    </Badge>
  );
}

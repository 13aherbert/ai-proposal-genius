import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  WorkflowStatus,
  WORKFLOW_LABELS,
  WORKFLOW_COLORS,
  WORKFLOW_ICONS,
} from "../hooks/useSectionWorkflow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";

interface Transition {
  label: string;
  to: WorkflowStatus;
  needsComment?: boolean;
}

function getTransitions(
  status: WorkflowStatus,
  isAssignee: boolean,
  isReviewer: boolean,
  isAdmin: boolean
): Transition[] {
  const t: Transition[] = [];
  if (status === "draft" && (isAssignee || isReviewer || isAdmin)) {
    t.push({ label: "Submit for Review", to: "in_review" });
  }
  if (status === "in_review" && (isReviewer || isAdmin)) {
    t.push({ label: "Approve", to: "approved" });
    t.push({ label: "Request Revision", to: "needs_revision", needsComment: true });
  }
  if (status === "needs_revision" && (isAssignee || isAdmin)) {
    t.push({ label: "Resubmit for Review", to: "in_review" });
  }
  if (isAdmin && status !== "draft") {
    t.push({ label: "Revert to Draft", to: "draft" });
  }
  return t;
}

interface Props {
  currentStatus: WorkflowStatus;
  isAssignee: boolean;
  isReviewer: boolean;
  isAdmin: boolean;
  onTransition: (newStatus: WorkflowStatus, comment?: string) => void;
  disabled?: boolean;
  /** When true, no transitions allowed — render a plain badge. */
  readOnly?: boolean;
}

export function SectionStatusControl({
  currentStatus,
  isAssignee,
  isReviewer,
  isAdmin,
  onTransition,
  disabled,
  readOnly,
}: Props) {
  const [commentDialog, setCommentDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingTo, setPendingTo] = useState<WorkflowStatus | null>(null);

  const transitions = readOnly
    ? []
    : getTransitions(currentStatus, isAssignee, isReviewer, isAdmin);

  const badgeClass = cn(
    "inline-flex items-center gap-1 rounded-md border-0 px-2 py-0.5 text-[10px] font-medium",
    WORKFLOW_COLORS[currentStatus]
  );

  // No transitions available → static badge.
  if (transitions.length === 0) {
    return (
      <span
        className={badgeClass}
        role="status"
        aria-label={`Section status: ${WORKFLOW_LABELS[currentStatus]}`}
      >
        <span aria-hidden="true">{WORKFLOW_ICONS[currentStatus]}</span>
        {WORKFLOW_LABELS[currentStatus]}
      </span>
    );
  }

  const handleClick = (t: Transition) => {
    if (t.needsComment) {
      setPendingTo(t.to);
      setCommentDialog(true);
    } else {
      onTransition(t.to);
    }
  };

  const submitWithComment = () => {
    if (!comment.trim() || !pendingTo) return;
    onTransition(pendingTo, comment);
    setCommentDialog(false);
    setComment("");
    setPendingTo(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              badgeClass,
              "cursor-pointer transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
            )}
            aria-label={`Change status (currently ${WORKFLOW_LABELS[currentStatus]})`}
          >
            <span aria-hidden="true">{WORKFLOW_ICONS[currentStatus]}</span>
            {WORKFLOW_LABELS[currentStatus]}
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Change status
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {transitions.map((t) => (
            <DropdownMenuItem
              key={t.to + t.label}
              onClick={() => handleClick(t)}
              className="text-sm"
            >
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={commentDialog} onOpenChange={setCommentDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Explain what needs to be fixed..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCommentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitWithComment} disabled={!comment.trim()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

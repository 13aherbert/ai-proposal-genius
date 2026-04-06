import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowStatus, WORKFLOW_LABELS } from "../hooks/useSectionWorkflow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface WorkflowActionsProps {
  currentStatus: WorkflowStatus;
  isAssignee: boolean;
  isReviewer: boolean; // reviewer or admin
  isAdmin: boolean;
  onTransition: (newStatus: WorkflowStatus, comment?: string) => void;
  disabled?: boolean;
}

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

  if (status === "draft") {
    if (isAssignee || isReviewer || isAdmin) {
      t.push({ label: "Submit for Review", to: "in_review" });
    }
  }
  if (status === "in_review") {
    if (isReviewer || isAdmin) {
      t.push({ label: "Approve", to: "approved" });
      t.push({ label: "Request Revision", to: "needs_revision", needsComment: true });
    }
  }
  if (status === "needs_revision") {
    if (isAssignee || isAdmin) {
      t.push({ label: "Resubmit for Review", to: "in_review" });
    }
  }
  if (isAdmin && status !== "draft") {
    t.push({ label: "Revert to Draft", to: "draft" });
  }

  return t;
}

export function WorkflowActions({
  currentStatus,
  isAssignee,
  isReviewer,
  isAdmin,
  onTransition,
  disabled,
}: WorkflowActionsProps) {
  const [commentDialog, setCommentDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingTo, setPendingTo] = useState<WorkflowStatus | null>(null);

  const transitions = getTransitions(currentStatus, isAssignee, isReviewer, isAdmin);

  if (transitions.length === 0) return null;

  const handleClick = (t: Transition) => {
    if (t.needsComment) {
      setPendingTo(t.to);
      setCommentDialog(true);
    } else {
      onTransition(t.to);
    }
  };

  const submitWithComment = () => {
    if (!comment.trim()) return;
    if (pendingTo) onTransition(pendingTo, comment);
    setCommentDialog(false);
    setComment("");
    setPendingTo(null);
  };

  if (transitions.length === 1) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={disabled}
        onClick={e => { e.stopPropagation(); handleClick(transitions[0]); }}
      >
        {transitions[0].label}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            disabled={disabled}
            onClick={e => e.stopPropagation()}
          >
            Actions <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
          {transitions.map(t => (
            <DropdownMenuItem key={t.to + t.label} onClick={() => handleClick(t)}>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={commentDialog} onOpenChange={setCommentDialog}>
        <DialogContent onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Explain what needs to be fixed..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCommentDialog(false)}>Cancel</Button>
            <Button onClick={submitWithComment} disabled={!comment.trim()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

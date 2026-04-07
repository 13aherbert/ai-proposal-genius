import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, RotateCcw, MessageSquare } from "lucide-react";
import { ProposalSection } from "@/components/project/proposal-draft/useProposalSections";
import { ReviewChecklist } from "./ReviewChecklist";
import { ApprovalHistory } from "./ApprovalHistory";
import { useReviewChecklist, useChecklistStatus, useSubmitReview } from "@/hooks/useReviewPipeline";
import { useSectionWorkflow } from "@/components/project/proposal-draft/hooks/useSectionWorkflow";
import { useProposalComments } from "@/hooks/useProposalComments";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ReviewSectionCardProps {
  section: ProposalSection;
  projectId: string;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string; avatar_url?: string }>;
  getMemberName: (userId: string | null) => string;
  isExpanded: boolean;
  onToggle: () => void;
  currentUserId?: string;
}

const STATUS_BORDER: Record<string, string> = {
  draft: "border-l-muted-foreground/40",
  in_review: "border-l-blue-400",
  approved: "border-l-green-500",
  needs_revision: "border-l-amber-500",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  in_review: { label: "In Review", variant: "default" },
  approved: { label: "Approved", variant: "outline" },
  needs_revision: { label: "Needs Revision", variant: "destructive" },
};

export function ReviewSectionCard({
  section,
  projectId,
  members,
  getMemberName,
  isExpanded,
  onToggle,
  currentUserId,
}: ReviewSectionCardProps) {
  const { items: checklistItems, isLoading: checklistLoading, initDefaults } = useReviewChecklist(projectId);
  const { statuses, toggleItem } = useChecklistStatus(section.section_id);
  const submitReview = useSubmitReview(projectId);
  const workflow = useSectionWorkflow(projectId);
  const { comments } = useProposalComments(projectId);
  const [revisionComment, setRevisionComment] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  const status = section.workflow_status || "draft";
  const isSelfReview = section.assigned_to === currentUserId;
  const isReviewable = status === "in_review";

  // Count comments for this section
  const sectionComments = useMemo(() =>
    comments.filter((c) => c.section_id === section.section_id && !c.is_resolved),
    [comments, section.section_id]
  );

  // Init default checklist items if none exist
  useMemo(() => {
    if (!checklistLoading && checklistItems.length === 0) {
      initDefaults();
    }
  }, [checklistLoading, checklistItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked =
    checklistItems.length > 0 &&
    checklistItems.every((item) => {
      const st = statuses.find((s) => s.checklist_item_id === item.id);
      return st?.checked === true;
    });

  const handleApprove = () => {
    const snapshot = checklistItems.map((item) => ({
      label: item.label,
      checked: statuses.find((s) => s.checklist_item_id === item.id)?.checked ?? false,
    }));
    submitReview.mutate({
      sectionId: section.section_id,
      action: "approved",
      checklistSnapshot: snapshot,
    });
    workflow.transition({
      sectionId: section.section_id,
      newStatus: "approved",
      projectId,
    });
  };

  const handleRequestRevision = () => {
    if (!revisionComment.trim()) return;
    const snapshot = checklistItems.map((item) => ({
      label: item.label,
      checked: statuses.find((s) => s.checklist_item_id === item.id)?.checked ?? false,
    }));
    submitReview.mutate({
      sectionId: section.section_id,
      action: "revision_requested",
      comment: revisionComment,
      checklistSnapshot: snapshot,
    });
    workflow.transition({
      sectionId: section.section_id,
      newStatus: "needs_revision",
      reviewComment: revisionComment,
      projectId,
    });
    setRevisionComment("");
    setShowRevisionInput(false);
  };

  const badgeConfig = STATUS_BADGE[status] || STATUS_BADGE.draft;

  return (
    <Card className={cn("border-l-4", STATUS_BORDER[status] || "border-l-muted")}>
      <CardHeader className="cursor-pointer py-3 px-4" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{section.section_title}</span>
              <Badge variant={badgeConfig.variant} className="text-[10px]">
                {badgeConfig.label}
              </Badge>
              {isSelfReview && isReviewable && (
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Self-review
                </Badge>
              )}
              {sectionComments.length > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <MessageSquare className="h-3 w-3" /> {sectionComments.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>By {getMemberName(section.assigned_to)}</span>
              {section.due_date && (
                <span>Due {formatDistanceToNow(new Date(section.due_date), { addSuffix: true })}</span>
              )}
              <span>Updated {formatDistanceToNow(new Date(section.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Read-only content preview */}
          <div className="border rounded-md p-4 bg-muted/30 max-h-64 overflow-y-auto">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content || "<p class='text-muted-foreground'>No content</p>" }}
            />
          </div>

          {/* Review comment from last revision */}
          {status === "needs_revision" && section.review_comment && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300 text-xs mb-1">Revision Requested:</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs italic">"{section.review_comment}"</p>
            </div>
          )}

          {/* Checklist (only for reviewable sections) */}
          {isReviewable && (
            <>
              <ReviewChecklist
                items={checklistItems}
                statuses={statuses}
                onToggle={(checklistItemId, checked) => toggleItem({ checklistItemId, checked })}
              />

              {isSelfReview && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  You are reviewing your own section. Consider having another team member review for objectivity.
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 items-start">
                <Button
                  onClick={handleApprove}
                  disabled={!allChecked || submitReview.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                {!showRevisionInput ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevisionInput(true)}
                    className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Request Revision
                  </Button>
                ) : (
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Textarea
                      placeholder="Describe what needs to be revised..."
                      value={revisionComment}
                      onChange={(e) => setRevisionComment(e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleRequestRevision}
                        disabled={!revisionComment.trim() || submitReview.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Submit Revision Request
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowRevisionInput(false); setRevisionComment(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Approval history */}
          <ApprovalHistory sectionId={section.section_id} members={members} />
        </CardContent>
      )}
    </Card>
  );
}

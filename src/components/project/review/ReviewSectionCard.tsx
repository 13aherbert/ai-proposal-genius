import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, RotateCcw, UserCheck } from "lucide-react";
import { ProposalSection } from "@/components/project/proposal-draft/useProposalSections";
import { ReviewChecklist } from "./ReviewChecklist";
import { ApprovalHistory } from "./ApprovalHistory";
import { useReviewChecklist, useChecklistStatus, useSubmitReview } from "@/hooks/useReviewPipeline";
import { useSectionWorkflow } from "@/components/project/proposal-draft/hooks/useSectionWorkflow";
import { formatDistanceToNow } from "date-fns";

interface ReviewSectionCardProps {
  section: ProposalSection;
  projectId: string;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string; avatar_url?: string }>;
  getMemberName: (userId: string | null) => string;
  isExpanded: boolean;
  onToggle: () => void;
  currentUserId?: string;
}

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
  const [revisionComment, setRevisionComment] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  const isSelfReview = section.assigned_to === currentUserId;

  // Init default checklist items if none exist
  useEffect(() => {
    if (!checklistLoading && checklistItems.length === 0) {
      initDefaults();
    }
  }, [checklistLoading, checklistItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked =
    checklistItems.length > 0 &&
    checklistItems.every((item) => {
      const status = statuses.find((s) => s.checklist_item_id === item.id);
      return status?.checked === true;
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

  return (
    <Card className="border-l-4 border-l-blue-400">
      <CardHeader className="cursor-pointer py-3 px-4" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{section.section_title}</span>
              {isSelfReview && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Self-review
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

          {/* Checklist */}
          <ReviewChecklist
            items={checklistItems}
            statuses={statuses}
            onToggle={(checklistItemId, checked) => toggleItem({ checklistItemId, checked })}
          />

          {/* Self-review warning */}
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

          {/* Approval history */}
          <ApprovalHistory sectionId={section.section_id} members={members} />
        </CardContent>
      )}
    </Card>
  );
}

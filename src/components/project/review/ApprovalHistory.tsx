import { useState } from "react";
import { useSectionReviews, SectionReview } from "@/hooks/useReviewPipeline";
import { ChevronDown, ChevronUp, CheckCircle2, RotateCcw, Send, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ApprovalHistoryProps {
  sectionId: string;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; avatar_url?: string }>;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  submitted: { icon: Send, label: "Submitted for review", color: "text-blue-600" },
  approved: { icon: CheckCircle2, label: "Approved", color: "text-green-600" },
  revision_requested: { icon: RotateCcw, label: "Requested revision", color: "text-amber-600" },
  reassigned: { icon: UserCheck, label: "Reassigned", color: "text-purple-600" },
};

export function ApprovalHistory({ sectionId, members }: ApprovalHistoryProps) {
  const { reviews, isLoading } = useSectionReviews(sectionId);
  const [isOpen, setIsOpen] = useState(false);

  const getName = (userId: string) => {
    const m = members.find((m) => m.user_id === userId);
    if (!m) return "Unknown";
    return [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "Unknown";
  };

  if (reviews.length === 0 && !isLoading) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
          <span>Approval History ({reviews.length})</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-l-2 border-muted ml-3 mt-2 space-y-3">
          {reviews.map((review) => {
            const config = ACTION_CONFIG[review.action] || ACTION_CONFIG.submitted;
            const Icon = config.icon;
            return (
              <div key={review.id} className="relative pl-4">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-muted-foreground/40" />
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{getName(review.reviewer_id)}</span>{" "}
                      <span className="text-muted-foreground">{config.label}</span>
                    </p>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{review.comment}"</p>
                    )}
                    {review.checklist_snapshot && (review.checklist_snapshot as Array<{label: string; checked: boolean}>).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {(review.checklist_snapshot as Array<{label: string; checked: boolean}>).filter(c => c.checked).length}/
                        {(review.checklist_snapshot as Array<{label: string; checked: boolean}>).length} checklist items passed
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

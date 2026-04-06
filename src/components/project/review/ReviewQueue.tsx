import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useProposalSections, ProposalSection } from "@/components/project/proposal-draft/useProposalSections";
import { useAuth } from "@/components/AuthProvider";
import { ReviewSectionCard } from "./ReviewSectionCard";
import { formatDistanceToNow } from "date-fns";

interface ReviewQueueProps {
  projectId: string;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string; avatar_url?: string }>;
}

export function ReviewQueue({ projectId, members }: ReviewQueueProps) {
  const { sections, isLoading } = useProposalSections(projectId);
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const inReviewSections = useMemo(() => {
    const reviewable = sections.filter((s) => s.workflow_status === "in_review");
    // Sort: assigned to me first, then by updated_at
    return reviewable.sort((a, b) => {
      const aIsMine = a.assigned_to === currentUserId ? 0 : 1;
      const bIsMine = b.assigned_to === currentUserId ? 0 : 1;
      if (aIsMine !== bIsMine) return aIsMine - bIsMine;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [sections, currentUserId]);

  const getMemberName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const m = members.find((m) => m.user_id === userId);
    if (!m) return "Unknown";
    return [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inReviewSections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Review Queue Empty</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
            No sections are currently waiting for review. Sections move here when authors submit them for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Review Queue
          <Badge variant="secondary" className="ml-1">{inReviewSections.length}</Badge>
        </h2>
      </div>

      <div className="space-y-3">
        {inReviewSections.map((section) => (
          <ReviewSectionCard
            key={section.section_id}
            section={section}
            projectId={projectId}
            members={members}
            getMemberName={getMemberName}
            isExpanded={expandedSection === section.section_id}
            onToggle={() =>
              setExpandedSection(expandedSection === section.section_id ? null : section.section_id)
            }
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

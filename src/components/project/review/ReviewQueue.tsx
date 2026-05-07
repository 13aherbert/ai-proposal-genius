import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardCheck, Filter, MessageSquare } from "lucide-react";
import { useProposalSections, ProposalSection } from "@/components/project/proposal-draft/useProposalSections";
import { useAuth } from "@/components/AuthProvider";
import { ReviewSectionCard } from "./ReviewSectionCard";
import { ChecklistManager } from "./ChecklistManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ReviewQueueProps {
  projectId: string;
  members: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string; avatar_url?: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  in_review: { label: "In Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  needs_revision: { label: "Needs Revision", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
};

export function ReviewQueue({ projectId, members }: ReviewQueueProps) {
  const { sections, isLoading } = useProposalSections(projectId);
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sections.length, draft: 0, in_review: 0, approved: 0, needs_revision: 0 };
    sections.forEach((s) => {
      const st = s.workflow_status || "draft";
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [sections]);

  const filteredSections = useMemo(() => {
    const result = statusFilter === "all"
      ? [...sections]
      : sections.filter((s) => (s.workflow_status || "draft") === statusFilter);
    // Always display in outline order (sort_order ASC, created_at as tiebreaker)
    return result.sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [sections, statusFilter]);

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

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Sections to Review</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
            Create proposal sections in the Draft tab first, then submit them for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allApproved = sections.length > 0 && sections.every((s) => s.workflow_status === "approved");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Review Queue
        </h2>
        <ChecklistManager projectId={projectId} />
      </div>

      {/* All-approved banner */}
      {allApproved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <p className="text-green-800 dark:text-green-300 font-medium">
            🎉 All sections approved — ready for export!
          </p>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "in_review", "needs_revision", "draft", "approved"].map((status) => {
          const count = statusCounts[status] || 0;
          const config = STATUS_CONFIG[status];
          const isActive = statusFilter === status;
          return (
            <Button
              key={status}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : config?.label || status}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Section cards */}
      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No sections match this filter.
          </p>
        ) : (
          filteredSections.map((section) => (
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
          ))
        )}
      </div>
    </div>
  );
}

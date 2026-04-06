import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type WorkflowStatus = "draft" | "in_review" | "approved" | "needs_revision";

export const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  needs_revision: "Needs Revision",
};

export const WORKFLOW_COLORS: Record<WorkflowStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  needs_revision: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export const WORKFLOW_ICONS: Record<WorkflowStatus, string> = {
  draft: "📝",
  in_review: "👁️",
  approved: "✅",
  needs_revision: "↩️",
};

interface TransitionParams {
  sectionId: string;
  newStatus: WorkflowStatus;
  reviewComment?: string;
  projectId: string;
}

export function useSectionWorkflow(projectId: string) {
  const queryClient = useQueryClient();

  const transitionMutation = useMutation({
    mutationFn: async ({ sectionId, newStatus, reviewComment }: TransitionParams) => {
      const updateData: Record<string, unknown> = { workflow_status: newStatus };
      if (reviewComment !== undefined) {
        updateData.review_comment = reviewComment;
      }
      if (newStatus === "draft" || newStatus === "in_review") {
        updateData.review_comment = newStatus === "in_review" ? null : reviewComment;
      }

      const { error } = await supabase
        .from("proposal_sections")
        .update(updateData)
        .eq("section_id", sectionId);

      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success(`Section moved to ${WORKFLOW_LABELS[newStatus]}`);
    },
    onError: (err: Error) => {
      toast.error("Failed to update status: " + err.message);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ sectionId, assignedTo }: { sectionId: string; assignedTo: string | null }) => {
      const { error } = await supabase
        .from("proposal_sections")
        .update({ assigned_to: assignedTo })
        .eq("section_id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Section assignee updated");
    },
    onError: (err: Error) => {
      toast.error("Failed to assign: " + err.message);
    },
  });

  const dueDateMutation = useMutation({
    mutationFn: async ({ sectionId, dueDate }: { sectionId: string; dueDate: string | null }) => {
      const { error } = await supabase
        .from("proposal_sections")
        .update({ due_date: dueDate })
        .eq("section_id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Due date updated");
    },
    onError: (err: Error) => {
      toast.error("Failed to set due date: " + err.message);
    },
  });

  return {
    transition: (params: TransitionParams) => transitionMutation.mutate(params),
    assign: (sectionId: string, assignedTo: string | null) =>
      assignMutation.mutate({ sectionId, assignedTo }),
    setDueDate: (sectionId: string, dueDate: string | null) =>
      dueDateMutation.mutate({ sectionId, dueDate }),
    isTransitioning: transitionMutation.isPending,
  };
}

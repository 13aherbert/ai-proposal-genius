import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReviewChecklistItem {
  id: string;
  project_id: string;
  label: string;
  sort_order: number;
  is_default: boolean;
  created_by: string | null;
}

export interface SectionReview {
  id: string;
  section_id: string;
  project_id: string;
  reviewer_id: string;
  action: "submitted" | "approved" | "revision_requested" | "reassigned";
  comment: string | null;
  checklist_snapshot: Array<{ label: string; checked: boolean }>;
  content_hash: string | null;
  created_at: string;
}

export interface ChecklistStatus {
  id: string;
  section_id: string;
  checklist_item_id: string;
  checked_by: string | null;
  checked: boolean;
  checked_at: string | null;
}

const DEFAULT_CHECKLIST = [
  "Content is accurate and complete",
  "Tone is appropriate for the target audience",
  "Compliance requirements are addressed",
  "No confidential information is exposed",
  "Formatting is consistent with other sections",
];

export function useReviewChecklist(projectId: string) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["review-checklist", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_checklist_items")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      if (error) throw error;
      return data as ReviewChecklistItem[];
    },
  });

  const initDefaults = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const inserts = DEFAULT_CHECKLIST.map((label, i) => ({
        project_id: projectId,
        label,
        sort_order: i,
        is_default: true,
        created_by: session.user.id,
      }));
      const { error } = await supabase
        .from("review_checklist_items")
        .insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-checklist", projectId] });
    },
  });

  const addItem = useMutation({
    mutationFn: async (label: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("review_checklist_items")
        .insert({
          project_id: projectId,
          label,
          sort_order: items.length,
          is_default: false,
          created_by: session.user.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-checklist", projectId] });
      toast.success("Checklist item added");
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("review_checklist_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-checklist", projectId] });
      toast.success("Checklist item removed");
    },
  });

  return { items, isLoading, initDefaults: initDefaults.mutate, addItem: addItem.mutate, removeItem: removeItem.mutate };
}

export function useChecklistStatus(sectionId: string) {
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["checklist-status", sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_checklist_status")
        .select("*")
        .eq("section_id", sectionId);
      if (error) throw error;
      return data as ChecklistStatus[];
    },
    enabled: !!sectionId,
  });

  const toggleItem = useMutation({
    mutationFn: async ({ checklistItemId, checked }: { checklistItemId: string; checked: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("review_checklist_status")
        .upsert({
          section_id: sectionId,
          checklist_item_id: checklistItemId,
          checked,
          checked_by: session.user.id,
          checked_at: checked ? new Date().toISOString() : null,
        }, { onConflict: "section_id,checklist_item_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-status", sectionId] });
    },
  });

  return { statuses, isLoading, toggleItem: toggleItem.mutate };
}

export function useSectionReviews(sectionId: string) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["section-reviews", sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("section_reviews")
        .select("*")
        .eq("section_id", sectionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SectionReview[];
    },
    enabled: !!sectionId,
  });

  return { reviews, isLoading };
}

export function useSubmitReview(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      action,
      comment,
      checklistSnapshot,
    }: {
      sectionId: string;
      action: SectionReview["action"];
      comment?: string;
      checklistSnapshot?: Array<{ label: string; checked: boolean }>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("section_reviews")
        .insert({
          section_id: sectionId,
          project_id: projectId,
          reviewer_id: session.user.id,
          action,
          comment: comment || null,
          checklist_snapshot: checklistSnapshot || [],
        });
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["section-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      const labels: Record<string, string> = {
        submitted: "Section submitted for review",
        approved: "Section approved",
        revision_requested: "Revision requested",
        reassigned: "Section reassigned",
      };
      toast.success(labels[action] || "Review action recorded");
    },
    onError: (err: Error) => {
      toast.error("Failed to submit review: " + err.message);
    },
  });
}

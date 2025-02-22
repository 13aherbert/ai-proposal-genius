import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProposalSection {
  section_id: string;
  project_id: string;
  section_title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export function useProposalSections(projectId: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["proposal-sections", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposal_sections")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ProposalSection[];
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from("proposal_sections")
        .delete()
        .eq("section_id", sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Section deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
      setError(error);
    },
  });

  const deleteAllSectionsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("proposal_sections")
        .delete()
        .eq("project_id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("All sections deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting sections:", error);
      toast.error("Failed to delete sections");
      setError(error);
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No authenticated user");
      }

      const { data, error } = await supabase
        .from("proposal_sections")
        .insert({
          project_id: projectId,
          section_title: title,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Section added successfully");
    },
    onError: (error: Error) => {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
      setError(error);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      content,
      title,
    }: {
      sectionId: string;
      content: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("proposal_sections")
        .update({ content, section_title: title })
        .eq("section_id", sectionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Section updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
      setError(error);
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sections: ProposalSection[]) => {
      return sections;
    },
    onSuccess: (newSections) => {
      queryClient.setQueryData(["proposal-sections", projectId], newSections);
      toast.success("Sections reordered successfully");
    },
    onError: (error: Error) => {
      console.error("Error reordering sections:", error);
      toast.error("Failed to reorder sections");
      setError(error);
    },
  });

  return {
    sections,
    isLoading,
    error,
    addSection: (title: string) => addSectionMutation.mutate(title),
    updateSection: (sectionId: string, content: string, title: string) =>
      updateSectionMutation.mutate({ sectionId, content, title }),
    reorderSections: (sections: ProposalSection[]) =>
      reorderSectionsMutation.mutate(sections),
    deleteAllSections: () => {
      if (window.confirm("Are you sure you want to delete all sections? This action cannot be undone.")) {
        deleteAllSectionsMutation.mutate();
      }
    },
    deleteSection: (sectionId: string) => {
      if (window.confirm("Are you sure you want to delete this section? This action cannot be undone.")) {
        deleteSectionMutation.mutate(sectionId);
      }
    },
  };
}


import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      toast({
        title: "Success",
        description: "Section deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "All sections deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting sections:", error);
      toast({
        title: "Error",
        description: "Failed to delete sections",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Section added successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error adding section:", error);
      toast({
        title: "Error",
        description: "Failed to add section",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Section updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating section:", error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
      setError(error);
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sections: ProposalSection[]) => {
      return sections;
    },
    onSuccess: (newSections) => {
      queryClient.setQueryData(["proposal-sections", projectId], newSections);
      toast({
        title: "Success",
        description: "Sections reordered successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error reordering sections:", error);
      toast({
        title: "Error",
        description: "Failed to reorder sections",
        variant: "destructive",
      });
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
    deleteSection: (sectionId: string) => deleteSectionMutation.mutate(sectionId),
    deleteAllSections: () => deleteAllSectionsMutation.mutate(),
  };
}

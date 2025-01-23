import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProposalSection {
  id: string;
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
        .eq("id", sectionId)
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

  return {
    sections,
    isLoading,
    error,
    addSection: (title: string) => addSectionMutation.mutate(title),
    updateSection: (sectionId: string, content: string, title: string) =>
      updateSectionMutation.mutate({ sectionId, content, title }),
  };
}

import { useState, useEffect } from "react";
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
  const [localBackups, setLocalBackups] = useState<any[]>([]);

  useEffect(() => {
    const key = `proposal-backup-${projectId}`;
    const savedBackups = localStorage.getItem(key);
    if (savedBackups) {
      try {
        setLocalBackups(JSON.parse(savedBackups));
      } catch (e) {
        console.error("Error parsing local backups:", e);
      }
    }
  }, [projectId]);

  useEffect(() => {
    const autoBackupInterval = setInterval(() => {
      if (sections && sections.length > 0) {
        createLocalBackup();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(autoBackupInterval);
  }, [projectId]);

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

  const createLocalBackup = () => {
    try {
      if (!sections || sections.length === 0) return;
      
      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          projectId,
          sections: sections.map(section => ({
            title: section.section_title,
            content: section.content,
            created: section.created_at,
            updated: section.updated_at
          }))
        }
      };
      
      const key = `proposal-backup-${projectId}`;
      const backups = JSON.parse(localStorage.getItem(key) || "[]");
      backups.push(backup);
      
      if (backups.length > 5) {
        backups.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(backups));
      setLocalBackups(backups);
      
      console.log("Auto-backup created:", backup.timestamp);
    } catch (error) {
      console.error("Auto-backup error:", error);
    }
  };

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { data, error: fetchError } = await supabase
        .from("proposal_sections")
        .select("*")
        .eq("section_id", sectionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const sectionBackup = {
        timestamp: new Date().toISOString(),
        section: data
      };
      
      const key = `deleted-section-${sectionId}`;
      localStorage.setItem(key, JSON.stringify(sectionBackup));
      
      const { error } = await supabase
        .from("proposal_sections")
        .delete()
        .eq("section_id", sectionId);

      if (error) throw error;
      
      return { success: true, deletedSection: data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Section deleted successfully", {
        description: "A backup was created in case you need to recover it."
      });
      setTimeout(createLocalBackup, 1000);
    },
    onError: (error: Error) => {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
      setError(error);
    },
  });

  const deleteAllSectionsMutation = useMutation({
    mutationFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("proposal_sections")
        .select("*")
        .eq("project_id", projectId);
        
      if (fetchError) throw fetchError;
      
      const sectionsBackup = {
        timestamp: new Date().toISOString(),
        sections: data
      };
      
      const key = `all-sections-backup-${projectId}`;
      localStorage.setItem(key, JSON.stringify(sectionsBackup));
      
      const { error } = await supabase
        .from("proposal_sections")
        .delete()
        .eq("project_id", projectId);

      if (error) throw error;
      
      return { success: true, deletedSections: data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("All sections deleted successfully", {
        description: "A backup was created in case you need to recover them."
      });
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

      // Get user's current organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('profile_id', session.user.id)
        .single();

      if (profileError || !profile?.current_organization_id) {
        throw new Error('No organization found. Please contact support.');
      }

      const { data, error } = await supabase
        .from("proposal_sections")
        .insert({
          project_id: projectId,
          section_title: title,
          user_id: session.user.id,
          organization_id: profile.current_organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-sections", projectId] });
      toast.success("Section added successfully");
      setTimeout(createLocalBackup, 1000);
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
      setTimeout(createLocalBackup, 1000);
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
      setTimeout(createLocalBackup, 1000);
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
    localBackups,
    addSection: (title: string) => addSectionMutation.mutate(title),
    updateSection: (sectionId: string, content: string, title: string) =>
      updateSectionMutation.mutate({ sectionId, content, title }),
    reorderSections: (sections: ProposalSection[]) =>
      reorderSectionsMutation.mutate(sections),
    deleteSection: (sectionId: string) => deleteSectionMutation.mutate(sectionId),
    deleteAllSections: () => deleteAllSectionsMutation.mutate(),
    createBackup: createLocalBackup,
  };
}


import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@supabase/supabase-js";
import { useSubscriptionFeatures } from "./use-subscription-features";
import { useState } from "react";
import { toast } from "sonner";

export type Project = {
  project_id: string;
  title: string;
  status: string;
  created_at: string;
  rfp_file_path: string;
  last_update_at: string;
  user_id: string;
  deadline: string | null;
};

export function useProjects(user: User | null) {
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const { getProjectLimit } = useSubscriptionFeatures();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", user?.id, currentPage, pageSize],
    queryFn: async () => {
      try {
        console.log("Fetching projects for user:", user?.id);
        console.log("Pagination:", { currentPage, pageSize });
        await new Promise(resolve => setTimeout(resolve, 500));

        // First, get the total count
        const { count, error: countError } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id);

        if (countError) {
          console.error("Count error:", countError);
          throw countError;
        }

        setTotalCount(count || 0);

        // Calculate range for pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        // Then fetch the paginated data
        const { data, error } = await supabase
          .from("projects")
          .select(`
            project_id,
            title,
            status,
            created_at,
            rfp_file_path,
            last_update_at,
            user_id,
            deadline
          `)
          .eq("user_id", user?.id)
          .order("last_update_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Projects fetched:", data);
        return data as Project[] || [];
      } catch (err) {
        console.error("Query error:", err);
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 30000,
  });

  const deleteProject = async (projectId: string) => {
    try {
      // First, backup the project data before deletion
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (projectData) {
        // Create a backup entry in local storage
        const backups = JSON.parse(localStorage.getItem("project_backups") || "{}");
        backups[projectId] = {
          data: projectData,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem("project_backups", JSON.stringify(backups));
      }

      // Then delete the project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("project_id", projectId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["projects"] });

      uiToast({
        title: "Project deleted",
        description: "The project has been successfully deleted. A backup was created in case you need to recover it.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      uiToast({
        variant: "destructive",
        title: "Error deleting project",
        description: "Failed to delete the project. Please try again.",
      });
    }
  };

  const exportProjects = async () => {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to export projects");
        return;
      }

      // Fetch all projects for export
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("last_update_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("No projects to export");
        return;
      }

      // Format data for export
      const exportData = JSON.stringify(data, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revoObjectURL(url);
      }, 100);
      
      toast.success(`Successfully exported ${data.length} projects`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export projects");
    }
  };

  const projectLimit = getProjectLimit();
  const projectCount = totalCount;
  const canCreateProject = projectCount < projectLimit;

  return {
    projects,
    isLoading,
    error,
    refetch,
    deleteProject,
    exportProjects,
    projectLimit,
    projectCount,
    canCreateProject,
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      setCurrentPage,
      setPageSize,
    }
  };
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@supabase/supabase-js";
import { useSubscriptionFeatures } from "./use-subscription-features";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { debounce } from "lodash";

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
  
  console.log("useProjects - Hook called with user:", user?.id);
  
  const fetchProjects = useCallback(async ({ currentPage, pageSize, userId }: { 
    currentPage: number;
    pageSize: number;
    userId: string;
  }) => {
    try {
      console.log("fetchProjects - Starting fetch for user:", userId);
      console.log("fetchProjects - Pagination:", { currentPage, pageSize });

      // First get the total count
      const { count, error: countError } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        console.error("fetchProjects - Count error:", countError);
        throw new Error(`Count query failed: ${countError.message}`);
      }

      const totalCount = count || 0;
      console.log("fetchProjects - Total project count:", totalCount);

      // Then get the actual data with pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

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
        .eq("user_id", userId)
        .order("last_update_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("fetchProjects - Data query error:", error);
        throw new Error(`Data query failed: ${error.message}`);
      }

      console.log("fetchProjects - Success:", { 
        projectCount: data?.length || 0, 
        totalCount 
      });
      
      return { data: data as Project[] || [], totalCount };
    } catch (err) {
      console.error("fetchProjects - Error:", err);
      throw err;
    }
  }, []);

  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", user?.id, currentPage, pageSize],
    queryFn: async () => {
      if (!user?.id) {
        console.log("useProjects - Query skipped: No user ID");
        return { data: [], totalCount: 0 };
      }
      
      console.log("useProjects - Executing query for user:", user.id);
      const result = await fetchProjects({ 
        currentPage, 
        pageSize, 
        userId: user.id 
      });
      setTotalCount(result.totalCount);
      return result;
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      console.error("useProjects - Query error:", error);
      // Show more detailed error to user
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to load projects: ${errorMessage}`);
    }
  }, [error]);

  const projects = projectsData?.data || [];
  const projectCount = totalCount;
  
  // Get project limit separately
  const projectLimit = getProjectLimit();
  const canCreateProject = projectCount < projectLimit;

  console.log("useProjects - Current state:", {
    projectCount,
    projectLimit,
    canCreateProject,
    isLoading,
    hasError: !!error
  });

  const debouncedSetPageSize = useCallback(
    debounce((size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    }, 300),
    []
  );

  const deleteProject = async (projectId: string) => {
    try {
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (projectData) {
        const backups = JSON.parse(localStorage.getItem("project_backups") || "{}");
        backups[projectId] = {
          data: projectData,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem("project_backups", JSON.stringify(backups));
      }

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

      const exportData = JSON.stringify(data, null, 2);
      
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Successfully exported ${data.length} projects`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export projects");
    }
  };

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
      setPageSize: debouncedSetPageSize,
    }
  };
}

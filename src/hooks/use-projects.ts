import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@supabase/supabase-js";
import { useSubscriptionFeatures } from "./use-subscription-features";

export type Project = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  rfp_file_path: string;
};

export function useProjects(user: User | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getProjectLimit } = useSubscriptionFeatures();

  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      try {
        console.log("Fetching projects...");
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

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
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: "Failed to delete the project. Please try again.",
      });
    }
  };

  const projectLimit = getProjectLimit();
  const projectCount = projects?.length || 0;
  const canCreateProject = projectCount < projectLimit;

  return {
    projects,
    isLoading,
    error,
    refetch,
    deleteProject,
    projectLimit,
    projectCount,
    canCreateProject
  };
}
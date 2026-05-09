import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Project = {
  project_id: string;
  title: string;
  status: string;
  created_at: string;
  rfp_file_path: string;
  user_id: string;
  client_name: string | null;
  business_name: string | null;
  deadline: string | null;
  analysis: string | null;
  proposal_outline: string | null;
  last_update_at: string;
};

export function useProjectDetails(projectId: string | undefined, user: User | null) {
  return useQuery({
    queryKey: ["project", projectId, user?.id],
    queryFn: async (): Promise<Project> => {
      if (!user?.id || !projectId) {
        throw new Error("No authenticated user or project ID");
      }
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Project not found");
      return data as Project;
    },
    enabled: !!user?.id && !!projectId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(500 * Math.pow(2, attemptIndex), 3000),
    staleTime: 60_000,
    meta: {
      onError: () => toast.error("Failed to load project details"),
    },
  });
}

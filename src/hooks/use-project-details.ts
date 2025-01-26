import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Project = {
  id: string;
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
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const fetchProjectWithRetry = async (projectId: string, userId: string, attempt = 1): Promise<Project> => {
  try {
    console.log(`Fetching project ${projectId} for user ${userId}`);
    
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data) {
      console.error("No project found with ID:", projectId);
      throw new Error("Project not found");
    }

    console.log("Project data retrieved:", data);
    return data as Project;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      return fetchProjectWithRetry(projectId, userId, attempt + 1);
    }
    throw error;
  }
};

export function useProjectDetails(projectId: string | undefined, user: User | null) {
  return useQuery({
    queryKey: ["project", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id || !projectId) {
        throw new Error("No authenticated user or project ID");
      }

      try {
        return await fetchProjectWithRetry(projectId, user.id);
      } catch (error) {
        console.error("Failed to fetch project details:", error);
        toast.error("Failed to load project details");
        throw error;
      }
    },
    enabled: !!user?.id && !!projectId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
  });
}
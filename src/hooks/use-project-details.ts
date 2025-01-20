import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
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
};

export function useProjectDetails(projectId: string | undefined, user: User | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["project", projectId, user?.id],
    queryFn: async () => {
      if (!user?.id || !projectId) {
        throw new Error("No authenticated user or project ID");
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching project",
          description: error.message,
        });
        throw error;
      }

      if (!data) {
        throw new Error("Project not found");
      }

      return data as Project;
    },
    enabled: !!user?.id && !!projectId,
  });
}
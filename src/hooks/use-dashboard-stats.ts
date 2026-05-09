import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

/**
 * Cached, count-only dashboard stats.
 * Uses HEAD requests so no row payloads are transferred.
 */
export function useDashboardStats() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: ["dashboard-stats", userId],
    queryFn: async () => {
      if (!userId) {
        return { projectCount: 0, knowledgeCount: 0 };
      }

      const [projectsRes, knowledgeRes] = await Promise.all([
        supabase
          .from("projects")
          .select("project_id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("knowledge_entries")
          .select("entry_id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (knowledgeRes.error) throw knowledgeRes.error;

      return {
        projectCount: projectsRes.count ?? 0,
        knowledgeCount: knowledgeRes.count ?? 0,
      };
    },
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const projectCount = query.data?.projectCount ?? 0;
  const knowledgeCount = query.data?.knowledgeCount ?? 0;

  return {
    projectCount,
    knowledgeCount,
    hasProjects: projectCount > 0,
    hasKnowledgeEntries: knowledgeCount > 0,
    isLoading: query.isLoading,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RecentActivity } from "@/components/dashboard/RecentActivityList";
import type { User } from "@supabase/supabase-js";

export const useRecentActivity = (user: User | null) => {
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["recent-activity", userId],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!userId) return [];

      const [projectsRes, entriesRes] = await Promise.all([
        supabase
          .from("projects")
          .select("project_id, title, created_at, last_update_at")
          .eq("user_id", userId)
          .order("last_update_at", { ascending: false })
          .limit(5),
        supabase
          .from("knowledge_entries")
          .select("entry_id, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (entriesRes.error) throw entriesRes.error;

      const activities: RecentActivity[] = [
        ...(projectsRes.data?.map((p) => {
          const isUpdate = new Date(p.last_update_at) > new Date(p.created_at);
          return {
            type: "project" as const,
            title: p.title,
            date: isUpdate ? p.last_update_at : p.created_at,
            id: p.project_id,
            isUpdate,
          };
        }) || []),
        ...(entriesRes.data?.map((e) => ({
          type: "knowledge" as const,
          title: e.title,
          date: e.created_at,
          id: e.entry_id,
        })) || []),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return activities;
    },
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  return {
    recentActivity: query.data ?? [],
    isLoading: query.isLoading,
  };
};

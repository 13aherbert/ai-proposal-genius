
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { RecentActivity } from "@/components/dashboard/RecentActivityList";
import type { User } from "@supabase/supabase-js";

export const useRecentActivity = (user: User | null) => {
  const { toast } = useToast();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user?.id) return;

      try {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('project_id, title, created_at, last_update_at')
          .eq('user_id', user.id)
          .order('last_update_at', { ascending: false })
          .limit(5);

        if (projectsError) throw projectsError;

        const { data: entries, error: entriesError } = await supabase
          .from('knowledge_entries')
          .select('entry_id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (entriesError) throw entriesError;

        const activities: RecentActivity[] = [
          ...(projects?.map(p => {
            const isUpdate = new Date(p.last_update_at) > new Date(p.created_at);
            return {
              type: 'project' as const,
              title: p.title,
              date: isUpdate ? p.last_update_at : p.created_at,
              id: p.project_id,
              isUpdate
            };
          }) || []),
          ...(entries?.map(e => ({
            type: 'knowledge' as const,
            title: e.title,
            date: e.created_at,
            id: e.entry_id
          })) || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load recent activity"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, [user?.id, toast]);

  return { recentActivity, isLoading };
};

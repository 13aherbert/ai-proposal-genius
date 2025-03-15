
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { RecentActivity } from "@/components/dashboard/RecentActivityList";
import type { User } from "@supabase/supabase-js";
import { useOptimizedQuery } from "./use-optimized-query";

export const useRecentActivity = (user: User | null) => {
  const { toast } = useToast();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the optimized query for projects with caching
  const { 
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError
  } = useOptimizedQuery<any[]>({
    url: `${supabase.supabaseUrl}/rest/v1/projects?select=project_id,title,created_at,last_update_at&user_id=eq.${user?.id}&order=last_update_at.desc&limit=5`,
    enabled: !!user?.id,
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: false,
    onError: (error) => {
      console.error('Error fetching recent projects:', error);
    }
  });

  // Use the optimized query for knowledge entries with caching
  const { 
    data: entriesData,
    isLoading: isLoadingEntries,
    error: entriesError
  } = useOptimizedQuery<any[]>({
    url: `${supabase.supabaseUrl}/rest/v1/knowledge_entries?select=entry_id,title,created_at&user_id=eq.${user?.id}&order=created_at.desc&limit=3`,
    enabled: !!user?.id,
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: false,
    onError: (error) => {
      console.error('Error fetching recent knowledge entries:', error);
    }
  });

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Process data once both queries are complete
    if (!isLoadingProjects && !isLoadingEntries) {
      try {
        const activities: RecentActivity[] = [
          ...(projectsData?.map(p => {
            const isUpdate = new Date(p.last_update_at) > new Date(p.created_at);
            return {
              type: 'project' as const,
              title: p.title,
              date: isUpdate ? p.last_update_at : p.created_at,
              id: p.project_id,
              isUpdate
            };
          }) || []),
          ...(entriesData?.map(e => ({
            type: 'knowledge' as const,
            title: e.title,
            date: e.created_at,
            id: e.entry_id
          })) || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

        setRecentActivity(activities);
      } catch (error: any) {
        console.error('Error processing activity data:', error);
        
        if (!projectsError && !entriesError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process recent activity data"
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.id, isLoadingProjects, isLoadingEntries, projectsData, entriesData, projectsError, entriesError, toast]);

  return { recentActivity, isLoading };
};

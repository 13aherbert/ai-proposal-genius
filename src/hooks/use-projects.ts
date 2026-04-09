
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@supabase/supabase-js";
import { useSubscriptionFeatures } from "./use-subscription-features";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { debounce } from "lodash";
import { getStoredSubscriptionData, isUserOfPlanType } from "./subscription/feature-access";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { useCurrentOrganization } from "./use-current-organization";

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
  const [cachedProjectLimit, setCachedProjectLimit] = useState<number | null>(null);
  
  // Get user's current organization with safety timeout
  const { organization, loading: orgLoading, error: orgError } = useCurrentOrganization();
  const organizationId = organization?.id;
  
  // Safety timeout: if org loading takes > 5s, bypass it
  const [orgLoadingTimedOut, setOrgLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (!orgLoading) {
      setOrgLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      console.warn("useProjects: orgLoading timed out after 5s, bypassing org filter");
      setOrgLoadingTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [orgLoading]);
  
  const effectiveOrgLoading = orgLoading && !orgLoadingTimedOut;
  
  useEffect(() => {
    const subscriptionData = getStoredSubscriptionData();
    
    if (subscriptionData && subscriptionData.plan_type) {
      const planType = subscriptionData.plan_type.toLowerCase();
      let limit;
      
      if (planType === 'pro') {
        limit = SUBSCRIPTION_PLAN_LIMITS.pro;
      } else if (planType === 'basic') {
        limit = SUBSCRIPTION_PLAN_LIMITS.basic;
      } else if (planType === 'starter') {
        limit = SUBSCRIPTION_PLAN_LIMITS.starter;
      } else {
        limit = SUBSCRIPTION_PLAN_LIMITS.starter;
      }
      
      console.log(`useProjects: Current project limit (${planType.toUpperCase()}): ${limit}`);
      setCachedProjectLimit(limit);
    } else {
      const limit = getProjectLimit();
      
      console.log(`useProjects: Current project limit: ${limit}`);
      setCachedProjectLimit(limit);
    }
  }, [getProjectLimit, user?.id]);
  
  useEffect(() => {
    if (user?.id) {
      console.log("User authenticated:", user.id);
      
      const subscriptionData = getStoredSubscriptionData();
      
      if (subscriptionData && subscriptionData.plan_type) {
        const planType = subscriptionData.plan_type.toLowerCase();
        let limit;
        
        if (planType === 'pro') {
          limit = SUBSCRIPTION_PLAN_LIMITS.pro;
          console.log("PRO USER authenticated - using pro limits:", limit);
          setCachedProjectLimit(limit);
        } else if (planType === 'starter') {
          limit = SUBSCRIPTION_PLAN_LIMITS.starter;
          console.log("STARTER USER authenticated (from subscription) - using starter limits:", limit);
          setCachedProjectLimit(limit);
        } else {
          limit = SUBSCRIPTION_PLAN_LIMITS.starter;
          console.log("DEFAULT STARTER USER authenticated - using starter limits:", limit);
          setCachedProjectLimit(limit);
        }
      }
    } else {
      console.log("No user authenticated");
    }
  }, [user]);

  const fetchProjects = useCallback(async ({ currentPage, pageSize, userId, organizationId }: { 
    currentPage: number;
    pageSize: number;
    userId: string | undefined;
    organizationId: string | null | undefined;
  }) => {
    try {
      console.log("fetchProjects - Starting fetch for user:", userId);
      console.log("fetchProjects - Organization ID:", organizationId);
      console.log("fetchProjects - Pagination:", { currentPage, pageSize });
      
      if (!userId) {
        console.warn("Cannot fetch projects: No user ID provided");
        return { data: [], totalCount: 0 };
      }
      
      // If user has no organization, fetch by user_id only (no org filter)
      
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Build the query with organization context
      let countQuery = supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      
      // Only add organization filter if we have an organization ID
      if (organizationId) {
        countQuery = countQuery.eq("organization_id", organizationId);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error("Count error:", countError);
        throw new Error(`Count query failed: ${countError.message}`);
      }

      const totalCount = count || 0;
      console.log("Total project count:", totalCount);

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build the main query with organization context
      let dataQuery = supabase
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

      // Only add organization filter if we have an organization ID
      if (organizationId) {
        dataQuery = dataQuery.eq("organization_id", organizationId);
      }

      const { data, error } = await dataQuery;

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Projects query failed: ${error.message}`);
      }

      console.log("Projects fetched:", data);
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
    queryKey: ["projects", user?.id, organizationId, currentPage, pageSize],
    queryFn: async () => {
      if (!user?.id) {
        console.log("Query execution prevented: No user ID available");
        return [];
      }
      
      console.log("useProjects - Executing query for user:", user.id);
      console.log("useProjects - Organization ID:", organizationId);
      
      const result = await fetchProjects({ 
        currentPage, 
        pageSize, 
        userId: user?.id,
        organizationId: organizationId
      });
      setTotalCount(result.totalCount);
      return result.data;
    },
    enabled: !!user?.id && !orgLoading,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    staleTime: 60000,
    gcTime: 300000,
  });

  useEffect(() => {
    if (error) {
      console.error("useProjects - Query error:", error);
    }
  }, [error]);

  const projects = projectsData || [];

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

      let query = supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("last_update_at", { ascending: false });

      // Add organization filter if available
      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;

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

  const updateProjectLimit = useCallback((newLimit: number) => {
    console.log(`Updating project limit to ${newLimit}`);
    
    const subscriptionData = getStoredSubscriptionData();
    
    if (subscriptionData && subscriptionData.plan_type) {
      const planType = subscriptionData.plan_type.toLowerCase();
      
      if (planType === 'pro') {
        console.log("Setting pro project limit (30) for pro user");
        setCachedProjectLimit(SUBSCRIPTION_PLAN_LIMITS.pro);
      } else if (planType === 'starter') {
        console.log("Setting starter project limit (10) for starter user");
        setCachedProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
      } else {
        setCachedProjectLimit(newLimit);
      }
    } else {
      setCachedProjectLimit(newLimit);
    }
  }, []);

  let projectLimit = cachedProjectLimit || getProjectLimit();
  
  const subscriptionData = getStoredSubscriptionData();
  
  if (subscriptionData && subscriptionData.plan_type) {
    const planType = subscriptionData.plan_type.toLowerCase();
    
    if (planType === 'pro') {
      projectLimit = SUBSCRIPTION_PLAN_LIMITS.pro;
    } else if (planType === 'basic') {
      projectLimit = SUBSCRIPTION_PLAN_LIMITS.basic;
    } else if (planType === 'starter') {
      projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
    } else {
      projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
    }
  }
  
  const projectCount = totalCount;
  const canCreateProject = projectCount < projectLimit;

  useEffect(() => {
    console.log(`Project limits: ${projectCount}/${projectLimit}`);
  }, [projectCount, projectLimit]);

  // Include organization loading state in overall loading
  const isLoadingWithOrg = isLoading || orgLoading;

  return {
    projects,
    isLoading: isLoadingWithOrg,
    error: error || orgError,
    refetch,
    deleteProject,
    exportProjects,
    projectLimit,
    projectCount,
    canCreateProject,
    updateProjectLimit,
    organizationId,
    pagination: {
      currentPage,
      pageSize,
      totalCount,
      setCurrentPage,
      setPageSize: debouncedSetPageSize,
    }
  };
}

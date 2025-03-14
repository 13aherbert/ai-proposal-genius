import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CACHE_KEY = 'userStatus';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export type UserStatusData = {
  is_admin: boolean;
  is_beta_tester: boolean;
  has_user_role: boolean;
  subscription_plan: string | null;
  subscription_status: string | null;
  project_limit: number | null;
  features: Record<string, any> | null;
};

export type UserRoleData = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by: string | null;
};

export type UserPermissionsResponse = {
  status: UserStatusData | null;
  roles: UserRoleData[];
  subscription: any | null;
  timestamp: number;
};

export function useUserStatus() {
  const { session } = useAuth();
  const [status, setStatus] = useState<UserStatusData | null>(null);
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const requestRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  // Initialize with cached data
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;
        
        // Use cache if it's less than CACHE_EXPIRY old
        if (age < CACHE_EXPIRY && data) {
          setStatus(data.status);
          setRoles(data.roles || []);
          setSubscription(data.subscription);
          setLastUpdated(timestamp);
          
          console.log("Initialized with cached user status", {
            status: data.status,
            roles: data.roles?.length || 0,
            cacheAge: Math.round(age / 1000) + 's',
          });
          
          initialized.current = true;
        }
      }
    } catch (e) {
      console.error("Error reading user status from cache:", e);
    }
  }, []);

  const fetchUserStatus = useCallback(async (force: boolean = false) => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }
    
    // Prevent multiple concurrent requests
    if (requestRef.current) {
      requestRef.current.abort();
    }
    
    // Don't fetch if we already fetched recently unless forced
    const timeSinceLastUpdate = Date.now() - lastUpdated;
    if (!force && timeSinceLastUpdate < 60000 && initialized.current) {
      console.log("Skipping status fetch - fetched too recently");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Create an AbortController for this request
    requestRef.current = new AbortController();
    
    try {
      console.log("Fetching user status from edge function");
      
      // Call our new edge function
      const { data, error } = await supabase.functions.invoke('get-user-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned from get-user-status function");
      }
      
      console.log("User status received:", {
        hasStatus: !!data.status,
        rolesCount: data.roles?.length || 0,
        hasSubscription: !!data.subscription,
        timestamp: new Date(data.timestamp).toISOString(),
      });
      
      // Update state
      setStatus(data.status);
      setRoles(data.roles || []);
      setSubscription(data.subscription);
      setLastUpdated(data.timestamp || Date.now());
      
      // Cache data for offline use
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: data.timestamp || Date.now(),
        }));
      } catch (cacheError) {
        console.error("Error caching user status:", cacheError);
      }
      
      initialized.current = true;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("User status fetch aborted");
        return;
      }
      
      console.error("Error fetching user status:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Show error toast only if this is not initialization
      if (initialized.current) {
        toast.error("Failed to fetch user status", {
          description: "Please try refreshing the page.",
        });
      }
    } finally {
      setIsLoading(false);
      requestRef.current = null;
    }
  }, [session, lastUpdated]);

  // Fetch user status when session changes
  useEffect(() => {
    if (session?.user) {
      fetchUserStatus();
    } else {
      // Reset state when session is null
      setStatus(null);
      setRoles([]);
      setSubscription(null);
      setIsLoading(false);
      setError(null);
    }
    
    return () => {
      // Cleanup request on unmount
      if (requestRef.current) {
        requestRef.current.abort();
      }
    };
  }, [session, fetchUserStatus]);

  // Convenience methods
  const isAdmin = useCallback((): boolean => {
    return status?.is_admin === true || roles.some(r => r.role === 'admin') || false;
  }, [status, roles]);

  const isBetaTester = useCallback((): boolean => {
    return status?.is_beta_tester === true || roles.some(r => r.role === 'beta_tester') || false;
  }, [status, roles]);

  const isUser = useCallback((): boolean => {
    return status?.has_user_role === true || roles.some(r => r.role === 'user') || false;
  }, [status, roles]);

  const getProjectLimit = useCallback((): number => {
    return status?.project_limit || subscription?.project_limit || 3;
  }, [status, subscription]);

  const getSubscriptionPlan = useCallback((): string => {
    return status?.subscription_plan || subscription?.plan_type || 'trial';
  }, [status, subscription]);

  const getSubscriptionStatus = useCallback((): string => {
    return status?.subscription_status || subscription?.status || 'trialing';
  }, [status, subscription]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (roleName === 'admin') return isAdmin();
    if (roleName === 'beta_tester') return isBetaTester();
    if (roleName === 'user') return isUser();
    return roles.some(r => r.role === roleName);
  }, [isAdmin, isBetaTester, isUser, roles]);

  return {
    status,
    roles,
    subscription,
    isLoading,
    error,
    lastUpdated,
    fetchUserStatus,
    isAdmin,
    isBetaTester,
    isUser,
    hasRole,
    getProjectLimit,
    getSubscriptionPlan,
    getSubscriptionStatus
  };
}

export default useUserStatus;


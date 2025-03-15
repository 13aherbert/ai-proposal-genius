
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

// Export the getUserRolesFromStorage function directly so it can be imported separately
export const getUserRolesFromStorage = (): any[] | null => {
  try {
    const rolesData = localStorage.getItem('userRoles');
    if (rolesData) {
      const parsedData = JSON.parse(rolesData);
      if (parsedData && Array.isArray(parsedData)) {
        return parsedData;
      }
    }
    return null;
  } catch (error) {
    console.error("Error parsing user roles from localStorage:", error);
    return null;
  }
};

export const useUserRoles = () => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  
  // References to track state between renders
  const refs = useRef({
    rolesInitialized: false,
    adminStatus: false,
    betaTesterStatus: false,
    userStatus: false,
    checkingInProgress: false,
    lastNetworkErrorTime: null as number | null,
    lastCheckedTime: null as number | null,
    lastForceCheckTime: null as number | null,
    forceUpdate: 0,
    timeout: null as number | null
  }).current;
  
  const getUserRolesFromStorageCallback = useCallback(getUserRolesFromStorage, []);
  
  const checkUserRoles = useCallback(async () => {
    if (refs.checkingInProgress) return;
    
    // Don't check too frequently
    const now = Date.now();
    if (refs.lastCheckedTime && (now - refs.lastCheckedTime < 10000)) {
      console.log("Skipping role check, last check was too recent");
      return;
    }
    
    try {
      refs.checkingInProgress = true;
      refs.lastCheckedTime = now;
      
      if (!refs.rolesInitialized) {
        setIsCheckingRoles(true);
      }
      
      setRoleCheckError(null);
      
      // Try to get all user roles using RPC functions first - these bypass RLS policies
      try {
        // Try admin check
        const { data: adminCheck } = await supabase.rpc('is_admin_direct');
        refs.adminStatus = !!adminCheck;
        setIsAdmin(refs.adminStatus);
        
        // Try beta tester check
        if (session?.user?.id) {
          const { data: betaCheck } = await supabase.rpc('check_beta_tester_role', {
            user_id_param: session.user.id
          });
          refs.betaTesterStatus = !!betaCheck;
          setIsBetaTester(refs.betaTesterStatus);
          
          // Try user role check  
          const { data: userCheck } = await supabase.rpc('check_user_role', {
            user_id_param: session.user.id,
            role_param: 'user'
          });
          refs.userStatus = !!userCheck;
          setIsUser(refs.userStatus);
        }
        
        // Even if the RPC calls succeed, also try the edge function to ensure
        // we have a complete list of roles for other purposes
        await fetchRolesViaEdgeFunction();
        
        refs.rolesInitialized = true;
      } catch (rpcError) {
        console.error("Error checking roles via RPC:", rpcError);
        
        // If RPC fails, try the edge function as fallback
        await fetchRolesViaEdgeFunction();
      }
    } catch (err) {
      console.error("Error checking user roles:", err);
      setRoleCheckError(err instanceof Error ? err.message : String(err));
      
      // Try to use cached roles as fallback
      const cachedRoles = getUserRolesFromStorage();
      if (cachedRoles) {
        console.log("Using cached user roles due to error:", cachedRoles);
        const adminRole = cachedRoles.some(role => role.role === 'admin');
        const betaRole = cachedRoles.some(role => role.role === 'beta_tester');
        const userRole = cachedRoles.some(role => role.role === 'user');
        
        setIsAdmin(adminRole);
        setIsBetaTester(betaRole);
        setIsUser(userRole);
      }
    } finally {
      setIsCheckingRoles(false);
      refs.checkingInProgress = false;
    }
  }, [session, refs, getUserRolesFromStorage]);
  
  // Helper function to fetch roles via the edge function
  const fetchRolesViaEdgeFunction = async () => {
    let token = session?.access_token;
      
    // Try to get token from localStorage if session is not available
    if (!token) {
      token = localStorage.getItem('userToken');
      console.log("No session token, using token from localStorage:", !!token);
    }
    
    if (!token) {
      console.error("No access token available for role check");
      return;
    }
    
    try {
      // Always send the token in the body, even if we're using the Authorization header
      // This provides a fallback mechanism
      const { data, error } = await supabase.functions.invoke('get-user-roles', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: { token } // Always include token in body as well
      });
      
      if (error) {
        console.error("Error fetching user roles:", error);
        throw error;
      }
      
      if (data && data.roles) {
        // Store roles in localStorage
        localStorage.setItem('userRoles', JSON.stringify(data.roles));
        
        const adminRole = data.roles.some(role => role.role === 'admin');
        const betaRole = data.roles.some(role => role.role === 'beta_tester');
        const userRole = data.roles.some(role => role.role === 'user');
        
        setIsAdmin(adminRole);
        setIsBetaTester(betaRole);
        setIsUser(userRole);
        
        refs.adminStatus = adminRole;
        refs.betaTesterStatus = betaRole;
        refs.userStatus = userRole;
        refs.rolesInitialized = true;
      }
    } catch (edgeFunctionError) {
      console.error("Edge function error:", edgeFunctionError);
      throw edgeFunctionError;
    }
  };

  const forceRoleCheck = useCallback(() => {
    const now = Date.now();
    
    // Don't allow forced checks more often than minimum interval
    if (refs.lastForceCheckTime && now - refs.lastForceCheckTime < 5000) {
      console.log("Skipping forced role check, too soon since last force check");
      return;
    }
    
    refs.forceUpdate++;
    refs.lastForceCheckTime = now;
    refs.lastCheckedTime = null; // Reset the regular check time to bypass throttling
    
    console.log("Forced role check triggered", {
      current: refs.forceUpdate,
      timestamp: new Date().toISOString()
    });
    
    checkUserRoles();
  }, [refs, checkUserRoles]);

  // Load cached roles on initial render
  useEffect(() => {
    const cachedRoles = getUserRolesFromStorage();
    if (cachedRoles && !refs.rolesInitialized) {
      console.log("Initializing with cached user roles:", cachedRoles);
      const adminRole = cachedRoles.some(role => role.role === 'admin');
      const betaRole = cachedRoles.some(role => role.role === 'beta_tester');
      const userRole = cachedRoles.some(role => role.role === 'user');
      
      setIsAdmin(adminRole);
      setIsBetaTester(betaRole);
      setIsUser(userRole);
      
      refs.adminStatus = adminRole;
      refs.betaTesterStatus = betaRole;
      refs.userStatus = userRole;
    }
  }, [refs]);

  // Check for session changes and fetch roles
  useEffect(() => {
    if (session?.user) {
      // Store access token in localStorage
      if (session.access_token) {
        localStorage.setItem('userToken', session.access_token);
      }
      
      // Delay initial check to avoid hammering server
      const initialTimeout = setTimeout(() => {
        checkUserRoles();
        
        // Set up regular checks at an interval
        const regularCheckInterval = setInterval(() => {
          if (!refs.checkingInProgress) {
            checkUserRoles();
          }
        }, 60000); // Check every minute
        
        return () => clearInterval(regularCheckInterval);
      }, 1000);
      
      return () => clearTimeout(initialTimeout);
    } else {
      // Reset state when session is null
      if (isAdmin) setIsAdmin(false);
      if (isBetaTester) setIsBetaTester(false);
      if (isUser) setIsUser(false);
      
      refs.adminStatus = false;
      refs.betaTesterStatus = false;
      refs.userStatus = false;
    }
  }, [session, checkUserRoles, refs, isAdmin, isBetaTester, isUser]);

  // Make sure showAdminButton and showBetaBadge directly reflect state
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  return {
    isAdmin,
    isBetaTester,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge,
    forceRoleCheck,
    getUserRolesFromStorage: getUserRolesFromStorageCallback
  };
};

// Re-export the hook as the default export
export default useUserRoles;

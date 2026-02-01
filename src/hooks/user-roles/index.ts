
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { checkAdminRole, updateAdminState, checkSystemAdminRole, updateSystemAdminState } from "./role-check-utils";
import { useRoleCheckEffect } from "./use-role-check-effect";
import { UserRoleState, UserRoleRefs } from "./types";

// Cache duration in milliseconds (10 seconds - increased from 5)
const ROLE_CACHE_DURATION = 10000;
// Forced check interval in milliseconds (60 seconds - increased from 30)
const FORCE_CHECK_INTERVAL = 60000;
// Initial check delay after session change
const INITIAL_CHECK_DELAY = 1000;
// Minimum time between force checks
const MIN_FORCE_CHECK_INTERVAL = 5000;

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); 
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  
  // References to track state between renders
  const refs = useRef<UserRoleRefs & { systemAdminStatus: boolean }>({
    rolesInitialized: false,
    adminStatus: false,
    systemAdminStatus: false,
    userStatus: false,
    checkingInProgress: false,
    lastNetworkErrorTime: null,
    lastCheckedTime: null,
    lastForceCheckTime: null,
    forceUpdate: 0,
    timeout: null
  }).current;
  
  // Get the checkRoles function from our effect hook
  const { checkRoles } = useRoleCheckEffect(
    session,
    setIsAdmin,
    setIsUser,
    setIsCheckingRoles,
    setRoleCheckError,
    refs,
    setIsSystemAdmin
  );
  
  // Function to force a full role check synchronously - with rate limiting
  const forceRoleCheck = useCallback(() => {
    if (!session?.user) return;
    
    // Don't allow forced checks more often than minimum interval
    const now = Date.now();
    
    // New check: Track the last force check time separately
    if (refs.lastForceCheckTime && now - refs.lastForceCheckTime < MIN_FORCE_CHECK_INTERVAL) {
      console.log("Skipping forced role check, too soon since last force check");
      return;
    }
    
    refs.forceUpdate++;
    refs.lastCheckedTime = now;
    refs.lastForceCheckTime = now;
    
    console.log("Forced role check triggered", {
      current: refs.forceUpdate,
      timestamp: new Date().toISOString()
    });
    
    // Only perform the check if we have a user session
    if (session?.user) {
      // First check admin status
      checkAdminRole(session.user.id, refs, true).then(adminStatus => {
        updateAdminState(adminStatus, refs.adminStatus, refs, setIsAdmin, true);
      });
      
      // Check system admin status
      checkSystemAdminRole(session.user.id, refs, true).then(systemAdminStatus => {
        updateSystemAdminState(systemAdminStatus, refs.systemAdminStatus, refs, setIsSystemAdmin, true);
      });
    }
  }, [session, refs, setIsAdmin, setIsSystemAdmin]);

  // Effect for session changes and timer-based role checking
  useEffect(() => {
    // Reset state when session is null
    if (!session?.user) {
      if (isAdmin) setIsAdmin(false);
      if (isSystemAdmin) setIsSystemAdmin(false);
      if (isUser) setIsUser(false);
      if (isCheckingRoles) setIsCheckingRoles(false);
      if (roleCheckError) setRoleCheckError(null);
      
      refs.rolesInitialized = false;
      refs.lastNetworkErrorTime = null;
      refs.adminStatus = false;
      refs.systemAdminStatus = false;
      refs.lastCheckedTime = null;
      refs.lastForceCheckTime = null;
      
      // Clear any existing timeout
      if (refs.timeout) {
        window.clearTimeout(refs.timeout);
        refs.timeout = null;
      }
      
      return;
    }
    
    // Clear any existing timeout when session changes
    if (refs.timeout) {
      window.clearTimeout(refs.timeout);
      refs.timeout = null;
    }
    
    // Delay the initial check to avoid hammering the server on session change
    const initialTimeout = setTimeout(() => {
      // Perform an initial check when session changes
      checkRoles();
      
      // Log that we're doing an initial critical role check
      console.log("Performing initial critical role check after session change", {
        timestamp: new Date().toISOString()
      });
      
      // Set up regular forced checks at a reasonable interval - significantly reduced frequency
      const regularCheckInterval = setInterval(() => {
        if (!refs.checkingInProgress && session?.user?.id) {
          console.log("Performing scheduled role check");
          checkRoles();
        }
      }, FORCE_CHECK_INTERVAL);
      
      // Clean up the interval on unmount or session change
      return () => {
        clearInterval(regularCheckInterval);
      };
    }, INITIAL_CHECK_DELAY);
    
    // Clean up the initial timeout if the component unmounts before it fires
    return () => {
      clearTimeout(initialTimeout);
      if (refs.timeout) {
        window.clearTimeout(refs.timeout);
        refs.timeout = null;
      }
    };
  }, [session, checkRoles, refs, isAdmin, isSystemAdmin, isUser, isCheckingRoles, roleCheckError]);
  
  // Make these derive directly from state
  const showAdminButton = isAdmin || isSystemAdmin;
  const showSystemAdminButton = isSystemAdmin;

  // Debug logging for admin status changes
  useEffect(() => {
    if (refs.adminStatus !== isAdmin) {
      console.log("Admin status changed in hook:", {
        from: refs.adminStatus,
        to: isAdmin,
        timestamp: new Date().toISOString()
      });
      refs.adminStatus = isAdmin;
    }
  }, [isAdmin, refs]);

  // Debug logging for system admin status changes
  useEffect(() => {
    if (refs.systemAdminStatus !== isSystemAdmin) {
      console.log("System Admin status changed in hook:", {
        from: refs.systemAdminStatus,
        to: isSystemAdmin,
        timestamp: new Date().toISOString()
      });
      refs.systemAdminStatus = isSystemAdmin;
    }
  }, [isSystemAdmin, refs]);

  return {
    isAdmin,
    isSystemAdmin,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showSystemAdminButton,
    forceRoleCheck
  };
}

// Re-export the hook as the default export
export default useUserRoles;


import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { checkBetaTesterRole, updateBetaTesterState } from "./role-check-utils";
import { useRoleCheckEffect } from "./use-role-check-effect";
import { UserRoleState, UserRoleRefs } from "./types";

// Cache duration in milliseconds (5 seconds)
const ROLE_CACHE_DURATION = 5000;
// Forced check interval in milliseconds (30 seconds)
const FORCE_CHECK_INTERVAL = 30000;
// Initial check delay after session change
const INITIAL_CHECK_DELAY = 1000;

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); 
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  
  // References to track state between renders
  const refs = useRef<UserRoleRefs>({
    rolesInitialized: false,
    adminStatus: false,
    betaTesterStatus: false,
    userStatus: false,
    checkingInProgress: false,
    lastNetworkErrorTime: null,
    lastCheckedTime: null,
    forceUpdate: 0,
    timeout: null
  }).current;
  
  // Get the checkRoles function from our effect hook
  const { checkRoles } = useRoleCheckEffect(
    session,
    setIsAdmin,
    setIsBetaTester,
    setIsUser,
    setIsCheckingRoles,
    setRoleCheckError,
    refs
  );
  
  // Function to force a full role check synchronously
  const forceRoleCheck = useCallback(() => {
    if (!session?.user) return;
    
    // Don't allow forced checks more often than every 2 seconds
    const now = Date.now();
    if (refs.lastCheckedTime && now - refs.lastCheckedTime < 2000) {
      console.log("Skipping forced role check, too soon since last check");
      return;
    }
    
    refs.forceUpdate++;
    refs.lastCheckedTime = now;
    
    console.log("Forced role check triggered", {
      current: refs.forceUpdate,
      timestamp: new Date().toISOString()
    });
    
    // Only perform the full check if we have a user session
    if (session?.user) {
      checkBetaTesterRole(session.user.id, refs, true).then(betaStatus => {
        updateBetaTesterState(betaStatus, refs.betaTesterStatus, refs, setIsBetaTester, true);
      });
    }
  }, [session, refs]);

  // Effect for session changes and timer-based role checking
  useEffect(() => {
    // Reset state when session is null
    if (!session?.user) {
      if (isAdmin) setIsAdmin(false);
      if (isBetaTester) setIsBetaTester(false);
      if (isUser) setIsUser(false);
      if (isCheckingRoles) setIsCheckingRoles(false);
      if (roleCheckError) setRoleCheckError(null);
      
      refs.rolesInitialized = false;
      refs.lastNetworkErrorTime = null;
      refs.betaTesterStatus = false;
      refs.lastCheckedTime = null;
      
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
      
      // CRITICAL: Perform one beta check on session change
      // This ensures beta status is properly detected on initial load
      if (!refs.lastCheckedTime || Date.now() - refs.lastCheckedTime > ROLE_CACHE_DURATION) {
        refs.lastCheckedTime = Date.now();
        checkBetaTesterRole(session.user.id, refs, true).then(isBeta => {
          console.log("Initial beta check completed with result:", isBeta);
          updateBetaTesterState(isBeta, refs.betaTesterStatus, refs, setIsBetaTester, true);
        });
      }
      
      // Set up regular forced checks at a reasonable interval
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
  }, [session, checkRoles, refs]);
  
  // Make these derive directly from state
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  useEffect(() => {
    // Log whenever these critical values change, but only once per change
    if (refs.betaTesterStatus !== isBetaTester) {
      console.log("Beta tester state changed in hook:", isBetaTester, {
        timestamp: new Date().toISOString()
      });
    }
  }, [isBetaTester, refs.betaTesterStatus]);

  return {
    isAdmin,
    isBetaTester,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge,
    forceRoleCheck
  };
}

// Re-export the hook as the default export
export default useUserRoles;

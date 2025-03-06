
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { checkBetaTesterRole, updateBetaTesterState } from "./role-check-utils";
import { useRoleCheckEffect } from "./use-role-check-effect";
import { UserRoleState, UserRoleRefs } from "./types";

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
    refs.forceUpdate++;
    if (session?.user) {
      checkBetaTesterRole(session.user.id, refs, true).then(betaStatus => {
        updateBetaTesterState(betaStatus, refs.betaTesterStatus, refs, setIsBetaTester, true);
      });
    }
    
    console.log("Forced role check triggered", {
      current: refs.forceUpdate,
      timestamp: new Date().toISOString()
    });
  }, [session, refs]);

  // Effect for session changes and timer-based role checking
  useEffect(() => {
    if (!session?.user) {
      if (isAdmin) setIsAdmin(false);
      if (isBetaTester) setIsBetaTester(false);
      if (isUser) setIsUser(false);
      if (isCheckingRoles) setIsCheckingRoles(false);
      if (roleCheckError) setRoleCheckError(null);
      refs.rolesInitialized = false;
      refs.lastNetworkErrorTime = null;
      refs.betaTesterStatus = false;
      return;
    }
    
    // Immediate check when session changes or on initial load
    checkRoles();
    
    if (refs.timeout) {
      window.clearTimeout(refs.timeout);
      refs.timeout = null;
    }
    
    // CRITICAL: Force an immediate direct beta check with UI update
    // This ensures beta status is properly detected on initial load
    checkBetaTesterRole(session.user.id, refs, true).then(isBeta => {
      console.log("Direct beta check completed with result:", isBeta);
      
      // Force state update to trigger UI refresh regardless of what the value is
      updateBetaTesterState(isBeta, refs.betaTesterStatus, refs, setIsBetaTester, true);
      
      // Log the state after update for debugging
      setTimeout(() => {
        console.log("Beta tester state after forced update:", {
          isBetaTester: isBeta, 
          ref: refs.betaTesterStatus,
          timestamp: new Date().toISOString() 
        });
      }, 0);
    });
    
    const checkInterval = refs.lastNetworkErrorTime ? 10000 : 3000;
    refs.timeout = window.setTimeout(() => {
      checkRoles();
    }, checkInterval);
    
    return () => {
      if (refs.timeout) {
        window.clearTimeout(refs.timeout);
        refs.timeout = null;
      }
    };
  }, [session, checkRoles, refs, isAdmin, isBetaTester, isUser, isCheckingRoles, roleCheckError]);
  
  // KEY FIX: Add an effect specifically for beta tester state changes
  useEffect(() => {
    console.log("Beta tester state changed in hook:", isBetaTester, {
      timestamp: new Date().toISOString()
    });
  }, [isBetaTester]);
  
  // Derive these values directly from the state values
  // KEY FIX: Make showBetaBadge derive directly from state
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  useEffect(() => {
    // Log whenever these critical values change
    console.log("useUserRoles state changed:", { 
      isAdmin, 
      isBetaTester, 
      showBetaBadge,
      betaTesterRef: refs.betaTesterStatus,
      timestamp: new Date().toISOString() 
    });
  }, [isAdmin, isBetaTester, showBetaBadge, refs.betaTesterStatus]);

  return {
    isAdmin,
    isBetaTester,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge,
    forceRoleCheck // Export this so components can trigger a check
  };
}

// Re-export the hook as the default export
export default useUserRoles;


import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { checkBetaTesterRole, updateBetaTesterState, checkDeveloperRole, updateDeveloperState } from "./role-check-utils";
import { useRoleCheckEffect } from "./use-role-check-effect";
import { UserRoleState, UserRoleRefs } from "./types";

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); 
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  
  // References to track state between renders
  const refs = useRef<UserRoleRefs>({
    rolesInitialized: false,
    adminStatus: false,
    betaTesterStatus: false,
    developerStatus: false,
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
    setIsDeveloper,
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
      
      checkDeveloperRole(session.user.id, refs, true).then(developerStatus => {
        updateDeveloperState(developerStatus, refs.developerStatus, refs, setIsDeveloper, true);
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
      if (isDeveloper) setIsDeveloper(false);
      if (isUser) setIsUser(false);
      if (isCheckingRoles) setIsCheckingRoles(false);
      if (roleCheckError) setRoleCheckError(null);
      refs.rolesInitialized = false;
      refs.lastNetworkErrorTime = null;
      refs.betaTesterStatus = false;
      refs.developerStatus = false;
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
    
    // Also force a direct developer check
    checkDeveloperRole(session.user.id, refs, true).then(isDev => {
      console.log("Direct developer check completed with result:", isDev);
      
      // Force state update
      updateDeveloperState(isDev, refs.developerStatus, refs, setIsDeveloper, true);
      
      setTimeout(() => {
        console.log("Developer state after forced update:", {
          isDeveloper: isDev,
          ref: refs.developerStatus,
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
  }, [session, checkRoles, refs, isAdmin, isBetaTester, isDeveloper, isUser, isCheckingRoles, roleCheckError]);
  
  // KEY FIX: Add effects for role state changes
  useEffect(() => {
    console.log("Beta tester state changed in hook:", isBetaTester, {
      timestamp: new Date().toISOString()
    });
  }, [isBetaTester]);
  
  useEffect(() => {
    console.log("Developer state changed in hook:", isDeveloper, {
      timestamp: new Date().toISOString()
    });
  }, [isDeveloper]);
  
  // Derive these values directly from the state values
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;
  const showDeveloperTools = isDeveloper;

  useEffect(() => {
    // Log whenever these critical values change
    console.log("useUserRoles state changed:", { 
      isAdmin, 
      isBetaTester,
      isDeveloper,
      showBetaBadge,
      showDeveloperTools,
      betaTesterRef: refs.betaTesterStatus,
      developerRef: refs.developerStatus,
      timestamp: new Date().toISOString() 
    });
  }, [isAdmin, isBetaTester, isDeveloper, showBetaBadge, showDeveloperTools, refs.betaTesterStatus, refs.developerStatus]);

  return {
    isAdmin,
    isBetaTester,
    isDeveloper,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge,
    showDeveloperTools,
    forceRoleCheck
  };
}

// Re-export the hook as the default export
export default useUserRoles;

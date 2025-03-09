
import { useCallback } from "react";
import { UserRoleRefs } from "./types";
import { checkBetaTesterRole, updateBetaTesterState, checkAdminRole, updateAdminState } from "./role-check-utils";
import { Session } from "@supabase/supabase-js";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

// Minimum time between role checks (15 seconds - increased from 10)
const MIN_CHECK_INTERVAL = 15000;

export const useRoleCheckEffect = (
  session: Session | null | undefined,
  setIsAdmin: (value: boolean) => void,  // Updated type definition to match actual usage
  setIsBetaTester: (updater: (prev: boolean) => boolean) => void,
  setIsUser: (value: boolean) => void,
  setIsCheckingRoles: (value: boolean) => void,
  setRoleCheckError: (value: string | null) => void,
  refs: UserRoleRefs
) => {
  // Create a stable callback for role checking
  const checkRoles = useCallback(async () => {
    if (!session?.user || refs.checkingInProgress) return;
    
    // Don't check too frequently
    const now = Date.now();
    if (refs.lastCheckedTime && (now - refs.lastCheckedTime < MIN_CHECK_INTERVAL)) {
      console.log("Skipping role check, last check was too recent");
      return;
    }
    
    // Skip if there was a recent network error
    if (refs.lastNetworkErrorTime && (now - refs.lastNetworkErrorTime < 5000)) {
      console.log("Skipping role check due to recent network error");
      return;
    }
    
    try {
      refs.checkingInProgress = true;
      
      if (!refs.rolesInitialized) {
        setIsCheckingRoles(true);
      }
      
      // Mark this check time
      refs.lastCheckedTime = now;
      
      setRoleCheckError(null);
      
      // Check admin role using direct RPC function
      try {
        console.log("Checking admin role directly via RPC at", new Date().toISOString());
        const adminStatus = await checkAdminRole(session.user.id, refs, false);
        updateAdminState(adminStatus, refs.adminStatus, refs, setIsAdmin, false);
      } catch (adminError) {
        console.error("Error during admin role check:", adminError);
        refs.lastNetworkErrorTime = now;
      }
      
      // Check beta tester role directly
      try {
        const betaStatus = await checkBetaTesterRole(session.user.id, refs, false);
        updateBetaTesterState(betaStatus, refs.betaTesterStatus, refs, setIsBetaTester, false);
      } catch (betaError) {
        console.error("Error during beta role check:", betaError);
        refs.lastNetworkErrorTime = now;
      }
      
      // Check user role
      try {
        const userCheck = await adminService.ensureUserRole();
        if (userCheck !== refs.userStatus) {
          refs.userStatus = userCheck;
          setIsUser(userCheck);
        }
      } catch (userError) {
        console.error("Error during user role check:", userError);
        refs.lastNetworkErrorTime = now;
      }
      
      refs.rolesInitialized = true;
      setIsCheckingRoles(false);
      
    } catch (err) {
      console.error("Error checking user roles:", err);
      
      if (refs.adminStatus) {
        setRoleCheckError("Could not verify user roles");
        toast.error("Failed to check role status", { 
          description: "Please refresh the page or try again later",
          id: "role-check-error"
        });
      }
      
      setIsCheckingRoles(false);
      refs.lastNetworkErrorTime = now;
    } finally {
      refs.checkingInProgress = false;
    }
  }, [session, setIsAdmin, setIsBetaTester, setIsUser, setIsCheckingRoles, setRoleCheckError, refs]);

  // Return the checkRoles function for external use
  return { checkRoles };
};

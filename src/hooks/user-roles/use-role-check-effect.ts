
import { useEffect, useRef, useCallback } from "react";
import { UserRoleRefs } from "./types";
import { checkBetaTesterRole, updateBetaTesterState } from "./role-check-utils";
import { Session } from "@supabase/supabase-js";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

export const useRoleCheckEffect = (
  session: Session | null | undefined,
  setIsAdmin: (value: boolean) => void,
  setIsBetaTester: (updater: (prev: boolean) => boolean) => void,
  setIsUser: (value: boolean) => void,
  setIsCheckingRoles: (value: boolean) => void,
  setRoleCheckError: (value: string | null) => void,
  refs: UserRoleRefs
) => {
  // Create a stable callback for role checking
  const checkRoles = useCallback(async () => {
    if (!session?.user || refs.checkingInProgress) return;
    
    if (refs.lastNetworkErrorTime && (Date.now() - refs.lastNetworkErrorTime < 5000)) {
      console.log("Skipping role check due to recent network error");
      return;
    }
    
    try {
      refs.checkingInProgress = true;
      
      if (!refs.rolesInitialized) {
        setIsCheckingRoles(true);
      }
      
      setRoleCheckError(null);
      
      // Check admin role
      try {
        const adminCheck = await adminService.isAdmin();
        if (adminCheck !== refs.adminStatus) {
          refs.adminStatus = adminCheck;
          setIsAdmin(adminCheck);
        }
      } catch (adminError) {
        console.error("Error during admin role check:", adminError);
        refs.lastNetworkErrorTime = Date.now();
      }
      
      // Check beta tester role - directly using our specialized function
      try {
        // Force update to true to ensure state updates even if the reference is the same
        const betaStatus = await checkBetaTesterRole(session.user.id, refs, true);
        updateBetaTesterState(betaStatus, refs.betaTesterStatus, refs, setIsBetaTester, true);
        console.log("Beta role check in checkRoles:", betaStatus);
      } catch (betaError) {
        console.error("Error during beta role check:", betaError);
        refs.lastNetworkErrorTime = Date.now();
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
        refs.lastNetworkErrorTime = Date.now();
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
      refs.lastNetworkErrorTime = Date.now();
    } finally {
      refs.checkingInProgress = false;
    }
  }, [session, setIsAdmin, setIsBetaTester, setIsUser, setIsCheckingRoles, setRoleCheckError, refs]);

  // Return the checkRoles function for external use
  return { checkRoles };
};

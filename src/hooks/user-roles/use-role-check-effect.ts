
import { useCallback } from "react";
import { UserRoleRefs } from "./types";
import { checkAdminRole, updateAdminState, checkSystemAdminRole, updateSystemAdminState } from "./role-check-utils";
import { Session } from "@supabase/supabase-js";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

// Minimum time between role checks (15 seconds - increased from 10)
const MIN_CHECK_INTERVAL = 15000;
// Hard timeout for any single role-check RPC, so a hung request can never
// freeze the UI in the "checking…" state.
const RPC_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, label: string, ms = RPC_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export const useRoleCheckEffect = (
  session: Session | null | undefined,
  setIsAdmin: (value: boolean) => void,
  setIsUser: (value: boolean) => void,
  setIsCheckingRoles: (value: boolean) => void,
  setRoleCheckError: (value: string | null) => void,
  refs: UserRoleRefs & { systemAdminStatus: boolean },
  setIsSystemAdmin: (updater: (prev: boolean) => boolean) => void
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
      
      if (!refs.rolesInitialized) {
        setIsCheckingRoles(true);
      }
      
      // Mark this check time
      refs.lastCheckedTime = now;
      
      setRoleCheckError(null);
      
      // Check admin role using direct RPC function
      try {
        console.log("Checking admin role directly via RPC at", new Date().toISOString());
        const adminStatus = await withTimeout(
          checkAdminRole(session.user.id, refs, false),
          "is_admin RPC",
        );
        updateAdminState(adminStatus, refs.adminStatus, refs, setIsAdmin, false);
      } catch (adminError) {
        console.error("Error during admin role check:", adminError);
        refs.lastNetworkErrorTime = now;
        setRoleCheckError("Could not verify admin role");
      }
      
      // Check system admin role using direct RPC function
      try {
        console.log("Checking system admin role directly via RPC at", new Date().toISOString());
        const systemAdminStatus = await withTimeout(
          checkSystemAdminRole(session.user.id, refs, false),
          "is_system_admin RPC",
        );
        updateSystemAdminState(systemAdminStatus, refs.systemAdminStatus, refs, setIsSystemAdmin, false);
      } catch (systemAdminError) {
        console.error("Error during system admin role check:", systemAdminError);
        refs.lastNetworkErrorTime = now;
      }
      
      // Check user role
      try {
        const userCheck = await withTimeout(
          adminService.ensureUserRole(),
          "ensureUserRole",
        );
        if (userCheck !== refs.userStatus) {
          refs.userStatus = userCheck;
          setIsUser(userCheck);
        }
      } catch (userError) {
        console.error("Error during user role check:", userError);
        refs.lastNetworkErrorTime = now;
      }
      
      refs.rolesInitialized = true;
      
    } catch (err) {
      console.error("Error checking user roles:", err);
      
      if (refs.adminStatus || refs.systemAdminStatus) {
        setRoleCheckError("Could not verify user roles");
        toast.error("Failed to check role status", { 
          description: "Please refresh the page or try again later",
          id: "role-check-error"
        });
      }
      
      refs.lastNetworkErrorTime = now;
    } finally {
      // Always clear the spinner — a hung RPC must never leave the UI loading.
      setIsCheckingRoles(false);
      refs.rolesInitialized = true;
    }
  }, [session?.user?.id, setIsAdmin, setIsSystemAdmin, setIsUser, setIsCheckingRoles, setRoleCheckError, refs]);

  // Return the checkRoles function for external use
  return { checkRoles };
};

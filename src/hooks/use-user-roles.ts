
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); 
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  
  // Use refs to track state and prevent unnecessary re-renders
  const rolesInitializedRef = useRef(false);
  const adminStatusRef = useRef(false);
  const betaTesterStatusRef = useRef(false);
  const userStatusRef = useRef(false);
  const checkingInProgressRef = useRef(false);
  
  // Ref to track timeout IDs for cleanup
  const timeoutRef = useRef<number | null>(null);

  // Dedicated function to check beta tester role that prevents unnecessary state updates
  const checkBetaTesterRole = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return;
    
    try {
      // Set local checking flag
      checkingInProgressRef.current = true;
      
      const betaCheck = await adminService.checkUserRole('beta_tester');
      
      // Only update if the value has changed to avoid re-renders
      if (!!betaCheck !== betaTesterStatusRef.current) {
        betaTesterStatusRef.current = !!betaCheck;
        setIsBetaTester(!!betaCheck);
      }
      
      return !!betaCheck;
    } catch (error) {
      console.error("Error in beta role check:", error);
      return false;
    } finally {
      checkingInProgressRef.current = false;
    }
  }, [session]);
  
  // Stable role check function
  const checkRoles = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return;
    
    try {
      checkingInProgressRef.current = true;
      
      // Only set checking state if we haven't initialized roles yet
      if (!rolesInitializedRef.current) {
        setIsCheckingRoles(true);
      }
      
      setRoleCheckError(null);
      
      // Admin check
      const adminCheck = await adminService.isAdmin();
      if (adminCheck !== adminStatusRef.current) {
        adminStatusRef.current = adminCheck;
        setIsAdmin(adminCheck);
      }
      
      // Beta tester check
      await checkBetaTesterRole();
      
      // Regular user role check
      try {
        const userCheck = await adminService.ensureUserRole();
        if (userCheck !== userStatusRef.current) {
          userStatusRef.current = userCheck;
          setIsUser(userCheck);
        }
      } catch (userError) {
        console.error("Error during user role check:", userError);
      }
      
      // Mark initialization as complete
      rolesInitializedRef.current = true;
      setIsCheckingRoles(false);
      
    } catch (err) {
      console.error("Error checking user roles:", err);
      
      if (adminStatusRef.current) {
        setRoleCheckError("Could not verify user roles");
        toast.error("Failed to check role status", { 
          description: "Please refresh the page or try again later",
          id: "role-check-error"
        });
      }
      
      setIsCheckingRoles(false);
    } finally {
      checkingInProgressRef.current = false;
    }
  }, [session, checkBetaTesterRole]);

  // Effect to check roles when session changes
  useEffect(() => {
    // Skip if no session or if roles were already initialized
    if (!session?.user) {
      // Reset states when logged out
      if (isAdmin) setIsAdmin(false);
      if (isBetaTester) setIsBetaTester(false);
      if (isUser) setIsUser(false);
      if (isCheckingRoles) setIsCheckingRoles(false);
      if (roleCheckError) setRoleCheckError(null);
      rolesInitializedRef.current = false;
      return;
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Run initial check
    checkRoles();
    
    // Single follow-up check after a delay to ensure we catch any async role updates
    timeoutRef.current = window.setTimeout(() => {
      checkRoles();
    }, 5000);
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [session, checkRoles]);
  
  // Simplify the derived values
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  // Minimize console logging to avoid cluttering
  useEffect(() => {
    // Log only once when roles have been initialized
    if (rolesInitializedRef.current) {
      console.log("useUserRoles final state values:", { 
        isAdmin, 
        isBetaTester, 
        isUser, 
        showAdminButton, 
        showBetaBadge 
      });
    }
  }, [isAdmin, isBetaTester, isUser, showAdminButton, showBetaBadge]);

  return {
    isAdmin,
    isBetaTester,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge
  };
}

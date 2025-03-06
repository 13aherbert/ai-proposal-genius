
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { adminService } from "@/services/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); 
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  
  const rolesInitializedRef = useRef(false);
  const adminStatusRef = useRef(false);
  const betaTesterStatusRef = useRef(false);
  const userStatusRef = useRef(false);
  const checkingInProgressRef = useRef(false);
  const lastNetworkErrorTimeRef = useRef<number | null>(null);
  
  const timeoutRef = useRef<number | null>(null);

  // Dedicated function to check beta tester role
  const checkBetaTesterRole = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return betaTesterStatusRef.current;
    
    try {
      // Don't set checkingInProgress here as it's also set in the parent function
      console.log("Starting beta tester role check");
      
      // First try direct database query for beta_tester role
      const { data: user } = await supabase.auth.getUser();
      if (!user || !user.user) {
        console.error("No authenticated user found for beta check");
        return false;
      }

      const { data: directCheck, error: directError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('role', 'beta_tester');
      
      console.log("Direct beta tester check:", {
        result: directCheck && directCheck.length > 0,
        count: directCheck?.length || 0,
        error: directError
      });
      
      // If direct check gives us a clear result, use that
      if (!directError && directCheck && directCheck.length > 0) {
        console.log("Beta tester role confirmed via direct check");
        betaTesterStatusRef.current = true;
        setIsBetaTester(true);
        return true;
      }
      
      // Fallback to RPC
      const betaCheck = await adminService.checkUserRole('beta_tester');
      
      console.log("Beta tester RPC check result:", !!betaCheck);
      
      if (!!betaCheck !== betaTesterStatusRef.current) {
        console.log("Updating beta tester status from", betaTesterStatusRef.current, "to", !!betaCheck);
        betaTesterStatusRef.current = !!betaCheck;
        setIsBetaTester(!!betaCheck);
      }
      
      lastNetworkErrorTimeRef.current = null;
      
      return !!betaCheck;
    } catch (error) {
      console.error("Error in beta role check:", error);
      
      lastNetworkErrorTimeRef.current = Date.now();
      
      return betaTesterStatusRef.current;
    }
  }, [session]);
  
  const checkRoles = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return;
    
    if (lastNetworkErrorTimeRef.current && (Date.now() - lastNetworkErrorTimeRef.current < 5000)) {
      console.log("Skipping role check due to recent network error");
      return;
    }
    
    try {
      checkingInProgressRef.current = true;
      
      if (!rolesInitializedRef.current) {
        setIsCheckingRoles(true);
      }
      
      setRoleCheckError(null);
      
      // Check admin role
      try {
        const adminCheck = await adminService.isAdmin();
        if (adminCheck !== adminStatusRef.current) {
          adminStatusRef.current = adminCheck;
          setIsAdmin(adminCheck);
        }
      } catch (adminError) {
        console.error("Error during admin role check:", adminError);
        lastNetworkErrorTimeRef.current = Date.now();
      }
      
      // Check beta tester role - explicitly await this
      try {
        const isBeta = await checkBetaTesterRole();
        console.log("Beta tester check completed in checkRoles:", isBeta);
        // Force update the state to ensure reactivity
        betaTesterStatusRef.current = isBeta;
        setIsBetaTester(isBeta);
      } catch (betaError) {
        console.error("Error during beta role check:", betaError);
        lastNetworkErrorTimeRef.current = Date.now();
      }
      
      // Check user role
      try {
        const userCheck = await adminService.ensureUserRole();
        if (userCheck !== userStatusRef.current) {
          userStatusRef.current = userCheck;
          setIsUser(userCheck);
        }
      } catch (userError) {
        console.error("Error during user role check:", userError);
        lastNetworkErrorTimeRef.current = Date.now();
      }
      
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
      lastNetworkErrorTimeRef.current = Date.now();
    } finally {
      checkingInProgressRef.current = false;
    }
  }, [session, checkBetaTesterRole]);

  useEffect(() => {
    if (!session?.user) {
      if (isAdmin) setIsAdmin(false);
      if (isBetaTester) setIsBetaTester(false);
      if (isUser) setIsUser(false);
      if (isCheckingRoles) setIsCheckingRoles(false);
      if (roleCheckError) setRoleCheckError(null);
      rolesInitializedRef.current = false;
      lastNetworkErrorTimeRef.current = null;
      return;
    }
    
    // Immediate check when session changes or on initial load
    checkRoles();
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const checkInterval = lastNetworkErrorTimeRef.current ? 10000 : 3000;
    timeoutRef.current = window.setTimeout(() => {
      checkRoles();
    }, checkInterval);
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [session, checkRoles]);
  
  const showAdminButton = isAdmin;
  // Ensure that showBetaBadge is directly tied to isBetaTester
  const showBetaBadge = isBetaTester;

  useEffect(() => {
    console.log("useUserRoles updated state:", { 
      isAdmin, 
      isBetaTester, 
      isUser, 
      showAdminButton, 
      showBetaBadge,
      betaTesterRef: betaTesterStatusRef.current,
      initialized: rolesInitializedRef.current
    });
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

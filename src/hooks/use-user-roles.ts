
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

  // Dedicated function to check beta tester role - uses the direct RPC function
  const checkBetaTesterRole = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return betaTesterStatusRef.current;
    
    try {
      console.log("Starting beta tester role check for user:", session.user.id);
      
      // Get current user ID to pass to the RPC function
      const userId = session.user.id;
      
      // Use the RPC function that directly checks the beta_tester role
      const { data, error } = await supabase.rpc('check_beta_tester_role', {
        user_id_param: userId
      });
      
      if (error) {
        console.error("Beta tester RPC check error:", error);
        return betaTesterStatusRef.current;
      }
      
      console.log("Beta tester RPC check result:", data);
      
      // Important: Update beta tester status and force UI update
      const newStatus = !!data;
      betaTesterStatusRef.current = newStatus;
      setIsBetaTester(newStatus);
      
      console.log("Updated beta status:", {
        newStatus,
        ref: betaTesterStatusRef.current,
        stateAfterUpdate: newStatus,
        timestamp: new Date().toISOString()
      });
      
      return newStatus;
    } catch (error) {
      console.error("Error in direct beta role check:", error);
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
      
      // Check beta tester role - directly using our specialized function
      // This is the most important part - we'll run this check separately
      try {
        const betaStatus = await checkBetaTesterRole();
        console.log("Beta role check in checkRoles:", betaStatus);
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
      betaTesterStatusRef.current = false;
      return;
    }
    
    // Immediate check when session changes or on initial load
    checkRoles();
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // CRITICAL: Force an immediate direct beta check
    // This ensures beta status is properly detected on initial load
    checkBetaTesterRole().then(isBeta => {
      console.log("Direct beta check completed with result:", isBeta);
      // Force state update to trigger UI refresh
      setIsBetaTester(isBeta);
    });
    
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
  }, [session, checkRoles, checkBetaTesterRole]);
  
  // Derive these values directly from the state values
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  useEffect(() => {
    // Log whenever these critical values change
    console.log("useUserRoles state changed:", { 
      isAdmin, 
      isBetaTester, 
      showBetaBadge,
      betaTesterRef: betaTesterStatusRef.current,
      timestamp: new Date().toISOString() 
    });
  }, [isAdmin, isBetaTester, showBetaBadge]);

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

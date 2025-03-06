
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
  const forceUpdateRef = useRef(0);
  
  const timeoutRef = useRef<number | null>(null);

  // Dedicated function to check beta tester role - uses the direct RPC function
  const checkBetaTesterRole = useCallback(async (forceUpdate = false) => {
    if (!session?.user || (checkingInProgressRef.current && !forceUpdate)) return betaTesterStatusRef.current;
    
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
      
      console.log("Beta tester RPC check result:", data, "at", new Date().toISOString());
      
      // Important: Update beta tester status and force UI update
      const newStatus = !!data;
      
      // Only trigger state updates if the status actually changed or force update requested
      if (newStatus !== betaTesterStatusRef.current || forceUpdate) {
        betaTesterStatusRef.current = newStatus;
        
        // KEY FIX: We use a function updater to ensure React picks up the state change
        setIsBetaTester((prev) => {
          console.log(`Updating beta tester state from ${prev} to ${newStatus}`);
          return newStatus;
        });
        
        console.log("Beta tester state updated", {
          newStatus,
          ref: betaTesterStatusRef.current,
          timestamp: new Date().toISOString()
        });
      }
      
      return newStatus;
    } catch (error) {
      console.error("Error in direct beta role check:", error);
      return betaTesterStatusRef.current;
    }
  }, [session]);
  
  // Function to force a full role check synchronously
  const forceRoleCheck = useCallback(() => {
    forceUpdateRef.current++;
    checkBetaTesterRole(true);
    
    console.log("Forced role check triggered", {
      current: forceUpdateRef.current,
      timestamp: new Date().toISOString()
    });
  }, [checkBetaTesterRole]);
  
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
        // Force update to true to ensure state updates even if the reference is the same
        const betaStatus = await checkBetaTesterRole(true);
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
    
    // CRITICAL: Force an immediate direct beta check with UI update
    // This ensures beta status is properly detected on initial load
    checkBetaTesterRole(true).then(isBeta => {
      console.log("Direct beta check completed with result:", isBeta);
      
      // Force state update to trigger UI refresh regardless of what the value is
      setIsBetaTester(isBeta);
      
      // Log the state after update for debugging
      setTimeout(() => {
        console.log("Beta tester state after forced update:", {
          isBetaTester: isBeta, 
          ref: betaTesterStatusRef.current,
          timestamp: new Date().toISOString() 
        });
      }, 0);
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
    showBetaBadge,
    forceRoleCheck // Export this so components can trigger a check
  };
}

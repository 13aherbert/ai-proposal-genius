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
  
  const rolesInitializedRef = useRef(false);
  const adminStatusRef = useRef(false);
  const betaTesterStatusRef = useRef(false);
  const userStatusRef = useRef(false);
  const checkingInProgressRef = useRef(false);
  
  const timeoutRef = useRef<number | null>(null);

  const checkBetaTesterRole = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return false;
    
    try {
      checkingInProgressRef.current = true;
      
      const betaCheck = await adminService.checkUserRole('beta_tester');
      
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
  
  const checkRoles = useCallback(async () => {
    if (!session?.user || checkingInProgressRef.current) return;
    
    try {
      checkingInProgressRef.current = true;
      
      if (!rolesInitializedRef.current) {
        setIsCheckingRoles(true);
      }
      
      setRoleCheckError(null);
      
      const adminCheck = await adminService.isAdmin();
      if (adminCheck !== adminStatusRef.current) {
        adminStatusRef.current = adminCheck;
        setIsAdmin(adminCheck);
      }
      
      const isBeta = await checkBetaTesterRole();
      if (isBeta !== betaTesterStatusRef.current) {
        betaTesterStatusRef.current = isBeta;
        setIsBetaTester(isBeta);
      }
      
      try {
        const userCheck = await adminService.ensureUserRole();
        if (userCheck !== userStatusRef.current) {
          userStatusRef.current = userCheck;
          setIsUser(userCheck);
        }
      } catch (userError) {
        console.error("Error during user role check:", userError);
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
      return;
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    checkRoles();
    
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
  
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  useEffect(() => {
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

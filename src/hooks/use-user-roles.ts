
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useUserStatus } from "./use-user-status";

// Export the getUserRolesFromStorage function directly so it can be imported separately
export const getUserRolesFromStorage = (): any[] | null => {
  try {
    const rolesData = localStorage.getItem('userRoles');
    if (rolesData) {
      const parsedData = JSON.parse(rolesData);
      if (parsedData && Array.isArray(parsedData)) {
        return parsedData;
      }
    }
    return null;
  } catch (error) {
    console.error("Error parsing user roles from localStorage:", error);
    return null;
  }
};

export const useUserRoles = () => {
  const { session } = useAuth();
  const {
    isAdmin,
    isBetaTester,
    isUser,
    isLoading: isCheckingRoles,
    error: roleCheckError,
    fetchUserStatus: forceRoleCheck
  } = useUserStatus();
  
  // Track initialization state
  const hasCheckedRoles = useRef(false);
  
  // Only force a check once on initial render
  useEffect(() => {
    if (!hasCheckedRoles.current) {
      console.log("Performing initial role check in useUserRoles");
      forceRoleCheck(true);
      hasCheckedRoles.current = true;
    }
  }, [forceRoleCheck]);
  
  // Log role states in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("useUserRoles state:", {
        isAdmin,
        isBetaTester,
        isUser,
        isCheckingRoles,
        hasError: !!roleCheckError,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAdmin, isBetaTester, isUser, isCheckingRoles, roleCheckError]);

  // For UI visibility
  const showAdminButton = isAdmin;
  const showBetaBadge = isBetaTester;

  return {
    isAdmin,
    isBetaTester,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge,
    forceRoleCheck,
    getUserRolesFromStorage
  };
};

// Re-export the hook as the default export
export default useUserRoles;

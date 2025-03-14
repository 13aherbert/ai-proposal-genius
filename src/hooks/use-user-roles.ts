
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

type UserRole = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by: string | null;
};

type UserRoles = {
  roles: UserRole[];
};

// Export the getUserRolesFromStorage function directly so it can be imported separately
export const getUserRolesFromStorage = (): UserRole[] | null => {
  try {
    const rolesData = localStorage.getItem('userRoles');
    if (rolesData) {
      const parsedData = JSON.parse(rolesData);
      if (parsedData && Array.isArray(parsedData)) {
        return parsedData as UserRole[];
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [showBetaBadge, setShowBetaBadge] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);
  const [roleCheckError, setRoleCheckError] = useState<Error | null>(null);
  
  const getUserRolesFromStorageCallback = useCallback(getUserRolesFromStorage, []);
  
  const checkUserRoles = useCallback(async () => {
    if (!session?.access_token) {
      console.error("No access token available for role check");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-user-roles', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error("Error fetching user roles:", error);
        setRoleCheckError(error);
        return;
      }

      if (data && Array.isArray(data)) {
        const roles = data as UserRole[];
        const adminRole = roles.some(role => role.role === 'admin');
        const betaRole = roles.some(role => role.role === 'beta_tester');

        setIsAdmin(adminRole);
        setIsBetaTester(betaRole);
        setShowAdminButton(adminRole);
        setShowBetaBadge(betaRole);
        setRoleCheckError(null);
      } else {
        console.warn("Unexpected data format for user roles:", data);
        setRoleCheckError(new Error("Unexpected data format for user roles"));
      }
    } catch (err) {
      console.error("Error invoking get-user-roles function:", err);
      setRoleCheckError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsCheckingRoles(false);
    }
  }, [session]);

  const forceRoleCheck = useCallback(() => {
    setIsCheckingRoles(true);
    checkUserRoles();
  }, [checkUserRoles]);

  useEffect(() => {
    if (session?.access_token) {
      setIsCheckingRoles(true);
      checkUserRoles();
    } else {
      setIsAdmin(false);
      setIsBetaTester(false);
      setShowAdminButton(false);
      setShowBetaBadge(false);
      setIsCheckingRoles(false);
    }
  }, [session, checkUserRoles]);

  return {
    isAdmin,
    isBetaTester,
    showAdminButton,
    showBetaBadge,
    isCheckingRoles,
    roleCheckError,
    forceRoleCheck,
    getUserRolesFromStorage: getUserRolesFromStorageCallback
  };
};

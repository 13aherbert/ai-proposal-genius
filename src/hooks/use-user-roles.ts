
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
    // First check if we have cached roles
    const cachedRoles = getUserRolesFromStorage();
    if (cachedRoles) {
      console.log("Using cached user roles:", cachedRoles);
      const adminRole = cachedRoles.some(role => role.role === 'admin');
      const betaRole = cachedRoles.some(role => role.role === 'beta_tester');
      
      setIsAdmin(adminRole);
      setIsBetaTester(betaRole);
      setShowAdminButton(adminRole);
      setShowBetaBadge(betaRole);
    }
    
    // Still proceed with checking roles from the server
    try {
      let token = session?.access_token;
      
      if (!token) {
        // Try to get token from localStorage
        token = localStorage.getItem('userToken');
        console.log("No session token, using token from localStorage:", !!token);
      }
      
      if (!token) {
        console.error("No access token available for role check");
        setIsCheckingRoles(false);
        return;
      }
      
      // Store token in localStorage for future use
      localStorage.setItem('userToken', token);
      
      const { data, error } = await supabase.functions.invoke('get-user-roles', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error("Error fetching user roles:", error);
        
        // If auth error, try with token in body instead of header
        if (error.status === 403 || error.status === 401) {
          console.log("Trying fallback method with token in body");
          
          const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('get-user-roles', {
            body: { token }
          });
          
          if (fallbackError) {
            console.error("Fallback method also failed:", fallbackError);
            setRoleCheckError(fallbackError);
            setIsCheckingRoles(false);
            return;
          }
          
          if (fallbackData && fallbackData.roles) {
            console.log("Fallback method succeeded:", fallbackData);
            const roles = fallbackData.roles as UserRole[];
            
            localStorage.setItem('userRoles', JSON.stringify(roles));
            
            const adminRole = roles.some(role => role.role === 'admin');
            const betaRole = roles.some(role => role.role === 'beta_tester');
            
            setIsAdmin(adminRole);
            setIsBetaTester(betaRole);
            setShowAdminButton(adminRole);
            setShowBetaBadge(betaRole);
            setRoleCheckError(null);
            setIsCheckingRoles(false);
            return;
          }
        } else {
          setRoleCheckError(error);
          setIsCheckingRoles(false);
          return;
        }
      }

      if (data && data.roles) {
        const roles = data.roles as UserRole[];
        
        // Cache the roles in localStorage
        localStorage.setItem('userRoles', JSON.stringify(roles));
        
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
    if (session) {
      setIsCheckingRoles(true);
      checkUserRoles();
    } else {
      // Check if we have a cached userToken
      const cachedToken = localStorage.getItem('userToken');
      if (cachedToken) {
        console.log("No session but found cached token, checking roles");
        setIsCheckingRoles(true);
        checkUserRoles();
      } else {
        setIsAdmin(false);
        setIsBetaTester(false);
        setShowAdminButton(false);
        setShowBetaBadge(false);
        setIsCheckingRoles(false);
      }
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

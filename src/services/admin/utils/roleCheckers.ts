
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "../types";
import { getAdminStatusFromCache, setAdminStatusCache } from "./adminCache";

/**
 * Check if the current user has a specific role
 * Uses the check_existing_role RPC function to avoid row-level security recursion
 */
export async function checkUserRole(role: UserRole): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user || !user.user) return false;

    // Use the check_existing_role function which has SECURITY DEFINER to bypass RLS
    const { data, error } = await supabase.rpc('check_existing_role', {
      _user_id: user.user.id,
      _role: role
    });

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    console.log(`Role check for ${role}:`, !!data);
    return !!data;
  } catch (error) {
    console.error('Error in checkUserRole:', error);
    return false;
  }
}

/**
 * Check if the current user is an admin
 * Uses the is_admin_direct function to avoid row-level security recursion
 * Includes caching for reliability and performance
 */
export async function isAdmin(): Promise<boolean> {
  // Check cache first to avoid redundant calls
  const cachedStatus = getAdminStatusFromCache();
  if (cachedStatus !== null) {
    return cachedStatus;
  }
  
  // Reduce max retries to 1 to minimize API calls
  const maxRetries = 1;
  let retryCount = 0;
  
  const attemptAdminCheck = async (): Promise<boolean> => {
    try {
      // Call the is_admin_direct function which avoids recursion
      const { data, error } = await supabase.rpc('is_admin_direct');
      
      if (error) {
        console.error('Error checking admin status:', error);
        throw error;
      }
      
      const result = !!data;
      console.log("Is admin check result:", result);
      
      // Update cache
      setAdminStatusCache(result);
      
      return result;
    } catch (error) {
      console.error(`Error in isAdmin (attempt ${retryCount + 1}):`, error);
      
      // Only retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying admin check (attempt ${retryCount} of ${maxRetries})...`);
        
        // Use longer delay for backoff (3 seconds)
        const delay = 3000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptAdminCheck();
      }
      
      // Fallback: If we've had a successful admin check in the past,
      // reuse that value rather than failing completely
      const cachedStatus = getAdminStatusFromCache();
      if (cachedStatus !== null) {
        return cachedStatus;
      }
      
      // Fallback: Try to check admin role directly using our new check_existing_role RPC
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user || !user.user) {
          setAdminStatusCache(false);
          return false;
        }
        
        // Use check_existing_role RPC to check if user has admin role
        const { data: isAdminResult, error: rolesError } = await supabase.rpc('check_existing_role', {
          _user_id: user.user.id,
          _role: 'admin'
        });
          
        if (rolesError) {
          console.error('Error in fallback admin check:', rolesError);
          setAdminStatusCache(false);
          return false;
        }
        
        console.log("Fallback admin check result:", isAdminResult);
        
        // Update cache even for fallback results
        setAdminStatusCache(isAdminResult);
        
        return isAdminResult;
      } catch (fallbackError) {
        console.error('Error in fallback admin check:', fallbackError);
        setAdminStatusCache(false);
        return false;
      }
    }
  };
  
  return attemptAdminCheck();
}

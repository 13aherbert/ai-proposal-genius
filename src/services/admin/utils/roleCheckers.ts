
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
    if (!user || !user.user) {
      console.error("checkUserRole: No user found");
      return false;
    }

    const userId = user.user.id;
    console.log(`Starting role check for '${role}' - User ID: ${userId}`);

    // First, try a direct query to the user_roles table
    const { data: directCheck, error: directError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role);

    console.log(`Direct table check for role '${role}':`, {
      result: directCheck && directCheck.length > 0,
      count: directCheck?.length || 0,
      data: directCheck,
      error: directError,
      userId,
      timestamp: new Date().toISOString()
    });

    // If direct check succeeds, use that result
    if (!directError && directCheck && directCheck.length > 0) {
      console.log(`Role '${role}' confirmed via direct check`);
      return true;
    }

    // Fallback to RPC if direct check fails or returns no results
    console.log(`Attempting RPC check for role '${role}'`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_existing_role', {
      _user_id: userId,
      _role: role
    });

    if (rpcError) {
      console.error('Error in RPC role check:', rpcError);
      return false;
    }
    
    // Log the RPC response
    console.log(`RPC role check for '${role}':`, {
      result: !!rpcData,
      rawResponse: rpcData,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // As a last resort, try fetching all user roles to see what's there
    const { data: allRoles, error: allRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
      
    console.log(`All roles for user ${userId}:`, {
      roles: allRoles,
      error: allRolesError,
      timestamp: new Date().toISOString()
    });
    
    return !!rpcData;
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
        return await checkUserRole('admin');
      } catch (fallbackError) {
        console.error('Error in fallback admin check:', fallbackError);
        setAdminStatusCache(false);
        return false;
      }
    }
  };
  
  return attemptAdminCheck();
}

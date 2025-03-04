
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole } from "./types";

// Cache for admin status to avoid repeated calls
// Increase cache duration to 5 minutes to reduce API calls
let adminStatusCache: { status: boolean | null; timestamp: number } = { 
  status: null, 
  timestamp: 0 
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Check if the current user has a specific role
 * Uses a direct query to avoid row-level security recursion
 */
export async function checkUserRole(role: UserRole): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user || !user.user) return false;

    // Use the has_role function which has SECURITY DEFINER to bypass RLS
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.user.id,
      _role: role
    });

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkUserRole:', error);
    return false;
  }
}

/**
 * Check if the current user is an admin
 * Uses the new is_admin_direct function to avoid row-level security recursion
 * Includes caching for reliability and performance
 */
export async function isAdmin(): Promise<boolean> {
  // Check cache first to avoid redundant calls
  const now = Date.now();
  if (adminStatusCache.status !== null && (now - adminStatusCache.timestamp) < CACHE_DURATION) {
    return adminStatusCache.status;
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
      adminStatusCache = { status: result, timestamp: Date.now() };
      
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
      if (adminStatusCache.status !== null) {
        return adminStatusCache.status;
      }
      
      // Fallback: Try to check admin role directly if RPC fails
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user || !user.user) {
          adminStatusCache = { status: false, timestamp: Date.now() };
          return false;
        }
        
        // Query the user_roles table directly
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.user.id)
          .eq('role', 'admin');
          
        if (rolesError) {
          console.error('Error in fallback admin check:', rolesError);
          adminStatusCache = { status: false, timestamp: Date.now() };
          return false;
        }
        
        const isAdminResult = userRoles && userRoles.length > 0;
        console.log("Fallback admin check result:", isAdminResult);
        
        // Update cache even for fallback results
        adminStatusCache = { status: isAdminResult, timestamp: Date.now() };
        
        return isAdminResult;
      } catch (fallbackError) {
        console.error('Error in fallback admin check:', fallbackError);
        adminStatusCache = { status: false, timestamp: Date.now() };
        return false;
      }
    }
  };
  
  return attemptAdminCheck();
}

/**
 * Assign a role to a user
 */
export async function assignRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // Check admin using RPC
    if (!await isAdmin()) {
      toast.error("Access denied", { description: "You don't have permission to assign roles" });
      return false;
    }

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      toast.error("Authentication error", { description: "You need to be logged in" });
      return false;
    }

    // Use has_role instead of check_user_role to avoid TypeScript errors
    const { data: hasRole, error: checkError } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: role
    });

    if (checkError) {
      console.error('Error checking existing role:', checkError);
      toast.error("Failed to check existing role", { description: checkError.message });
      return false;
    }

    if (hasRole) {
      toast.info("Role already assigned", { description: `User already has the ${role} role` });
      return true;
    }

    // Assign role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        created_by: currentUser.user.id
      });

    if (error) {
      console.error('Error assigning role:', error);
      toast.error("Failed to assign role", { description: error.message });
      return false;
    }

    toast.success("Role assigned successfully");
    return true;
  } catch (error) {
    console.error('Error in assignRole:', error);
    toast.error("Failed to assign role", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // Check admin using RPC
    if (!await isAdmin()) {
      toast.error("Access denied", { description: "You don't have permission to remove roles" });
      return false;
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error removing role:', error);
      toast.error("Failed to remove role", { description: error.message });
      return false;
    }

    toast.success("Role removed successfully");
    return true;
  } catch (error) {
    console.error('Error in removeRole:', error);
    toast.error("Failed to remove role", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

/**
 * Check if the current user has the basic user role
 * If not, assigns the role automatically
 * 
 * Note: This function should now rarely be needed as the handle_new_user trigger
 * automatically assigns the user role on signup, but we keep it as a fallback
 */
export async function ensureUserRole(): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user || !user.user) return false;

    // Use has_role to check if user already has the role
    const { data: hasRole, error: checkError } = await supabase.rpc('has_role', {
      _user_id: user.user.id,
      _role: 'user'
    });
    
    if (checkError) {
      console.error('Error checking user role:', checkError);
      return false;
    }
    
    // If they already have the role, we're done
    if (hasRole) {
      return true;
    }
    
    // User doesn't have the role, so let's assign it
    console.log('User does not have the user role yet, assigning it now...');
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.user.id,
        role: 'user',
        created_by: user.user.id // Self-assigned
      });

    if (error) {
      console.error('Error ensuring user role:', error);
      return false;
    }

    console.log('Successfully assigned user role');
    return true;
  } catch (error) {
    console.error('Error in ensureUserRole:', error);
    return false;
  }
}

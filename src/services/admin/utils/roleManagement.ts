
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole } from "../types";
import { isAdmin } from "./roleCheckers";

/**
 * Assign a role to a user
 */
export async function assignRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // Check admin status first
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to assign roles" });
      return false;
    }

    // Get current user information 
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      toast.error("Authentication error", { description: "You need to be logged in" });
      return false;
    }

    // Use the assign_user_role RPC function which avoids RLS recursion
    const { data, error } = await supabase.rpc('assign_user_role', {
      _user_id: userId,
      _role: role,
      _created_by: currentUser.user.id
    });

    if (error) {
      console.error('Error assigning role:', error);
      toast.error("Failed to assign role", { description: error.message });
      return false;
    }

    // If data is null, the role already exists (based on our RPC function logic)
    if (data === null) {
      toast.info("Role already assigned", { description: `User already has the ${role} role` });
      return true;
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
    // Check admin status first
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to remove roles" });
      return false;
    }

    // Use the remove_user_role RPC function which avoids RLS recursion
    const { data, error } = await supabase.rpc('remove_user_role', {
      _user_id: userId,
      _role: role
    });

    if (error) {
      console.error('Error removing role:', error);
      toast.error("Failed to remove role", { description: error.message });
      return false;
    }

    // If data is true, role was successfully removed
    if (data) {
      toast.success("Role removed successfully");
      return true;
    } else {
      toast.info("Role not found", { description: `User does not have the ${role} role` });
      return false;
    }
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

    // Use check_existing_role RPC to check if user already has the role
    const { data: hasRole, error: checkError } = await supabase.rpc('check_existing_role', {
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
    
    // User doesn't have the role, so let's assign it using our RPC function
    console.log('User does not have the user role yet, assigning it now...');
    const { data, error } = await supabase.rpc('assign_user_role', {
      _user_id: user.user.id,
      _role: 'user',
      _created_by: user.user.id // Self-assigned
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

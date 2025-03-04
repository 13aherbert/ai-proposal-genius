
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole } from "./types";

/**
 * Check if the current user has a specific role
 * Uses a direct query to avoid row-level security recursion
 */
export async function checkUserRole(role: UserRole): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user || !user.user) return false;

    // Use a direct query without going through the RLS policy
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
 * Uses a direct RPC call to avoid row-level security recursion
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Call the is_admin function defined in SQL - this function uses SECURITY DEFINER
    // to bypass RLS and directly checks if the current user has admin role
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    console.log("Is admin check result:", !!data);
    return !!data;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
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

    // Check if user already has the role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select()
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existingRole) {
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

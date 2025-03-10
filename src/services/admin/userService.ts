
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile, UserRoleRecord, UserRole } from "./types";
import { withRetry, isNetworkError, getNetworkErrorMessage, EdgeFunctionResponse, withRateLimit } from "@/utils/network";

/**
 * ==================================
 * ROLE CHECK FUNCTIONS
 * ==================================
 * These functions handle checking user roles and permissions
 */

/**
 * Check if current user has admin role
 * @returns Promise<boolean> - True if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
}

/**
 * Check if current user has beta_tester role
 * @returns Promise<boolean> - True if user has beta_tester role
 */
export async function isBetaTester(): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;
    
    const { data, error } = await supabase.rpc('check_beta_tester_role', {
      user_id_param: userData.user.id
    });
    
    if (error) {
      console.error('Error checking beta tester status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking beta tester status:', error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 * @param role - The role to check
 * @returns Promise<boolean> - True if user has the specified role
 */
export async function checkUserRole(role: UserRole): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;
    
    const { data, error } = await supabase.rpc('check_user_role', {
      user_id_param: userData.user.id,
      role_param: role
    });
    
    if (error) {
      console.error(`Error checking ${role} role:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Exception checking ${role} role:`, error);
    return false;
  }
}

/**
 * Ensure the user has the basic 'user' role, creating it if missing
 * @returns Promise<boolean> - True if user has or was given the user role
 */
export async function ensureUserRole(): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;
    
    const hasRole = await checkUserRole('user');
    if (hasRole) return true;
    
    const { error } = await supabase.rpc('assign_user_role', {
      _user_id: userData.user.id,
      _role: 'user',
      _created_by: userData.user.id
    });
    
    if (error) {
      console.error('Error ensuring user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception ensuring user role:', error);
    return false;
  }
}

/**
 * ==================================
 * ROLE MANAGEMENT FUNCTIONS
 * ==================================
 * These functions handle assigning and removing user roles
 */

/**
 * High-level function to assign a role to a user
 * @param userId - The ID of the user to assign the role to
 * @param role - The role to assign
 * @returns Promise<boolean> - True if role was assigned successfully
 */
export async function assignRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("Authentication required", { description: "You must be logged in to assign roles" });
      return false;
    }
    
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to assign roles" });
      return false;
    }
    
    const { data, error } = await supabase.rpc('assign_user_role', {
      _user_id: userId,
      _role: role,
      _created_by: userData.user.id
    });
    
    if (error) {
      console.error('Error assigning role:', error);
      toast.error("Failed to assign role", { description: error.message });
      return false;
    }
    
    toast.success(`Role '${role}' assigned successfully`);
    return true;
  } catch (error) {
    console.error('Exception in assignRole:', error);
    toast.error("Failed to assign role", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return false;
  }
}

/**
 * High-level function to remove a role from a user
 * @param userId - The ID of the user to remove the role from
 * @param role - The role to remove
 * @returns Promise<boolean> - True if role was removed successfully
 */
export async function removeRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to remove roles" });
      return false;
    }
    
    const { data, error } = await supabase.rpc('remove_user_role', {
      _user_id: userId,
      _role: role
    });
    
    if (error) {
      console.error('Error removing role:', error);
      toast.error("Failed to remove role", { description: error.message });
      return false;
    }
    
    toast.success(`Role '${role}' removed successfully`);
    return !!data;
  } catch (error) {
    console.error('Exception in removeRole:', error);
    toast.error("Failed to remove role", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return false;
  }
}

/**
 * ==================================
 * USER DATA RETRIEVAL FUNCTIONS
 * ==================================
 * These functions handle retrieving user data for admin purposes
 */

/**
 * Get all user profiles for admin management
 * Uses Edge Function to avoid auth.admin.listUsers issues and RLS recursion
 * @returns Promise<UserProfile[]> - Array of user profiles
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const adminStatus = await isAdmin();
    console.log("Admin status check result:", adminStatus);
    
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to view users" });
      return [];
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }
    
    console.log("Calling edge function to get user roles with emails");
    const { data: userRolesData, error: userRolesError } = await withRetry<EdgeFunctionResponse>(
      () => supabase.functions.invoke('get-user-roles', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }),
      3,
      1000
    );
    
    if (userRolesError) {
      console.error('Error fetching user roles from edge function:', userRolesError);
      throw new Error(userRolesError.message || 'Failed to fetch user roles');
    }
    
    console.log("User roles data from edge function:", userRolesData);
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw new Error(profileError.message || 'Failed to fetch user profiles');
    }

    console.log("Fetched profiles:", profiles);

    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    console.log("Fetched subscriptions:", subscriptions);

    const userSubscriptionMap = new Map();
    
    if (subscriptions && Array.isArray(subscriptions)) {
      subscriptions.forEach(sub => {
        if (sub.user_id) {
          const existing = userSubscriptionMap.get(sub.user_id);
          if (!existing || new Date(sub.updated_at) > new Date(existing.updated_at)) {
            userSubscriptionMap.set(sub.user_id, sub);
          }
        }
      });
    }

    const userRolesMap = new Map<string, UserRole[]>();
    const userEmailMap = new Map<string, string>();
    
    if (userRolesData && Array.isArray(userRolesData)) {
      userRolesData.forEach((record: any) => {
        if (record.email) {
          userEmailMap.set(record.user_id, record.email);
        }
        
        const existing = userRolesMap.get(record.user_id) || [];
        if (record.role === 'admin' || record.role === 'beta_tester' || record.role === 'user') {
          existing.push(record.role as UserRole);
          userRolesMap.set(record.user_id, existing);
        }
      });
    }

    console.log("Processed user subscriptions:", Object.fromEntries(userSubscriptionMap));

    return profiles?.map(profile => {
      const roles = userRolesMap.get(profile.profile_id) || [];
      const subscription = userSubscriptionMap.get(profile.profile_id);
      const email = userEmailMap.get(profile.profile_id) || profile.username || '';
      
      return {
        userId: profile.profile_id,
        email: email,
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        businessName: profile.business_name || null,
        roles: roles,
        subscription: subscription ? {
          plan: subscription.plan_type,
          status: subscription.status
        } : null,
        createdAt: profile.created_at,
        lastSignIn: null
      };
    }) || [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    
    if (isNetworkError(error)) {
      toast.error("Network error", { 
        description: getNetworkErrorMessage(error)
      });
    } else {
      toast.error("Failed to fetch users", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    }
    
    return [];
  }
}

/**
 * ==================================
 * SUBSCRIPTION MANAGEMENT FUNCTIONS
 * ==================================
 * These functions handle updating user subscription plans
 */

/**
 * Update user subscription plan for a specific user
 * @param userId - The ID of the user to update the subscription for
 * @param plan - The subscription plan to set
 * @param status - The subscription status to set (default: 'active')
 * @returns Promise<boolean> - True if subscription was updated successfully
 */
export async function updateSubscriptionPlan(userId: string, plan: string, status: string = 'active'): Promise<boolean> {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to update subscriptions" });
      return false;
    }

    let projectLimit = 3;
    if (plan === 'pro') {
      projectLimit = 30;
    } else if (plan === 'starter') {
      projectLimit = 10;
    }

    const now = new Date().toISOString();

    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError);
      toast.error("Failed to fetch subscription", { description: fetchError.message });
      return false;
    }

    let result;
    
    if (existingSub) {
      console.log(`Updating existing subscription ${existingSub.subscription_id} for user ${userId} to plan ${plan} with status ${status}`);
      
      result = await supabase
        .from('subscriptions')
        .update({
          plan_type: plan,
          status: status,
          project_limit: projectLimit,
          updated_at: now
        })
        .eq('subscription_id', existingSub.subscription_id);
    } else {
      console.log(`Creating new subscription for user ${userId} with plan ${plan} and status ${status}`);
      
      result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: plan,
          status: status,
          project_limit: projectLimit,
          updated_at: now
        });
    }

    if (result.error) {
      console.error('Error updating/creating subscription:', result.error);
      toast.error("Failed to update subscription", { description: result.error.message });
      return false;
    }

    console.log("Subscription updated successfully:", result.data);
    toast.success("Subscription updated successfully");
    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionPlan:', error);
    
    if (isNetworkError(error)) {
      toast.error("Network error", { 
        description: getNetworkErrorMessage(error) 
      });
    } else {
      toast.error("Failed to update subscription", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    }
    
    return false;
  }
}

/**
 * Updates a user's subscription plan using their email address (admin only)
 * Uses an edge function to update subscription
 * @param email - Email of the user to update
 * @param plan - Subscription plan to set
 * @param status - Subscription status to set (default: 'active')
 * @returns Promise<boolean> - True if subscription was updated successfully
 */
export async function updateUserSubscription(email: string, plan: string, status: string = 'active'): Promise<boolean> {
  return withRateLimit(`update-subscription-${email}`, async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error('No access token available');
        throw new Error('Authentication required');
      }
      
      console.log(`Admin updating subscription for user ${email} to ${plan} plan with status ${status}`);
      
      const loadingId = toast.loading(`Updating subscription for ${email}...`);
      
      try {
        const { data, error } = await withRetry<EdgeFunctionResponse>(
          () => supabase.functions.invoke('admin-update-subscription', {
            body: { 
              email,
              plan,
              status
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }),
          2,
          2000
        );
        
        toast.dismiss(loadingId);
        
        if (error) {
          console.error("Error invoking edge function:", error);
          throw error;
        }
        
        console.log("Edge function response:", data);
        
        if (!data || !data.success) {
          const errorMsg = data?.error || "Unknown error occurred";
          console.error("Edge function returned error:", errorMsg);
          throw new Error(errorMsg);
        }
        
        toast.success(`Subscription updated to ${plan} plan with status ${status}`);
        return true;
      } catch (error) {
        toast.dismiss(loadingId);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserSubscription:', error);
      
      if (isNetworkError(error)) {
        toast.error("Network connection error", { 
          description: getNetworkErrorMessage(error),
          duration: 8000
        });
      } else {
        toast.error("Failed to update subscription", { 
          description: error instanceof Error ? error.message : "Unknown error" 
        });
      }
      
      return false;
    }
  });
}

/**
 * ==================================
 * USER ROLE MANAGEMENT FUNCTIONS
 * ==================================
 * These functions handle retrieving and managing user roles
 */

/**
 * Get roles for all users (admin only)
 * @returns Promise<UserRoleRecord[]> - Array of user role records
 */
export async function getUserRoles(): Promise<UserRoleRecord[]> {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to view user roles" });
      return [];
    }
    
    const { data, error } = await supabase.rpc('get_all_user_roles');
    
    if (error) {
      console.error('Error fetching user roles:', error);
      toast.error("Failed to fetch user roles", { description: error.message });
      return [];
    }
    
    // Fix the type issue by explicitly mapping to UserRoleRecord with UserRole type
    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      role: item.role as UserRole, // Explicitly cast the role to UserRole
      created_at: item.created_at,
      created_by: item.created_by,
      email: item.email || null
    }));
  } catch (error) {
    console.error('Exception in getUserRoles:', error);
    toast.error("Failed to fetch user roles", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return [];
  }
}

/**
 * Assign a role to a user by email (admin only)
 * @param email - Email of the user to assign the role to
 * @param role - Role to assign
 * @returns Promise<boolean> - True if role was assigned successfully
 */
export async function assignRoleByEmail(email: string, role: UserRole): Promise<boolean> {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to assign roles" });
      return false;
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }
    
    console.log(`Admin assigning ${role} role to user with email ${email}`);
    
    const { data: userData, error: userError } = await supabase.functions.invoke('get-user-by-email', {
      body: { email },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (userError) {
      console.error("Error getting user by email:", userError);
      throw userError;
    }
    
    if (!userData || !userData.user) {
      toast.error("User not found", { description: `No user found with email ${email}` });
      return false;
    }
    
    console.log("Found user:", userData.user);
    
    return await assignRole(userData.user.id, role);
  } catch (error) {
    console.error('Error in assignRoleByEmail:', error);
    
    if (isNetworkError(error)) {
      toast.error("Network error", { 
        description: getNetworkErrorMessage(error) 
      });
    } else {
      toast.error("Failed to assign role", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    }
    
    return false;
  }
}

/**
 * Delete a user account (admin only)
 * @param userId - The ID of the user to delete
 * @returns Promise<boolean> - True if the user was deleted successfully
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to delete user accounts" });
      return false;
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }
    
    console.log(`Admin deleting user account: ${userId}`);
    
    // Delete all user data from various tables
    try {
      // Delete user's subscriptions
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);
        
      if (subscriptionError) {
        console.error('Error deleting user subscriptions:', subscriptionError);
      }
      
      // Delete user's project documents
      const { error: documentsError } = await supabase
        .from('project_documents')
        .delete()
        .eq('user_id', userId);
        
      if (documentsError) {
        console.error('Error deleting user documents:', documentsError);
      }
      
      // Delete user's proposal sections
      const { error: sectionsError } = await supabase
        .from('proposal_sections')
        .delete()
        .eq('user_id', userId);
        
      if (sectionsError) {
        console.error('Error deleting user proposal sections:', sectionsError);
      }
      
      // Delete user's projects
      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', userId);
        
      if (projectsError) {
        console.error('Error deleting user projects:', projectsError);
      }
      
      // Delete user's knowledge entries
      const { error: entriesError } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('user_id', userId);
        
      if (entriesError) {
        console.error('Error deleting user knowledge entries:', entriesError);
      }
      
      // Delete user's roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (rolesError) {
        console.error('Error deleting user roles:', rolesError);
      }
      
      // Delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('profile_id', userId);
        
      if (profileError) {
        console.error('Error deleting user profile:', profileError);
      }
      
      // Finally, delete the user from auth.users using an edge function with admin privileges
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }, // This is the key fix - providing the userId in the correct format
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Error deleting user auth record:', error);
        throw error;
      }
      
      if (!data?.success) {
        console.error('Failed to delete user auth record:', data?.error);
        throw new Error(data?.error || 'Failed to delete user account');
      }
      
      toast.success("User account deleted successfully");
      return true;
    } catch (error) {
      console.error('Error in delete user operation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    
    if (isNetworkError(error)) {
      toast.error("Network error", { 
        description: getNetworkErrorMessage(error)
      });
    } else {
      toast.error("Failed to delete user account", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    }
    
    return false;
  }
}

// Add aliases for compatibility
export { getAllUsers as getUsers };
export { assignRole as assignUserRole };
export { removeRole as removeUserRole };

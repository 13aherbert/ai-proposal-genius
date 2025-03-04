
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile, UserRoleRecord, UserRole } from "./types";
import { isAdmin } from "./roleService";

/**
 * Get all user profiles for admin management
 * Uses Edge Function to avoid auth.admin.listUsers issues and RLS recursion
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    // First check if user is admin through RPC function
    const adminStatus = await isAdmin();
    console.log("Admin status check result:", adminStatus);
    
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to view users" });
      return [];
    }
    
    // Get profiles directly from the profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw new Error(profileError.message || 'Failed to fetch user profiles');
    }

    console.log("Fetched profiles:", profiles);

    // Get all user roles using our security definer function that avoids RLS recursion
    const { data: userRolesData, error: rolesError } = await supabase
      .rpc('get_all_user_roles');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      throw new Error(rolesError.message || 'Failed to fetch user roles');
    }

    const userRoles = userRolesData || [];
    console.log("Fetched user roles:", userRoles);

    // Get session for auth header
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }

    // Get all auth users for email data
    // Note: This will need admin access, which might be limited in certain environments
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    let userEmails: Record<string, string> = {};
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      // Continue without emails instead of failing
    } else if (authUsers && authUsers.users) {
      // Properly type the auth users data
      type AuthUser = {
        id: string;
        email?: string;
      };
      
      // Create a map of user IDs to emails
      authUsers.users.forEach((user: AuthUser) => {
        if (user.email) {
          userEmails[user.id] = user.email;
        }
      });
    }

    console.log("Processed auth users for emails");

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    console.log("Fetched subscriptions:", subscriptions);

    // Create a map of user IDs to roles
    const userRolesMap = new Map<string, UserRole[]>();
    
    if (userRoles && Array.isArray(userRoles)) {
      userRoles.forEach((record: UserRoleRecord) => {
        const existing = userRolesMap.get(record.user_id) || [];
        // Ensure we're adding a valid UserRole
        if (record.role === 'admin' || record.role === 'beta_tester' || record.role === 'user') {
          existing.push(record.role as UserRole);
          userRolesMap.set(record.user_id, existing);
        }
      });
    }

    console.log("Processed user roles map");

    // Map profiles to UserProfile format
    return profiles?.map(profile => {
      const roles = userRolesMap.get(profile.profile_id) || [];
      const subscription = subscriptions?.find(s => s.user_id === profile.profile_id);
      
      return {
        userId: profile.profile_id,
        email: userEmails[profile.profile_id] || profile.username || '',
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
    toast.error("Failed to fetch users", { description: error instanceof Error ? error.message : "Unknown error" });
    return [];
  }
}

/**
 * Update user subscription plan
 */
export async function updateSubscriptionPlan(userId: string, plan: string): Promise<boolean> {
  try {
    // Check admin using RPC
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to update subscriptions" });
      return false;
    }

    // Find existing subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError);
      toast.error("Failed to fetch subscription", { description: fetchError.message });
      return false;
    }

    // Determine project limit based on plan
    let projectLimit = 3; // Default for trial
    if (plan === 'pro') {
      projectLimit = 30;
    } else if (plan === 'starter') {
      projectLimit = 10;
    }

    if (currentSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: plan,
          project_limit: projectLimit,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', currentSub.subscription_id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        toast.error("Failed to update subscription", { description: updateError.message });
        return false;
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: plan,
          status: 'active',
          project_limit: projectLimit
        });

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        toast.error("Failed to create subscription", { description: insertError.message });
        return false;
      }
    }

    toast.success("Subscription updated successfully");
    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionPlan:', error);
    toast.error("Failed to update subscription", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

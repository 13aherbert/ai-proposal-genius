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
    
    // Get session for auth header
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }
    
    // Call our edge function to get user roles with email info
    console.log("Calling edge function to get user roles with emails");
    const { data: userRolesData, error: userRolesError } = await supabase.functions.invoke('get-user-roles', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (userRolesError) {
      console.error('Error fetching user roles from edge function:', userRolesError);
      throw new Error(userRolesError.message || 'Failed to fetch user roles');
    }
    
    console.log("User roles data from edge function:", userRolesData);
    
    // Get profiles directly from the profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw new Error(profileError.message || 'Failed to fetch user profiles');
    }

    console.log("Fetched profiles:", profiles);

    // Get all subscriptions - make sure we're getting the most up-to-date data
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    console.log("Fetched subscriptions:", subscriptions);

    // Create a map of user IDs to their most recent subscription
    const userSubscriptionMap = new Map();
    
    if (subscriptions && Array.isArray(subscriptions)) {
      subscriptions.forEach(sub => {
        // Only store the subscription if it's newer than what we already have
        const existing = userSubscriptionMap.get(sub.user_id);
        if (!existing || new Date(sub.updated_at) > new Date(existing.updated_at)) {
          userSubscriptionMap.set(sub.user_id, sub);
        }
      });
    }

    // Create a map of user IDs to roles
    const userRolesMap = new Map<string, UserRole[]>();
    const userEmailMap = new Map<string, string>();
    
    if (userRolesData && Array.isArray(userRolesData)) {
      userRolesData.forEach((record: any) => {
        // Store email information
        if (record.email) {
          userEmailMap.set(record.user_id, record.email);
        }
        
        // Store role information
        const existing = userRolesMap.get(record.user_id) || [];
        if (record.role === 'admin' || record.role === 'beta_tester' || record.role === 'user') {
          existing.push(record.role as UserRole);
          userRolesMap.set(record.user_id, existing);
        }
      });
    }

    console.log("Processed user subscriptions:", Object.fromEntries(userSubscriptionMap));

    // Map profiles to UserProfile format
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

    // Determine project limit based on plan
    let projectLimit = 3; // Default for trial
    if (plan === 'pro') {
      projectLimit = 30;
    } else if (plan === 'starter') {
      projectLimit = 10;
    }

    // Get the current timestamp for the updated_at field
    const now = new Date().toISOString();

    // Fetch the existing subscription to check if it exists
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
      // Update existing subscription
      console.log(`Updating existing subscription ${existingSub.subscription_id} for user ${userId} to plan ${plan}`);
      
      result = await supabase
        .from('subscriptions')
        .update({
          plan_type: plan,
          project_limit: projectLimit,
          updated_at: now
        })
        .eq('subscription_id', existingSub.subscription_id);
    } else {
      // Create new subscription
      console.log(`Creating new subscription for user ${userId} with plan ${plan}`);
      
      result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: plan,
          status: 'active',
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
    toast.error("Failed to update subscription", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

/**
 * Updates a user's subscription plan (admin only)
 */
export async function updateUserSubscription(email: string, plan: string, status: string = 'active'): Promise<boolean> {
  try {
    // Get session for auth header
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }
    
    console.log(`Admin updating subscription for user ${email} to ${plan} plan with status ${status}`);
    
    // Call our edge function to update the subscription
    const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
      body: { 
        email,
        plan,
        status
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
    
    console.log("Subscription update result:", data);
    
    if (!data.success) {
      throw new Error(data.error || "Unknown error");
    }
    
    toast.success(`Subscription updated to ${plan} plan with status ${status}`);
    return true;
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
    toast.error("Failed to update subscription", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

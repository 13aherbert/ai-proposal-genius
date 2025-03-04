
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

    // Get session for auth header
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }

    // Get user email data from auth table via our edge function
    const { data: userRolesData, error: rolesError } = await supabase.functions.invoke<UserRoleRecord[]>('get-user-roles', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      throw new Error(rolesError.message || 'Failed to fetch user roles');
    }

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    // Create a map of user IDs to roles and emails
    const userMap = new Map<string, { roles: UserRole[]; email: string | null }>();
    
    if (userRolesData) {
      userRolesData.forEach(record => {
        const existing = userMap.get(record.user_id) || { roles: [], email: null };
        existing.roles.push(record.role as UserRole);
        if (record.email) {
          existing.email = record.email;
        }
        userMap.set(record.user_id, existing);
      });
    }

    // Map profiles to UserProfile format
    return profiles?.map(profile => {
      const userData = userMap.get(profile.profile_id) || { roles: [], email: null };
      const subscription = subscriptions?.find(s => s.user_id === profile.profile_id);
      
      return {
        userId: profile.profile_id,
        email: userData.email || profile.username || '',
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        businessName: profile.business_name || null,
        roles: userData.roles,
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


import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserRole = 'user' | 'admin' | 'beta_tester';

export type UserRoleRecord = {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  created_by: string | null;
};

export type UserProfile = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  roles: UserRole[];
  subscription: {
    plan: string;
    status: string;
  } | null;
  createdAt: string;
  lastSignIn: string | null;
};

export type BetaInvitation = {
  id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
  invitation_email_sent: boolean;
};

class AdminService {
  /**
   * Check if the current user has a specific role
   */
  async checkUserRole(role: UserRole): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user || !user.user) return false;

      // Use the has_role function instead of direct query
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.user.id,
        _role: role
      });

      if (error) {
        console.error('Error checking role:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      return false;
    }
  }

  /**
   * Check if the current user is an admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      // Use the is_admin function instead of manually checking
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  /**
   * Get all user profiles for admin management
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
        toast.error("Access denied", { description: "You don't have permission to view users" });
        return [];
      }

      // Get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (authError || !authUsers) {
        console.error('Error fetching users:', authError);
        throw new Error(authError?.message || 'Failed to fetch users');
      }

      // Get all user roles - using custom query since we now have a user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Get all subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
      }

      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      // Map users to UserProfile format
      return authUsers.users.map(user => {
        // Find roles for this user
        const userRolesArray = userRoles?.filter(r => r.user_id === user.id) || [];
        const subscription = subscriptions?.find(s => s.user_id === user.id);
        const profile = profiles?.find(p => p.profile_id === user.id);

        return {
          userId: user.id,
          email: user.email || '',
          firstName: profile?.first_name || null,
          lastName: profile?.last_name || null,
          businessName: profile?.business_name || null,
          roles: userRolesArray.map(r => r.role as UserRole),
          subscription: subscription ? {
            plan: subscription.plan_type,
            status: subscription.status
          } : null,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        };
      });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      toast.error("Failed to fetch users", { description: error instanceof Error ? error.message : "Unknown error" });
      return [];
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
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
        .select('*')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (existingRole) {
        // Role already assigned
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
  async removeRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
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
   * Update user subscription plan
   */
  async updateSubscriptionPlan(userId: string, plan: string): Promise<boolean> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
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
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error is okay
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

  /**
   * Create a beta invitation
   */
  async createBetaInvitation(email: string, expirationDays = 7): Promise<BetaInvitation | null> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
        toast.error("Access denied", { description: "You don't have permission to create invitations" });
        return null;
      }

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        toast.error("Authentication error", { description: "You need to be logged in" });
        return null;
      }

      // Check if there's already a pending invitation for this email
      const { data: existingInvite, error: checkError } = await supabase
        .from('beta_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking invitations:', checkError);
        return null;
      }

      if (existingInvite) {
        toast.info("Invitation already exists", { description: "This email already has a pending invitation" });
        return existingInvite as BetaInvitation;
      }

      // Generate a unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Create the invitation
      const { data: invitation, error: insertError } = await supabase
        .from('beta_invitations')
        .insert({
          email: email,
          invite_code: inviteCode,
          invited_by: currentUser.user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating invitation:', insertError);
        toast.error("Failed to create invitation", { description: insertError.message });
        return null;
      }

      toast.success("Beta invitation created successfully");
      return invitation as BetaInvitation;
    } catch (error) {
      console.error('Error in createBetaInvitation:', error);
      toast.error("Failed to create invitation", { description: error instanceof Error ? error.message : "Unknown error" });
      return null;
    }
  }

  /**
   * Get all beta invitations
   */
  async getBetaInvitations(): Promise<BetaInvitation[]> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
        toast.error("Access denied", { description: "You don't have permission to view invitations" });
        return [];
      }

      const { data, error } = await supabase
        .from('beta_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw new Error(error.message);
      }

      return data as BetaInvitation[];
    } catch (error) {
      console.error('Error in getBetaInvitations:', error);
      toast.error("Failed to fetch invitations", { description: error instanceof Error ? error.message : "Unknown error" });
      return [];
    }
  }

  /**
   * Cancel a beta invitation
   */
  async cancelBetaInvitation(invitationId: string): Promise<boolean> {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (!isAdmin || adminError) {
        toast.error("Access denied", { description: "You don't have permission to cancel invitations" });
        return false;
      }

      const { error } = await supabase
        .from('beta_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error cancelling invitation:', error);
        toast.error("Failed to cancel invitation", { description: error.message });
        return false;
      }

      toast.success("Invitation cancelled successfully");
      return true;
    } catch (error) {
      console.error('Error in cancelBetaInvitation:', error);
      toast.error("Failed to cancel invitation", { description: error instanceof Error ? error.message : "Unknown error" });
      return false;
    }
  }

  /**
   * Verify a beta invitation
   */
  async verifyBetaInvitation(inviteCode: string): Promise<BetaInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('beta_invitations')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .single();

      if (error) {
        console.error('Error verifying invitation:', error);
        return null;
      }

      const invitation = data as BetaInvitation;
      
      // Check if the invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Update the invitation status to 'expired'
        await supabase
          .from('beta_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        
        return null;
      }

      return invitation;
    } catch (error) {
      console.error('Error in verifyBetaInvitation:', error);
      return null;
    }
  }

  /**
   * Accept a beta invitation
   */
  async acceptBetaInvitation(inviteCode: string): Promise<boolean> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        toast.error("Authentication error", { description: "You need to be logged in" });
        return false;
      }

      // Verify the invitation first
      const invitation = await this.verifyBetaInvitation(inviteCode);
      if (!invitation) {
        toast.error("Invalid or expired invitation");
        return false;
      }

      // Update the invitation status to 'accepted'
      const { error: updateError } = await supabase
        .from('beta_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        toast.error("Failed to accept invitation", { description: updateError.message });
        return false;
      }

      // Assign beta_tester role to the user
      const success = await this.assignRole(currentUser.user.id, 'beta_tester');
      if (!success) {
        return false;
      }

      // Mark beta onboarding as complete in localStorage
      localStorage.setItem('betaOnboardingComplete', 'true');
      
      toast.success("You are now a beta tester!");
      return true;
    } catch (error) {
      console.error('Error in acceptBetaInvitation:', error);
      toast.error("Failed to accept invitation", { description: error instanceof Error ? error.message : "Unknown error" });
      return false;
    }
  }
}

export const adminService = new AdminService();

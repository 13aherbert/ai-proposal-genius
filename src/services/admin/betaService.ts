
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BetaInvitation, UserRole } from "./types";
import { assignRole, isAdmin } from "./roleService";

/**
 * Create a beta invitation
 */
export async function createBetaInvitation(email: string, expirationDays = 7): Promise<BetaInvitation | null> {
  try {
    // Check admin using RPC
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to create invitations" });
      return null;
    }

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      toast.error("Authentication error", { description: "You need to be logged in" });
      return null;
    }

    // Check if there's already a pending invitation for this email - use edge function
    const { data: existingInvitations, error: checkError } = await supabase.functions.invoke('get-pending-invitation', {
      method: 'POST',
      body: { email }
    });
      
    if (checkError) {
      console.error('Error checking invitations:', checkError);
      return null;
    }

    // If we have existing invitations, return the first one
    if (existingInvitations && existingInvitations.length > 0) {
      toast.info("Invitation already exists", { description: "This email already has a pending invitation" });
      return existingInvitations[0] as BetaInvitation;
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
export async function getBetaInvitations(): Promise<BetaInvitation[]> {
  try {
    // First check if user is admin using the security definer function
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      toast.error("Access denied", { description: "You don't have permission to view invitations" });
      return [];
    }

    // Get session for auth header
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Authentication required');
    }

    // Use Edge Function to get all invitations to avoid recursion issues
    const { data, error } = await supabase.functions.invoke('get-beta-invitations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

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
export async function cancelBetaInvitation(invitationId: string): Promise<boolean> {
  try {
    // First check if user is admin
    const adminStatus = await isAdmin();
    if (!adminStatus) {
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
export async function verifyBetaInvitation(inviteCode: string): Promise<BetaInvitation | null> {
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
export async function acceptBetaInvitation(inviteCode: string): Promise<boolean> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      toast.error("Authentication error", { description: "You need to be logged in" });
      return false;
    }

    // Verify the invitation first
    const invitation = await verifyBetaInvitation(inviteCode);
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
    const success = await assignRole(currentUser.user.id, 'beta_tester');
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

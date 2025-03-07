
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BetaInvitation } from "./types";
import { emailService } from "../EmailService";

/**
 * Get all beta invitations
 * Uses Edge Function to bypass RLS
 */
export async function getBetaInvitations(): Promise<BetaInvitation[]> {
  try {
    // Get current access token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      toast.error("Authentication required", { description: "Please log in to access beta invitations" });
      return [];
    }

    // Call the edge function with the access token
    const { data, error } = await supabase.functions.invoke("get-beta-invitations", {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });

    if (error) {
      console.error('Error fetching beta invitations:', error);
      throw new Error(error.message || 'Failed to fetch beta invitations');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBetaInvitations:', error);
    toast.error("Failed to fetch beta invitations", { description: error instanceof Error ? error.message : "Unknown error" });
    return [];
  }
}

/**
 * Create a new beta invitation
 */
export async function createBetaInvitation(email: string): Promise<boolean> {
  try {
    // Check if the user is authenticated
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      toast.error("Authentication error", { description: "Could not verify your identity" });
      return false;
    }
    
    // First check if invitation already exists using the security definer function
    const { data: pendingInvitations, error: checkError } = await supabase.rpc<BetaInvitation[]>(
      'check_pending_invitation',
      { email_param: email }
    );
    
    if (checkError) {
      console.error('Error checking pending invitations:', checkError);
      toast.error("Failed to check existing invitations", { description: checkError.message });
      return false;
    }
    
    if (pendingInvitations && pendingInvitations.length > 0) {
      toast.info("Invitation already exists", { description: `An invitation for ${email} is already active` });
      return false;
    }
    
    // Create the invitation using the security definer function
    const { data: inviteId, error: createError } = await supabase.rpc<string>(
      'invite_beta_tester',
      { 
        email_param: email,
        inviter_id: userData.user.id
      }
    );
    
    if (createError) {
      console.error('Error creating beta invitation:', createError);
      toast.error("Failed to create invitation", { description: createError.message });
      return false;
    }
    
    if (!inviteId) {
      toast.error("Failed to create invitation", { description: "No invitation ID returned" });
      return false;
    }
    
    // Get the invitation details to send the email
    const { data: invitationDetails, error: detailsError } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('id', inviteId)
      .single();
      
    if (detailsError || !invitationDetails) {
      console.error('Error retrieving invitation details:', detailsError);
      toast.warning("Invitation created but could not retrieve details", { 
        description: "The email could not be sent automatically" 
      });
      return true; // Return true since the invitation was created
    }

    // Send invitation email
    const emailResult = await emailService.sendBetaInviteEmail(
      email,
      invitationDetails.invite_code,
      invitationDetails.expires_at
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      toast.warning("Invitation created but email could not be sent", { 
        description: "The user will need the invitation link manually" 
      });
    } else {
      // Update invitation to mark email as sent
      await supabase
        .from('beta_invitations')
        .update({ invitation_email_sent: true })
        .eq('id', inviteId);
    }

    toast.success("Invitation created successfully");
    return true;
  } catch (error) {
    console.error('Error in createBetaInvitation:', error);
    toast.error("Failed to create invitation", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

/**
 * Cancel a beta invitation
 */
export async function cancelBetaInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('beta_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error canceling beta invitation:', error);
      toast.error("Failed to cancel invitation", { description: error.message });
      return false;
    }

    toast.success("Invitation canceled successfully");
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
export async function verifyBetaInvitation(code: string): Promise<BetaInvitation | null> {
  try {
    const { data, error } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('invite_code', code)
      .eq('status', 'pending')
      .single();

    if (error || !data) {
      console.error('Error verifying beta invitation:', error);
      return null;
    }

    // Check if invitation has expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // Mark as expired
      await supabase
        .from('beta_invitations')
        .update({ status: 'expired' })
        .eq('id', data.id);
      return null;
    }

    return data as BetaInvitation;
  } catch (error) {
    console.error('Error in verifyBetaInvitation:', error);
    return null;
  }
}

/**
 * Accept a beta invitation and assign beta_tester role to the user
 */
export async function acceptBetaInvitation(code: string): Promise<boolean> {
  try {
    // First verify the invitation
    const invitation = await verifyBetaInvitation(code);
    if (!invitation) {
      return false;
    }

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      toast.error("Authentication error", { description: "Could not verify your identity" });
      return false;
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('beta_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating beta invitation status:', updateError);
      return false;
    }

    // Add beta_tester role to user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'beta_tester',
        created_by: invitation.invited_by
      });

    if (roleError) {
      console.error('Error assigning beta_tester role:', roleError);
      return false;
    }

    toast.success("You have joined the beta program!");
    return true;
  } catch (error) {
    console.error('Error in acceptBetaInvitation:', error);
    toast.error("Failed to join beta program", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

/**
 * Generate a random invitation code
 */
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

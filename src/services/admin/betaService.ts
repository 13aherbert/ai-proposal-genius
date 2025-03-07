
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BetaInvitation } from "./types";
import { checkPendingInvitation, createInvitation, verifyInvitationCode } from "./beta/betaUtils";
import { sendInvitationEmail } from "./beta/betaEmailService";

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
    
    // Check if invitation already exists
    const pendingInvitations = await checkPendingInvitation(email);
    
    if (!pendingInvitations) {
      return false;
    }
    
    if (pendingInvitations.length > 0) {
      toast.info("Invitation already exists", { description: `An invitation for ${email} is already active` });
      return false;
    }
    
    // Create the invitation
    const inviteId = await createInvitation(email, userData.user.id);
    
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
    await sendInvitationEmail(
      email,
      inviteId,
      invitationDetails.invite_code,
      invitationDetails.expires_at
    );

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
  return await verifyInvitationCode(code);
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

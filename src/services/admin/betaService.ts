
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BetaInvitation } from "./types";
import { 
  checkPendingInvitation, 
  createInvitation, 
  verifyInvitationCode,
  updateInvitationStatus
} from "./beta/betaUtils";
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
    console.log(`Starting beta invitation process for ${email}`);
    
    // Check if the user is authenticated
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('Authentication error:', userError);
      toast.error("Authentication error", { description: "Could not verify your identity" });
      return false;
    }
    
    console.log(`User authenticated: ${userData.user.id}`);
    
    // Check if invitation already exists
    const pendingInvitations = await checkPendingInvitation(email);
    
    // If the check failed, show an error and return
    if (pendingInvitations === null) {
      console.error('Failed to check for existing invitations');
      toast.error("Error checking for existing invitations", { description: "Please try again later" });
      return false;
    }
    
    if (pendingInvitations.length > 0) {
      console.log(`Found existing invitation for ${email}:`, pendingInvitations);
      
      // Ask user if they want to resend the invitation
      if (confirm(`An invitation for ${email} already exists. Would you like to resend it?`)) {
        const existingInvitation = pendingInvitations[0];
        
        // Send invitation email directly with existing invitation details
        const emailSent = await sendInvitationEmail(
          email,
          existingInvitation.id,
          existingInvitation.invite_code,
          existingInvitation.expires_at
        );
        
        if (emailSent) {
          console.log(`Successfully resent invitation email to ${email}`);
          toast.success("Invitation email resent successfully");
          return true;
        } else {
          console.log(`Failed to resend invitation email to ${email}`);
          toast.error("Failed to resend invitation email", {
            description: "Please try again later"
          });
          return false;
        }
      } else {
        // User chose not to resend
        toast.info("Invitation already exists", { description: `An invitation for ${email} is already active` });
        return false;
      }
    }
    
    console.log(`No existing invitations found for ${email}, creating new invitation`);
    
    // Create the invitation
    const inviteId = await createInvitation(email, userData.user.id);
    
    if (!inviteId) {
      console.error('Failed to create invitation, no ID returned');
      toast.error("Failed to create invitation", { description: "No invitation ID returned" });
      return false;
    }
    
    console.log(`Invitation created with ID: ${inviteId}, fetching details`);
    
    // Get the invitation details directly from the database
    try {
      const { data: invitationData, error: invitationError } = await supabase
        .from('beta_invitations')
        .select('*')
        .eq('id', inviteId)
        .single();
      
      if (invitationError || !invitationData) {
        console.error('Error retrieving invitation details:', invitationError);
        toast.warning("Invitation created but could not retrieve details", { 
          description: "The email could not be sent automatically" 
        });
        return true; // Return true since the invitation was created
      }

      console.log('Retrieved invitation details:', invitationData);

      // Send invitation email
      const emailSent = await sendInvitationEmail(
        email,
        inviteId,
        invitationData.invite_code,
        invitationData.expires_at
      );

      if (emailSent) {
        console.log(`Successfully sent invitation email to ${email}`);
        toast.success("Invitation created and email sent successfully");
      } else {
        console.log(`Invitation created but email could not be sent to ${email}`);
        toast.warning("Invitation created but email could not be sent", {
          description: "You may need to manually share the invitation link"
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error retrieving invitation details:', error);
      toast.warning("Invitation created but could not retrieve details", { 
        description: "The email could not be sent automatically" 
      });
      return true; // Return true since the invitation was created
    }
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
      toast.error("Invalid or expired invitation code");
      return false;
    }

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      toast.error("Authentication error", { description: "Could not verify your identity" });
      return false;
    }

    // Update invitation status using RPC function to avoid RLS issues
    const statusUpdated = await updateInvitationStatus(
      invitation.id, 
      'accepted', 
      new Date().toISOString()
    );

    if (!statusUpdated) {
      console.error('Error updating beta invitation status');
      toast.error("Failed to update invitation status");
      // Continue anyway to try adding the role
    }

    // Add beta_tester role to user using RPC function to avoid RLS issues
    const { data: roleData, error: roleError } = await supabase.rpc(
      'assign_user_role',
      {
        _user_id: userData.user.id,
        _role: 'beta_tester',
        _created_by: invitation.invited_by || userData.user.id
      }
    );

    if (roleError) {
      console.error('Error assigning beta_tester role:', roleError);
      toast.error("Failed to assign beta tester role");
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
 * Resend invitation email for an existing invitation
 */
export async function resendInvitationEmail(invitationId: string): Promise<boolean> {
  try {
    // Use the security definer function to retrieve invitation details
    // This avoids the RLS recursion issue by bypassing the policies
    const { data, error } = await supabase.rpc(
      'get_beta_invitation_direct',
      { invitation_id_param: invitationId }
    );
      
    if (error || !data || data.length === 0) {
      console.error('Error retrieving invitation details:', error);
      toast.error("Failed to retrieve invitation details", { 
        description: error?.message || "Could not find invitation" 
      });
      return false;
    }
    
    const invitation = data[0] as BetaInvitation;
    
    // Send invitation email
    const emailSent = await sendInvitationEmail(
      invitation.email,
      invitation.id,
      invitation.invite_code,
      invitation.expires_at
    );
    
    if (emailSent) {
      toast.success("Invitation email resent successfully");
      return true;
    } else {
      toast.error("Failed to resend invitation email");
      return false;
    }
  } catch (error) {
    console.error('Error in resendInvitationEmail:', error);
    toast.error("Failed to resend invitation email", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return false;
  }
}

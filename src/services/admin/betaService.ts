
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BetaInvitation } from "./types";

// Verify a beta invitation code
export async function verifyBetaInvitation(code: string): Promise<BetaInvitation | null> {
  try {
    console.log(`Verifying beta invitation code: ${code}`);
    
    const { data, error } = await supabase.functions.invoke("verify-beta-invitation", {
      body: { code }
    });
    
    if (error) {
      console.error("Error verifying beta invitation:", error);
      return null;
    }
    
    if (!data || data.error) {
      console.log("Invalid or expired invitation:", data?.error || "No data returned");
      return null;
    }
    
    console.log("Invitation verified:", data);
    return data as BetaInvitation;
  } catch (error) {
    console.error("Error in verifyBetaInvitation:", error);
    return null;
  }
}

// Update the status of a beta invitation
export async function updateInvitationStatus(
  invitationId: string,
  status: 'pending' | 'accepted' | 'expired' | 'canceled',
  acceptedAt?: string
): Promise<boolean> {
  try {
    console.log(`Updating invitation ${invitationId} status to ${status}`);
    
    const { data, error } = await supabase.functions.invoke("verify-beta-invitation", {
      body: { 
        action: 'update',
        id: invitationId,
        status,
        acceptedAt
      }
    });
    
    if (error) {
      console.error("Error updating invitation status:", error);
      return false;
    }
    
    if (!data || !data.success) {
      console.error("Failed to update invitation status:", data?.error || "Unknown error");
      return false;
    }
    
    console.log("Invitation status updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateInvitationStatus:", error);
    return false;
  }
}

/**
 * Accept a beta invitation and assign beta_tester role to the user
 */
export async function acceptBetaInvitation(code: string): Promise<boolean> {
  try {
    console.log(`Accepting beta invitation with code: ${code}`);
    
    // First verify the invitation
    const invitation = await verifyBetaInvitation(code);
    if (!invitation) {
      toast.error("Invalid or expired invitation code");
      return false;
    }

    console.log(`Invitation verified:`, invitation);

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      toast.error("Authentication error", { description: "Could not verify your identity" });
      return false;
    }

    console.log(`User authenticated: ${userData.user.id}`);

    // Update invitation status using the edge function
    const currentTime = new Date().toISOString();
    const statusUpdated = await updateInvitationStatus(
      invitation.id, 
      'accepted', 
      currentTime
    );

    if (!statusUpdated) {
      console.error('Error updating beta invitation status');
      // Continue anyway to try adding the role
    } else {
      console.log(`Invitation status updated successfully`);
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

    console.log(`Beta tester role assigned successfully`);
    toast.success("You have joined the beta program!");
    return true;
  } catch (error) {
    console.error('Error in acceptBetaInvitation:', error);
    toast.error("Failed to join beta program", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}

// Get all beta invitations
export async function getBetaInvitations(): Promise<BetaInvitation[]> {
  try {
    const { data, error } = await supabase.functions.invoke("get-beta-invitations");
    
    if (error) {
      console.error("Error fetching beta invitations:", error);
      toast.error("Failed to load beta invitations");
      return [];
    }
    
    return data as BetaInvitation[];
  } catch (error) {
    console.error("Error in getBetaInvitations:", error);
    toast.error("Failed to load beta invitations");
    return [];
  }
}

// Create a new beta invitation
export async function createBetaInvitation(email: string, expiresInDays = 7): Promise<BetaInvitation | null> {
  try {
    const { data, error } = await supabase.rpc(
      'create_beta_invitation',
      {
        email_param: email,
        expires_in_days: expiresInDays
      }
    );
    
    if (error) {
      console.error("Error creating beta invitation:", error);
      toast.error("Failed to create beta invitation");
      return null;
    }
    
    toast.success("Beta invitation created successfully");
    return data as BetaInvitation;
  } catch (error) {
    console.error("Error in createBetaInvitation:", error);
    toast.error("Failed to create beta invitation");
    return null;
  }
}

// Cancel a beta invitation
export async function cancelBetaInvitation(invitationId: string): Promise<boolean> {
  try {
    const statusUpdated = await updateInvitationStatus(invitationId, 'canceled');
    
    if (statusUpdated) {
      toast.success("Beta invitation canceled");
      return true;
    } else {
      toast.error("Failed to cancel beta invitation");
      return false;
    }
  } catch (error) {
    console.error("Error in cancelBetaInvitation:", error);
    toast.error("Failed to cancel beta invitation");
    return false;
  }
}

// Resend an invitation email
export async function resendInvitationEmail(invitationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(
      'resend_beta_invitation',
      { invitation_id_param: invitationId }
    );
    
    if (error) {
      console.error("Error resending beta invitation:", error);
      toast.error("Failed to resend invitation");
      return false;
    }
    
    toast.success("Invitation email resent successfully");
    return true;
  } catch (error) {
    console.error("Error in resendInvitationEmail:", error);
    toast.error("Failed to resend invitation");
    return false;
  }
}

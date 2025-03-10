
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
    let roleAssignmentAttempts = 0;
    const maxAttempts = 3;
    let roleAssigned = false;
    
    while (roleAssignmentAttempts < maxAttempts && !roleAssigned) {
      roleAssignmentAttempts++;
      console.log(`Attempt ${roleAssignmentAttempts} to assign beta_tester role`);
      
      const { data: roleData, error: roleError } = await supabase.rpc(
        'assign_user_role',
        {
          _user_id: userData.user.id,
          _role: 'beta_tester',
          _created_by: invitation.invited_by || userData.user.id
        }
      );

      if (roleError) {
        console.error(`Attempt ${roleAssignmentAttempts} error assigning beta_tester role:`, roleError);
        // Wait a short time before retrying
        if (roleAssignmentAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500 * roleAssignmentAttempts));
        }
      } else {
        console.log(`Beta tester role assigned successfully on attempt ${roleAssignmentAttempts}`);
        roleAssigned = true;
      }
    }
    
    if (!roleAssigned) {
      toast.error("Failed to assign beta tester role");
      console.error(`Failed to assign beta_tester role after ${maxAttempts} attempts`);
    }
    
    // Force a role check to update the user's roles in the application state
    try {
      // Make a direct call to check if the role was actually assigned
      const { data: roleCheckData, error: roleCheckError } = await supabase.rpc(
        'check_beta_tester_role',
        { user_id_param: userData.user.id }
      );
      
      console.log('Role check result:', roleCheckData, roleCheckError);
      
      if (!roleCheckData && !roleCheckError) {
        // If role check says role wasn't assigned, try one more manual assignment
        console.log('Role not detected after assignment, trying one final direct assignment...');
        
        const { data: finalAttemptData, error: finalAttemptError } = await supabase.rpc(
          'assign_user_role',
          {
            _user_id: userData.user.id,
            _role: 'beta_tester',
            _created_by: invitation.invited_by || userData.user.id
          }
        );
        
        console.log('Final assignment attempt result:', finalAttemptData, finalAttemptError);
        
        // Verify one more time if it was successful
        const { data: finalCheckData } = await supabase.rpc(
          'check_beta_tester_role',
          { user_id_param: userData.user.id }
        );
        
        console.log('Final role check result:', finalCheckData);
        
        // If the final attempt succeeded, update roleAssigned
        if (finalCheckData) {
          roleAssigned = true;
        }
      }
    } catch (roleCheckError) {
      console.error('Error during final role verification:', roleCheckError);
    }
    
    if (roleAssigned) {
      toast.success("You have joined the beta program!");
      return true;
    } else {
      // If all attempts failed, give appropriate message
      toast.error("Partial success", { 
        description: "Your invitation was accepted but there may be a delay in activating your beta access. Please try refreshing the page in a few moments."
      });
      return false;
    }
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
    // Instead of using rpc, let's use edge function to create beta invitations
    const { data, error } = await supabase.functions.invoke("create-beta-invitation", {
      body: {
        email,
        expiresInDays
      }
    });
    
    if (error) {
      console.error("Error creating beta invitation:", error);
      toast.error("Failed to create beta invitation");
      return null;
    }
    
    if (!data) {
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
    // Instead of using rpc, let's use edge function to resend invitation emails
    const { data, error } = await supabase.functions.invoke("resend-beta-invitation", {
      body: { invitationId }
    });
    
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


import { supabase } from "@/integrations/supabase/client";
import { BetaInvitation } from "../types";
import { toast } from "sonner";

/**
 * Check if a pending invitation exists for the given email
 */
export async function checkPendingInvitation(email: string): Promise<BetaInvitation[] | null> {
  try {
    // Use the dedicated RPC function to check pending invitations
    const { data, error } = await supabase.rpc(
      'check_pending_invitation',
      { email_param: email }
    );
    
    if (error) {
      console.error('Error checking pending invitations:', error);
      toast.error("Failed to check existing invitations", { description: error.message });
      return null;
    }
    
    return data as BetaInvitation[];
  } catch (error) {
    console.error('Error in checkPendingInvitation:', error);
    return null;
  }
}

/**
 * Create a new invitation in the database
 */
export async function createInvitation(
  email: string, 
  userId: string
): Promise<string | null> {
  try {
    // Use the RPC function to create a beta invitation
    const { data, error } = await supabase.rpc(
      'invite_beta_tester',
      { 
        email_param: email,
        inviter_id: userId
      }
    );
    
    if (error) {
      console.error('Error creating beta invitation:', error);
      toast.error("Failed to create invitation", { description: error.message });
      return null;
    }
    
    return data as string;
  } catch (error) {
    console.error('Error in createInvitation:', error);
    return null;
  }
}

/**
 * Verify if a beta invitation is valid and not expired
 */
export async function verifyInvitationCode(code: string): Promise<BetaInvitation | null> {
  try {
    // Call the edge function instead of direct table access
    const { data, error } = await supabase.functions.invoke(
      'verify-beta-invitation',
      {
        body: { code }
      }
    );

    if (error) {
      console.error('Error verifying beta invitation:', error);
      toast.error("Invalid or expired invitation code");
      return null;
    }

    if (!data) {
      console.error('No data returned from verify-beta-invitation function');
      toast.error("Invalid or expired invitation code");
      return null;
    }

    // Return the verified invitation
    return data as BetaInvitation;
  } catch (error) {
    console.error('Error in verifyInvitationCode:', error);
    toast.error("Failed to verify invitation code");
    return null;
  }
}

/**
 * Retrieve a beta invitation by its ID using a direct function
 * This avoids RLS recursion issues
 */
export async function getBetaInvitationById(invitationId: string): Promise<BetaInvitation | null> {
  try {
    // Use the RPC function to get invitation details
    const { data, error } = await supabase.rpc(
      'get_beta_invitation_direct',
      { invitation_id_param: invitationId }
    );
    
    if (error) {
      console.error('Error retrieving beta invitation:', error);
      toast.error("Failed to retrieve invitation details", { description: error.message });
      return null;
    }
    
    return Array.isArray(data) && data.length > 0 ? data[0] as BetaInvitation : null;
  } catch (error) {
    console.error('Error in getBetaInvitationById:', error);
    return null;
  }
}

/**
 * Update beta invitation status
 */
export async function updateInvitationStatus(
  invitationId: string, 
  status: 'pending' | 'accepted' | 'expired',
  acceptedAt?: string
): Promise<boolean> {
  try {
    console.log(`Updating invitation ${invitationId} to status ${status}`, { acceptedAt });
    
    // Call the edge function to update the invitation status
    const { data, error } = await supabase.functions.invoke(
      'verify-beta-invitation',
      {
        body: { 
          action: 'update',
          id: invitationId,
          status,
          acceptedAt: acceptedAt || new Date().toISOString()
        }
      }
    );
    
    if (error) {
      console.error('Error updating invitation status:', error);
      return false;
    }
    
    if (!data || !data.success) {
      console.error('Failed to update invitation status:', data);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateInvitationStatus:', error);
    return false;
  }
}

/**
 * Generate a random invitation code
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

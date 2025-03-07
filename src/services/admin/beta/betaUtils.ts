
import { supabase } from "@/integrations/supabase/client";
import { BetaInvitation } from "../types";
import { toast } from "sonner";

/**
 * Check if a pending invitation exists for the given email
 */
export async function checkPendingInvitation(email: string): Promise<BetaInvitation[] | null> {
  try {
    const { data, error } = await supabase.rpc<BetaInvitation[]>(
      'check_pending_invitation',
      { email_param: email }
    );
    
    if (error) {
      console.error('Error checking pending invitations:', error);
      toast.error("Failed to check existing invitations", { description: error.message });
      return null;
    }
    
    return data;
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
    const { data, error } = await supabase.rpc<string>(
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
    
    return data;
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
    console.error('Error in verifyInvitationCode:', error);
    return null;
  }
}

/**
 * Generate a random invitation code
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

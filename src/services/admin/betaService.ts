
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BetaInvitation } from "./types";

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
    // Get current access token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      toast.error("Authentication required", { description: "Please log in to create beta invitations" });
      return false;
    }

    // Check if invitation already exists
    const { data } = await supabase.functions.invoke("get-pending-invitation", {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      },
      body: { email }
    });

    if (data && data.length > 0) {
      toast.info("Invitation already exists", { description: `An invitation for ${email} is already active` });
      return false;
    }

    // Create invitation code
    const inviteCode = generateInviteCode();
    
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert new invitation
    const { error } = await supabase
      .from('beta_invitations')
      .insert({
        email,
        invite_code: inviteCode,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Error creating beta invitation:', error);
      toast.error("Failed to create invitation", { description: error.message });
      return false;
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
 * Generate a random invitation code
 */
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

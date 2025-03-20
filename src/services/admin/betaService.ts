
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BetaInvitation } from "../admin/types";

// Add beta_requests functions with the existing beta invitation ones
export async function getBetaInvitations(): Promise<BetaInvitation[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-beta-invitations');
    
    if (error) throw error;
    
    return data as BetaInvitation[];
  } catch (error) {
    console.error("Error fetching beta invitations:", error);
    throw error;
  }
}

export async function createBetaInvitation(email: string, expiresInDays?: number): Promise<BetaInvitation> {
  try {
    const { data, error } = await supabase.functions.invoke('create-beta-invitation', {
      body: { email, expiresInDays }
    });
    
    if (error) throw error;
    
    return data as BetaInvitation;
  } catch (error) {
    console.error("Error creating beta invitation:", error);
    throw error;
  }
}

export async function cancelBetaInvitation(invitationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-beta-invitation', {
      body: { invitationId }
    });
    
    if (error) throw error;
    
    return data.success as boolean;
  } catch (error) {
    console.error("Error cancelling beta invitation:", error);
    throw error;
  }
}

export async function verifyBetaInvitation(inviteCode: string): Promise<BetaInvitation | null> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-beta-invitation', {
      body: { inviteCode }
    });
    
    if (error) throw error;
    
    return data as BetaInvitation;
  } catch (error) {
    console.error("Error verifying beta invitation:", error);
    return null;
  }
}

export async function acceptBetaInvitation(invitationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('accept-beta-invitation', {
      body: { invitationId }
    });
    
    if (error) throw error;
    
    return data.success as boolean;
  } catch (error) {
    console.error("Error accepting beta invitation:", error);
    throw error;
  }
}

export async function resendInvitationEmail(invitationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('resend-beta-invitation', {
      body: { invitationId }
    });
    
    if (error) throw error;
    
    return data.success as boolean;
  } catch (error) {
    console.error("Error resending invitation email:", error);
    throw error;
  }
}

// New functions for beta request management
export async function getBetaRequests() {
  try {
    const { data, error } = await supabase
      .from('beta_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error fetching beta requests:", error);
    throw error;
  }
}

interface ProcessRequestParams {
  requestId: string;
  approved: boolean;
  notes: string | null;
  processedBy: string;
}

export async function processBetaRequest({ requestId, approved, notes, processedBy }: ProcessRequestParams) {
  try {
    const { data, error } = await supabase
      .from('beta_requests')
      .update({
        status: approved ? 'approved' : 'rejected',
        notes: notes,
        processed_at: new Date().toISOString(),
        processed_by: processedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error processing beta request:", error);
    throw error;
  }
}

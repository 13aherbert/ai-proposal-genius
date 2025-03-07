
import { emailService } from "../../EmailService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Send an invitation email and update the invitation record
 */
export async function sendInvitationEmail(
  email: string,
  invitationId: string,
  inviteCode: string,
  expiresAt: string
): Promise<boolean> {
  try {
    // Send invitation email
    const emailResult = await emailService.sendBetaInviteEmail(
      email,
      inviteCode,
      expiresAt
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      toast.warning("Invitation created but email could not be sent", { 
        description: "The user will need the invitation link manually" 
      });
      return false;
    } 
    
    // Update invitation to mark email as sent
    const { error: updateError } = await supabase
      .from('beta_invitations')
      .update({ invitation_email_sent: true })
      .eq('id', invitationId);
      
    if (updateError) {
      console.error('Failed to update invitation email status:', updateError);
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    return false;
  }
}

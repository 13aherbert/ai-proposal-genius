
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emailService } from "@/services/EmailService";

/**
 * Send an invitation email to a beta tester
 * 
 * @param email Recipient email address
 * @param invitationId The UUID of the invitation 
 * @param inviteCode The invitation code
 * @param expiresAt The expiration date of the invitation
 * @returns boolean indicating if the email was sent successfully
 */
export async function sendInvitationEmail(
  email: string,
  invitationId: string,
  inviteCode: string,
  expiresAt: string
): Promise<boolean> {
  try {
    // Get the base URL for the invitation link
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/beta?invite=${inviteCode}`;
    
    // Use the general email service instead of direct edge function call
    // This avoids the RLS recursion by using a more general approach
    const { success, error } = await emailService.sendBetaInviteEmail(
      email,
      inviteCode,
      expiresAt
    );
    
    if (!success) {
      console.error('Error sending beta invitation email:', error);
      toast.error("Failed to send invitation email", { 
        description: error || "Please try again later" 
      });
      return false;
    }
    
    console.log('Beta invitation email sent successfully');
    
    // Update the invitation record without using functions that could trigger recursion
    try {
      const { error: updateError } = await supabase
        .from('beta_invitations')
        .update({ invitation_email_sent: true })
        .eq('id', invitationId);
      
      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        toast.warning("Email sent but couldn't update invitation record", {
          description: "The recipient will still receive the invitation"
        });
        // Still return true since the email was sent
        return true;
      }
    } catch (updateErr) {
      console.error('Error in invitation update:', updateErr);
      toast.warning("Email sent but couldn't update invitation record", {
        description: "The recipient will still receive the invitation"
      });
      // Still return true since the email was sent
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    toast.error("Failed to send invitation email", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return false;
  }
}

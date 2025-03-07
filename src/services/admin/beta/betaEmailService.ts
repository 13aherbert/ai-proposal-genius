
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emailService } from "@/services/EmailService";
import { withRateLimit } from "@/utils/network/rate-limit";

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
    
    console.log("Sending beta invitation email", {
      email,
      inviteCode,
      inviteUrl,
      expiresAt,
      invitationId
    });
    
    // Use rate limiting for email sending to prevent duplicates
    return await withRateLimit(`email:${email}`, async () => {
      // Use the general email service instead of direct edge function call
      const { success, error } = await emailService.sendBetaInviteEmail(
        email,
        inviteCode,
        inviteUrl,
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
      
      // Use the security definer function to update the invitation status
      try {
        const { data, error: updateError } = await supabase.rpc(
          'update_beta_invitation_email_sent',
          { 
            invitation_id_param: invitationId,
            sent_status: true
          }
        );
        
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
    });
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    toast.error("Failed to send invitation email", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return false;
  }
}

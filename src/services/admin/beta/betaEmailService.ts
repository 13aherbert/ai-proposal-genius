
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    
    // Get current access token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      toast.error("Authentication required", { description: "Please log in to send invitation emails" });
      return false;
    }
    
    // Call the edge function to send the email
    const { data, error } = await supabase.functions.invoke("send-email", {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      },
      body: {
        to: [email],
        subject: "You're Invited to the OptiRFP Beta Program!",
        templateType: "beta_invite",
        templateData: {
          inviteCode,
          inviteUrl,
          expiresAt
        }
      }
    });
    
    if (error) {
      console.error('Error sending beta invitation email:', error);
      toast.error("Failed to send invitation email", { 
        description: error.message || "Please try again later" 
      });
      return false;
    }
    
    console.log('Beta invitation email sent successfully:', data);
    
    // Update the invitation record to mark email as sent
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
    
    return true;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    toast.error("Failed to send invitation email", { 
      description: error instanceof Error ? error.message : "Unknown error" 
    });
    return false;
  }
}

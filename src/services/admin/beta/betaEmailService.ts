
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
    console.log(`Attempting to send beta invitation email to ${email} with code ${inviteCode}`);
    
    // Create the invitation URL
    const inviteUrl = `${window.location.origin}/beta?invite=${inviteCode}`;
    console.log(`Invitation URL generated: ${inviteUrl}`);
    
    // Check if email was already sent for this invitation
    const { data: invitationData, error: invitationError } = await supabase
      .from('beta_invitations')
      .select('invitation_email_sent')
      .eq('id', invitationId)
      .single();
      
    if (invitationError) {
      console.error('Error checking invitation email status:', invitationError);
    } else if (invitationData?.invitation_email_sent) {
      console.log(`Invitation email was previously sent for ${email}, attempting to resend`);
    }
    
    // Send invitation email
    console.log(`Calling emailService.sendBetaInviteEmail for ${email}`);
    const emailResult = await emailService.sendBetaInviteEmail(
      email,
      inviteCode,
      expiresAt
    );

    console.log('Email sending result:', emailResult);

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      toast.warning("Invitation created but email could not be sent", { 
        description: `Error: ${emailResult.error || "Unknown error"}` 
      });
      return false;
    } 
    
    console.log(`Successfully sent invitation email to ${email}, updating database record`);
    
    // Update invitation to mark email as sent
    const { error: updateError } = await supabase
      .from('beta_invitations')
      .update({ invitation_email_sent: true })
      .eq('id', invitationId);
      
    if (updateError) {
      console.error('Failed to update invitation email status:', updateError);
      toast.warning("Email sent but failed to update invitation record", {
        description: "The user will receive the email, but the system won't track it properly"
      });
    } else {
      console.log(`Successfully updated invitation record ${invitationId} as sent`);
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

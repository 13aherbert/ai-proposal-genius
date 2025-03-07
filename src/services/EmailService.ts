import { supabase } from "@/integrations/supabase/client";

type EmailTemplate = "welcome" | "password_reset" | "support" | "beta_invite" | "beta_announcement" | "support_response";

interface SendEmailOptions {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  templateType?: EmailTemplate;
  templateData?: Record<string, any>;
}

/**
 * Service for sending emails using the Supabase Edge Function
 */
export const emailService = {
  /**
   * Send an email with HTML content or using a template
   * @param options Email sending options
   * @returns Response from the email service
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log("Sending email to:", options.to);
      
      // Get current session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error("Authentication required to send emails");
      }
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke("send-email", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: options
      });
      
      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
      }
      
      console.log("Email sent successfully:", data);
      return { success: true, id: data?.id };
    } catch (error) {
      console.error("Error in emailService.sendEmail:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Send a welcome email to a new user
   * @param email User's email address
   * @param firstName User's first name
   * @returns Response from the email service
   */
  async sendWelcomeEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: [email],
      subject: "Welcome to OptiRFP!",
      templateType: "welcome",
      templateData: {
        firstName,
        appUrl: window.location.origin
      }
    });
  },
  
  /**
   * Send a password reset email
   * @param email User's email address
   * @param resetUrl URL for password reset
   * @returns Response from the email service
   */
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: [email],
      subject: "Reset Your Password - OptiRFP",
      templateType: "password_reset",
      templateData: {
        resetUrl,
        expiresIn: "24 hours"
      }
    });
  },
  
  /**
   * Send a confirmation email for a support/feedback request
   * @param email User's email address
   * @param name User's name
   * @param message Support/feedback message
   * @param ticketId Optional ticket ID
   * @returns Response from the email service
   */
  async sendSupportConfirmationEmail(
    email: string, 
    name: string, 
    message: string,
    ticketId?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: [email],
      subject: "We've Received Your Support Request - OptiRFP",
      templateType: "support",
      templateData: {
        name,
        message,
        ticketId: ticketId || `TKT-${Date.now()}`,
      }
    });
  },
  
  /**
   * Send a response notification for a support ticket
   * @param email User's email address
   * @param name User's name
   * @param ticketId Support ticket ID
   * @param responseMessage Response message from support team
   * @param supportUrl Optional URL to view the ticket
   * @returns Response from the email service
   */
  async sendSupportResponseEmail(
    email: string,
    name: string,
    ticketId: string,
    responseMessage: string,
    supportUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: [email],
      subject: `New Response to Your Support Request (Ticket #${ticketId}) - OptiRFP`,
      templateType: "support_response",
      templateData: {
        name,
        ticketId,
        responseMessage,
        supportUrl
      }
    });
  },
  
  /**
   * Send a beta invitation email
   * @param email Invitee's email address
   * @param inviteCode Beta invitation code
   * @param expiresAt Expiration date of the invitation
   * @returns Response from the email service
   */
  async sendBetaInviteEmail(
    email: string,
    inviteCode: string,
    expiresAt: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`Preparing beta invite email for ${email} with code ${inviteCode}`);
    
    const inviteUrl = `${window.location.origin}/beta?invite=${inviteCode}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString();
    
    console.log(`Beta invitation URL: ${inviteUrl}, expires on: ${expiryDate}`);
    
    return this.sendEmail({
      to: [email],
      subject: "You're Invited to the OptiRFP Beta Program!",
      templateType: "beta_invite",
      templateData: {
        inviteCode,
        inviteUrl,
        expiresAt: expiryDate
      }
    });
  },
  
  /**
   * Send a beta program announcement email
   * @param emails List of beta tester emails
   * @param featureName Name of the new feature
   * @param featureDetails Details about the feature
   * @param featureUrl URL to try the feature
   * @returns Response from the email service
   */
  async sendBetaAnnouncementEmail(
    emails: string[],
    featureName: string,
    featureDetails: string,
    featureUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: emails,
      subject: `New Feature Alert: ${featureName} - OptiRFP Beta`,
      templateType: "beta_announcement",
      templateData: {
        featureName,
        featureDetails,
        featureUrl
      }
    });
  }
};

import { supabase } from '@/integrations/supabase/client';
import { withRateLimit } from '@/utils/network/rate-limit';
import { withRetry } from '@/utils/network/retry';

interface SendEmailResponse {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Email service handles sending different types of emails via the edge function
 */
class EmailService {
  // Company email configuration
  private readonly emailDomain = 'updates.optirfp.ai';
  private readonly defaultFromEmail = `OptiRFP <team@${this.emailDomain}>`;

  /**
   * General function to send email through the edge function
   */
  private async sendEmail(payload: Record<string, any>): Promise<SendEmailResponse> {
    try {
      const emailKey = `email:${payload.templateType}:${payload.to?.join(',') || 'no-recipient'}`;
      console.log('Sending email with payload:', payload);
      
      // Set default from email address using verified domain
      if (!payload.from) {
        payload.from = this.defaultFromEmail;
      }
      
      // Use rate limiting to prevent duplicate emails
      return await withRateLimit(emailKey, async () => {
        // Call the edge function with authorization and retry with backoff
        console.log('Invoking send-email function with session token');
        
        // Use retry with backoff for network resilience
        return await withRetry(async () => {
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: payload,
          });
          
          if (error) {
            console.error('Error calling send-email function:', error);
            return { 
              success: false, 
              error: error?.message || 'Failed to send email' 
            };
          }
          
          if (data?.error) {
            console.error('Error from send-email function:', data.error);
            return { 
              success: false, 
              error: data.error 
            };
          }
          
          console.log('Email sent successfully:', data);
          return { 
            success: true, 
            id: data?.id,
            ...data
          };
        }, 2, 2000); // Retry twice with 2s base delay and exponential backoff
      });
    } catch (error) {
      console.error('Exception in sendEmail:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending email' 
      };
    }
  }
  
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    email: string, 
    firstName: string, 
    appUrl = window.location.origin
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: 'Welcome to OptiRFP!',
      templateType: 'welcome',
      templateData: {
        firstName,
        appUrl
      }
    });
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string, 
    resetUrl: string,
    expiresIn = '1 hour'
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: 'Reset Your Password',
      templateType: 'password_reset',
      templateData: {
        resetUrl,
        expiresIn
      }
    });
  }
  
  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail(
    email: string,
    name: string = "User"
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: "Your OptiRFP Password Has Been Changed",
      templateType: 'password_changed',
      templateData: {
        name
      }
    });
  }
  
  /**
   * Send support ticket email
   */
  async sendSupportEmail(
    email: string,
    name: string,
    message: string,
    ticketId: string,
    supportUrl?: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: ['support@optirfp.com'], // Support team address
      subject: `Support Request #${ticketId}`,
      templateType: 'support',
      templateData: {
        name,
        message,
        ticketId,
        supportUrl
      },
      replyTo: email
    });
  }
  
  /**
   * Send support response email
   */
  async sendSupportResponseEmail(
    email: string,
    name: string,
    ticketId: string,
    responseMessage: string,
    supportUrl?: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: `Re: Support Request #${ticketId}`,
      templateType: 'support_response',
      templateData: {
        name,
        ticketId,
        responseMessage,
        supportUrl
      }
    });
  }
  
  /**
   * Send support confirmation email to the user
   */
  async sendSupportConfirmationEmail(
    email: string,
    name: string,
    message: string,
    ticketId: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: `We've Received Your Support Request #${ticketId}`,
      templateType: 'support_confirmation',
      templateData: {
        name,
        message,
        ticketId
      }
    });
  }
  
  /**
   * Send beta program invitation email
   */
  async sendBetaInviteEmail(
    email: string,
    inviteCode: string,
    inviteUrl: string,
    expiresAt: string
  ): Promise<SendEmailResponse> {
    console.log('Preparing beta invite email with params:', {
      email, inviteCode, inviteUrl, expiresAt
    });
    
    try {
      return await this.sendEmail({
        to: [email],
        from: this.defaultFromEmail,
        subject: "You're Invited to the OptiRFP Beta Program!",
        templateType: 'beta_invite',
        templateData: {
          inviteCode,
          inviteUrl,
          expiresAt
        }
      });
    } catch (error) {
      console.error('Error in sendBetaInviteEmail:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending beta invite email' 
      };
    }
  }
  
  /**
   * Send beta feature announcement email
   */
  async sendBetaAnnouncementEmail(
    email: string,
    featureName: string,
    featureDetails: string,
    featureUrl?: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: `New Beta Feature: ${featureName}`,
      templateType: 'beta_announcement',
      templateData: {
        featureName,
        featureDetails,
        featureUrl
      }
    });
  }

  /**
   * Send feedback email to support team
   */
  async sendFeedbackEmail(
    feedbackType: string,
    comments: string,
    severity: string,
    userName: string = 'Anonymous',
    userEmail?: string,
    errorMessage?: string,
    errorId?: string,
    isBetaFeedback: boolean = false
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: ['support@optirfp.ai'],
      subject: `${isBetaFeedback ? 'Beta ' : ''}Feedback: ${feedbackType}`,
      templateType: 'support',
      templateData: {
        name: userName,
        message: `
Type: ${feedbackType}
Severity: ${severity}
${errorMessage ? `Error: ${errorMessage}` : ''}
${errorId ? `Error ID: ${errorId}` : ''}

Comments:
${comments}`,
        ticketId: `FB-${Date.now()}`,
      },
      replyTo: userEmail
    });
  }
}

export const emailService = new EmailService();

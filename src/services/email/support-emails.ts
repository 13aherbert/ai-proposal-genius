
import { BaseEmailService } from './base-email-service';
import { SendEmailResponse } from './types';

/**
 * Service for sending support-related emails
 */
export class SupportEmailService extends BaseEmailService {
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
      to: ['support@optirfp.com'],
      from: this.fromSupport,
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
      from: this.fromSupport,
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
      from: this.fromSupport,
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
   * Send feedback email to support team
   */
  async sendFeedbackEmail(
    feedbackType: string,
    comments: string,
    severity: string,
    userName: string = 'Anonymous',
    userEmail?: string,
    errorMessage?: string,
    errorId?: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      from: this.fromSupport,
      to: ['support@optirfp.ai'],
      subject: `Feedback: ${feedbackType}`,
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

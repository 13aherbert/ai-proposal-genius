
import { BaseEmailService } from './base-email-service';
import { SendEmailResponse } from './types';

/**
 * Service for sending beta program related emails
 */
export class BetaEmailService extends BaseEmailService {
  /**
   * Send beta program invitation email
   */
  async sendBetaInviteEmail(
    email: string,
    inviteCode: string,
    inviteUrl: string,
    expiresAt: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [email],
      subject: "You're Invited to the OptiRFP Beta Program!",
      templateType: 'beta_invite',
      templateData: {
        inviteCode,
        inviteUrl,
        expiresAt
      }
    });
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
   * Send notification email to admins about a new beta request
   */
  async sendAdminBetaRequestNotification(
    userEmail: string, 
    userName: string, 
    reason: string
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: ['admin@optirfp.com'], // Admin email address
      subject: `New Beta Program Request: ${userEmail}`,
      templateType: 'support', // Reusing the support template for notifications
      templateData: {
        name: 'Admin', 
        message: `
A new beta program request has been submitted:

Email: ${userEmail}
Name: ${userName || 'Not provided'}
Reason for joining: ${reason || 'Not provided'}

You can review this request in the admin dashboard.`,
        ticketId: `BETA-${Date.now().toString().slice(-8)}`,
      }
    });
  }
}

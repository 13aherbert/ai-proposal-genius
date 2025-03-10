
import { BaseEmailService } from './base-email-service';
import { SendEmailResponse } from './types';

/**
 * Service for sending beta program-related emails
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
}

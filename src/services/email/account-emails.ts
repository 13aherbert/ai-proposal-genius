
import { BaseEmailService } from './base-email-service';
import { SendEmailResponse } from './types';

/**
 * Service for sending account-related emails
 */
export class AccountEmailService extends BaseEmailService {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    email: string, 
    firstName: string, 
    appUrl = window.location.origin
  ): Promise<SendEmailResponse> {
    return this.sendEmail({
      from: this.fromAccount,
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
      from: this.fromAccount,
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
}

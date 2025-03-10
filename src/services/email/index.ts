
import { AccountEmailService } from './account-emails';
import { SupportEmailService } from './support-emails';
import { BetaEmailService } from './beta-emails';

/**
 * Main EmailService that combines all email services
 * 
 * This service is organized by email category:
 * - account: user account-related emails (welcome, password reset, etc.)
 * - support: support tickets and feedback emails
 * - beta: beta program-related emails
 */
class EmailService {
  readonly account: AccountEmailService;
  readonly support: SupportEmailService;
  readonly beta: BetaEmailService;

  constructor() {
    this.account = new AccountEmailService();
    this.support = new SupportEmailService();
    this.beta = new BetaEmailService();
  }

  /**
   * Legacy methods to maintain backward compatibility
   * These are aliases to the new organized methods
   */

  // Account methods
  sendWelcomeEmail = this.account.sendWelcomeEmail.bind(this.account);
  sendPasswordResetEmail = this.account.sendPasswordResetEmail.bind(this.account);
  sendPasswordChangedEmail = this.account.sendPasswordChangedEmail.bind(this.account);

  // Support methods
  sendSupportEmail = this.support.sendSupportEmail.bind(this.support);
  sendSupportResponseEmail = this.support.sendSupportResponseEmail.bind(this.support);
  sendSupportConfirmationEmail = this.support.sendSupportConfirmationEmail.bind(this.support);
  sendFeedbackEmail = this.support.sendFeedbackEmail.bind(this.support);

  // Beta methods
  sendBetaInviteEmail = this.beta.sendBetaInviteEmail.bind(this.beta);
  sendBetaAnnouncementEmail = this.beta.sendBetaAnnouncementEmail.bind(this.beta);
}

// Export a singleton instance for use throughout the application
export const emailService = new EmailService();

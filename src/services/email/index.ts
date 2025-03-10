
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
  private readonly _account: AccountEmailService;
  private readonly _support: SupportEmailService;
  private readonly _beta: BetaEmailService;

  constructor() {
    this._account = new AccountEmailService();
    this._support = new SupportEmailService();
    this._beta = new BetaEmailService();
  }

  get account() { return this._account; }
  get support() { return this._support; }
  get beta() { return this._beta; }

  // Account methods
  sendWelcomeEmail(email: string, firstName: string, appUrl?: string) {
    return this._account.sendWelcomeEmail(email, firstName, appUrl);
  }

  sendPasswordResetEmail(email: string, resetUrl: string, expiresIn?: string) {
    return this._account.sendPasswordResetEmail(email, resetUrl, expiresIn);
  }

  sendPasswordChangedEmail(email: string, name?: string) {
    return this._account.sendPasswordChangedEmail(email, name);
  }

  // Support methods
  sendSupportEmail(email: string, name: string, message: string, ticketId: string, supportUrl?: string) {
    return this._support.sendSupportEmail(email, name, message, ticketId, supportUrl);
  }

  sendSupportResponseEmail(email: string, name: string, ticketId: string, responseMessage: string, supportUrl?: string) {
    return this._support.sendSupportResponseEmail(email, name, ticketId, responseMessage, supportUrl);
  }

  sendSupportConfirmationEmail(email: string, name: string, message: string, ticketId: string) {
    return this._support.sendSupportConfirmationEmail(email, name, message, ticketId);
  }

  sendFeedbackEmail(feedbackType: string, comments: string, severity: string, userName?: string, userEmail?: string, errorMessage?: string, errorId?: string, isBetaFeedback?: boolean) {
    return this._support.sendFeedbackEmail(feedbackType, comments, severity, userName, userEmail, errorMessage, errorId, isBetaFeedback);
  }

  // Beta methods
  sendBetaInviteEmail(email: string, inviteCode: string, inviteUrl: string, expiresAt: string) {
    return this._beta.sendBetaInviteEmail(email, inviteCode, inviteUrl, expiresAt);
  }

  sendBetaAnnouncementEmail(email: string, featureName: string, featureDetails: string, featureUrl?: string) {
    return this._beta.sendBetaAnnouncementEmail(email, featureName, featureDetails, featureUrl);
  }
}

// Export a singleton instance for use throughout the application
export const emailService = new EmailService();

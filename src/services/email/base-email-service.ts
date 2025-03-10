
import { supabase } from '@/integrations/supabase/client';
import { withRateLimit } from '@/utils/network/rate-limit';
import { withRetry } from '@/utils/network/retry';
import { SendEmailResponse } from './types';

/**
 * Base email service with core functionality for sending emails
 */
export class BaseEmailService {
  // Company email configuration
  protected readonly emailDomain = 'updates.optirfp.ai';
  protected readonly defaultFromEmail = `OptiRFP <team@${this.emailDomain}>`;

  /**
   * General function to send email through the edge function
   */
  protected async sendEmail(payload: Record<string, any>): Promise<SendEmailResponse> {
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
}

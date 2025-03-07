
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for triggering webhooks for various system actions
 */
export const webhookService = {
  /**
   * Trigger support response webhook to send email notification
   * @param ticketId Support ticket ID
   * @param responseMessage Response message from support team
   * @returns Response from webhook
   */
  async triggerSupportResponseEmail(
    ticketId: string,
    responseMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Triggering support response webhook for ticket:", ticketId);
      
      // Get the webhook secret from environment variables
      const webhookSecret = import.meta.env.VITE_EMAIL_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error("EMAIL_WEBHOOK_SECRET environment variable is not set");
        return { success: false, error: "Webhook secret not configured" };
      }
      
      // Call the email-webhooks edge function
      const { data, error } = await supabase.functions.invoke("email-webhooks", {
        body: {
          ticketId,
          responseMessage,
          secret: webhookSecret
        }
      });
      
      if (error) {
        console.error("Error triggering support response webhook:", error);
        return { success: false, error: error.message };
      }
      
      console.log("Support response webhook triggered successfully:", data);
      return { success: true };
    } catch (error) {
      console.error("Error in webhookService.triggerSupportResponseEmail:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Utility function to verify a webhook payload
   * @param secret Provided secret
   * @param expectedSecret Expected secret
   * @returns Whether the secret is valid
   */
  verifyWebhookSecret(secret: string, expectedSecret: string): boolean {
    return secret === expectedSecret;
  }
};

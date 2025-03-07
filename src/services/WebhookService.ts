
import { supabase } from "@/integrations/supabase/client";
import { withRateLimit } from "@/utils/network";
import { isNetworkError, getNetworkErrorMessage } from "@/utils/network";
import { toast } from "sonner";

/**
 * WebhookService - Handles interactions with webhook endpoints
 */
export class WebhookService {
  /**
   * Trigger a support response webhook to send an email notification
   * 
   * @param ticketId - The ID of the support ticket
   * @param responseMessage - The response message to send to the user
   * @returns Response object indicating success or failure
   */
  static async triggerSupportResponseWebhook(
    ticketId: string,
    responseMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Triggering support response webhook for ticket:", ticketId);
      
      // Get the webhook secret from environment variables
      const webhookSecret = import.meta.env.VITE_EMAIL_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error("EMAIL_WEBHOOK_SECRET environment variable is not set");
        toast.error("Configuration error", {
          description: "Webhook secret not configured. Contact support."
        });
        return { success: false, error: "Webhook secret not configured" };
      }
      
      // Apply rate limiting to webhook calls (max 5 per minute)
      return await withRateLimit("support-webhook", async () => {
        // Call the email-webhooks edge function
        const { data, error } = await supabase.functions.invoke("email-webhooks", {
          body: {
            ticketId,
            responseMessage,
            secret: webhookSecret
          }
        });
        
        // Handle errors
        if (error) {
          console.error("Error triggering webhook:", error);
          
          // Handle network-related errors with user-friendly messages
          if (isNetworkError(error)) {
            const friendlyMessage = getNetworkErrorMessage(error);
            toast.error("Network error", { description: friendlyMessage });
            return { success: false, error: friendlyMessage };
          }
          
          // Handle rate limiting errors
          if (error.message?.includes("Rate limit") || error.status === 429) {
            toast.error("Too many requests", { 
              description: "Please wait a moment before trying again" 
            });
            return { success: false, error: "Rate limit exceeded" };
          }
          
          // General error handler
          toast.error("Error sending notification", { 
            description: error.message || "Unknown error occurred" 
          });
          return { success: false, error: error.message };
        }
        
        // Success case
        console.log("Webhook triggered successfully:", data);
        toast.success("Response sent", { 
          description: "User has been notified via email" 
        });
        return { success: true };
      });
      
    } catch (error: any) {
      console.error("Unexpected error in triggerSupportResponseWebhook:", error);
      toast.error("Unexpected error", { 
        description: error.message || "Unknown error occurred" 
      });
      return { success: false, error: error.message };
    }
  }
}

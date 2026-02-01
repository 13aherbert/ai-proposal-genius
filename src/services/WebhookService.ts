
import { supabase } from "@/integrations/supabase/client";
import { withRateLimitByKey } from "@/utils/network";
import { isNetworkError, getNetworkErrorMessage } from "@/utils/network";
import { toast } from "sonner";

/**
 * WebhookService - Handles interactions with webhook endpoints
 * 
 * SECURITY: This service uses JWT authentication instead of client-side secrets.
 * The webhook secret is stored server-side and validated in the edge function.
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
      
      // Apply rate limiting to webhook calls (max 5 per minute)
      return await withRateLimitByKey("support-webhook", async () => {
        // Call the email-webhooks edge function with JWT authentication
        // The edge function validates the user's session and permissions
        const { data, error } = await supabase.functions.invoke("email-webhooks", {
          body: {
            ticketId,
            responseMessage
            // NOTE: Secret is now validated server-side using Supabase secrets
            // The edge function uses the Authorization header for user verification
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
          
          // Handle authentication errors
          if (error.status === 401) {
            toast.error("Authentication required", { 
              description: "Please sign in to perform this action" 
            });
            return { success: false, error: "Authentication required" };
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

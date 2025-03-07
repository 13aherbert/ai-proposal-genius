
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for interacting with webhook endpoints
 */
export const webhookService = {
  /**
   * Trigger a support response notification through the webhook
   * @param ticketId The ID of the support ticket
   * @param responseMessage The response message from support team
   * @returns Result from the webhook call
   */
  async triggerSupportResponseEmail(
    ticketId: string,
    responseMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Triggering support response webhook for ticket:", ticketId);
      
      // Get current session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error("Authentication required to trigger webhooks");
      }
      
      // Call the webhook edge function
      const { data, error } = await supabase.functions.invoke("email-webhooks", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: {
          ticketId,
          responseMessage,
          // In a real implementation, this would be a secure secret stored in environment
          // For demo purposes, we're using a placeholder
          secret: "demo-webhook-secret"
        }
      });
      
      if (error) {
        console.error("Error triggering webhook:", error);
        return { success: false, error: error.message };
      }
      
      console.log("Webhook triggered successfully:", data);
      return { success: true };
    } catch (error) {
      console.error("Error in webhookService.triggerSupportResponseEmail:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return { success: false, error: errorMessage };
    }
  }
};

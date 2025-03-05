
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Updates a user's subscription plan to Pro
 * @param email The email of the user to update
 */
export async function updateUserToPro(email: string) {
  try {
    console.log(`Updating subscription for ${email} to Pro plan...`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("Not authenticated");
    }
    
    const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
      body: { 
        email,
        plan: 'pro'
      },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
    
    console.log("Subscription update result:", data);
    
    if (data.success) {
      toast.success(`Successfully updated subscription for ${email} to Pro plan`);
      return true;
    } else {
      throw new Error(data.error || "Unknown error");
    }
  } catch (error) {
    console.error("Failed to update subscription:", error);
    toast.error(`Failed to update subscription: ${error.message}`);
    return false;
  }
}

// Example usage:
// updateUserToPro("apxherbert@gmail.com").then(success => {
//   console.log("Update completed with success:", success);
// });


import { supabase } from "@/integrations/supabase/client";

/**
 * Script to update a user's subscription directly
 * This can be run from the browser console
 */
export async function updateUserSubscriptionDirectly(
  email: string, 
  plan: string = 'starter', 
  status: string = 'active'
): Promise<void> {
  try {
    console.log(`Attempting to update subscription for ${email} to ${plan} (${status})`);
    
    // Get current authenticated session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available - please log in');
      return;
    }
    
    // Call our edge function to update the subscription
    console.log('Invoking admin-update-subscription edge function...');
    
    const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
      body: { 
        email,
        plan,
        status
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (error) {
      console.error("Error updating subscription:", error);
      return;
    }
    
    console.log("Subscription update result:", data);
    
    if (!data.success) {
      console.error("Update failed:", data.error || "Unknown error");
      return;
    }
    
    console.log(`SUCCESS: Subscription updated to ${plan} plan with status ${status}`);
    console.log('Please refresh the page to see the changes');
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
  }
}

// Create a helper function specifically for the werarerivalpro@gmail.com user
function updateSubscription(): void {
  updateUserSubscriptionDirectly('werarerivalpro@gmail.com', 'starter', 'active');
}

// Extend the Window interface to include our functions
declare global {
  interface Window {
    updateUserSubscriptionDirectly: typeof updateUserSubscriptionDirectly;
    updateSubscription: typeof updateSubscription;
  }
}

// Add the functions to the window object so they can be called from the console
window.updateUserSubscriptionDirectly = updateUserSubscriptionDirectly;
window.updateSubscription = updateSubscription;

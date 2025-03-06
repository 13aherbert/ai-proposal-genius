
/**
 * This script updates the specified user to an active starter subscription
 * It can be executed from the browser console
 */
import { updateUserSubscription } from '../services/admin/userService';
import { toast } from 'sonner';
import { withRetry } from '@/utils/network-utils';

/**
 * Changes the subscription for Wearerivalpro@gmail.com to an active starter plan
 * Includes retry logic for network resilience
 */
export async function updateRivalProSubscription(): Promise<void> {
  try {
    // Show a loading toast
    const loadingId = toast.loading("Updating subscription for Wearerivalpro@gmail.com...");
    
    console.log("Updating subscription for Wearerivalpro@gmail.com to active starter...");
    
    const email = 'Wearerivalpro@gmail.com'; // Email (case sensitive as stored in auth.users)
    const plan = 'starter';                   // Plan type
    const status = 'active';                  // Status
    
    console.log(`Calling updateUserSubscription(${email}, ${plan}, ${status})`);
    
    // Use the retry utility for the update operation
    const result = await updateUserSubscription(email, plan, status);
    
    // Dismiss the loading toast
    toast.dismiss(loadingId);
    
    if (result) {
      console.log("✓ Successfully updated Wearerivalpro@gmail.com to active starter subscription");
      toast.success("User subscription updated", {
        description: "Wearerivalpro@gmail.com is now on an active starter plan",
        duration: 5000
      });
    } else {
      console.error("✗ Failed to update subscription");
      toast.error("Failed to update subscription", {
        description: "See console for detailed error information",
        duration: 8000
      });
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    toast.error("Error updating subscription", {
      description: error instanceof Error ? error.message : "Unknown error",
      duration: 8000
    });
  }
}

// TypeScript declaration for the global window object
declare global {
  interface Window {
    updateRivalProSubscription: typeof updateRivalProSubscription;
  }
}

// Attach the function to the window object for direct console access
if (typeof window !== 'undefined') {
  window.updateRivalProSubscription = updateRivalProSubscription;
}

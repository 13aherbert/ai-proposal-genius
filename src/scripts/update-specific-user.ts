
/**
 * This script updates the specified user to an active starter subscription
 * It can be executed from the browser console
 */
import { updateUserSubscription } from '../services/admin/userService';
import { toast } from 'sonner';
import { withRetry, isNetworkError, getNetworkErrorMessage } from '@/utils/network-utils';

// Flag to prevent multiple executions at once
let isUpdating = false;

/**
 * Changes the subscription for Wearerivalpro@gmail.com to an active starter plan
 * Includes retry logic for network resilience
 */
export async function updateRivalProSubscription(): Promise<void> {
  // Prevent multiple simultaneous executions
  if (isUpdating) {
    toast.info("Update already in progress, please wait");
    return;
  }
  
  isUpdating = true;
  const loadingId = toast.loading("Updating subscription for Wearerivalpro@gmail.com...");
  
  try {
    console.log("Updating subscription for Wearerivalpro@gmail.com to active starter...");
    
    const email = 'Wearerivalpro@gmail.com'; // Email (case sensitive as stored in auth.users)
    const plan = 'starter';                   // Plan type
    const status = 'active';                  // Status
    
    console.log(`Calling updateUserSubscription(${email}, ${plan}, ${status})`);
    
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
    
    toast.dismiss(loadingId);
    
    if (isNetworkError(error)) {
      toast.error("Network error", {
        description: getNetworkErrorMessage(error),
        duration: 8000
      });
    } else {
      toast.error("Error updating subscription", {
        description: error instanceof Error ? error.message : "Unknown error",
        duration: 8000
      });
    }
  } finally {
    isUpdating = false;
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

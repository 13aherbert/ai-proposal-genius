
/**
 * This script updates the specified user to an active starter subscription
 * It can be executed from the browser console
 */
import { updateUserSubscription } from '../services/admin/userService';
import { toast } from 'sonner';

/**
 * Changes the subscription for Wearerivalpro@gmail.com to an active starter plan
 */
export async function updateRivalProSubscription(): Promise<void> {
  try {
    console.log("Updating subscription for Wearerivalpro@gmail.com to active starter...");
    
    const result = await updateUserSubscription(
      'Wearerivalpro@gmail.com', // Email (case insensitive)
      'starter',                 // Plan type
      'active'                   // Status
    );
    
    if (result) {
      console.log("✓ Successfully updated Wearerivalpro@gmail.com to active starter subscription");
      toast.success("User subscription updated", {
        description: "Wearerivalpro@gmail.com is now on an active starter plan"
      });
    } else {
      console.error("✗ Failed to update subscription");
      toast.error("Failed to update subscription");
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    toast.error("Error updating subscription", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Make the function available globally
declare global {
  interface Window {
    updateRivalProSubscription: typeof updateRivalProSubscription;
  }
}

window.updateRivalProSubscription = updateRivalProSubscription;


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
    
    const email = 'Wearerivalpro@gmail.com'; // Email (case sensitive as stored in auth.users)
    const plan = 'starter';                   // Plan type
    const status = 'active';                  // Status
    
    console.log(`Calling updateUserSubscription(${email}, ${plan}, ${status})`);
    
    const result = await updateUserSubscription(email, plan, status);
    
    if (result) {
      console.log("✓ Successfully updated Wearerivalpro@gmail.com to active starter subscription");
      toast.success("User subscription updated", {
        description: "Wearerivalpro@gmail.com is now on an active starter plan"
      });
    } else {
      console.error("✗ Failed to update subscription");
      toast.error("Failed to update subscription", {
        description: "See console for detailed error information"
      });
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    toast.error("Error updating subscription", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// TypeScript declaration for the global window object
declare global {
  interface Window {
    updateRivalProSubscription: typeof updateRivalProSubscription;
  }
}


import { useState } from "react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * Hook to manage payment update functionality
 * @returns Functions and state for handling payment updates
 */
export function usePaymentUpdate() {
  const subscription = useSubscription();
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  /**
   * Handles the payment update process
   * Calls the renewSubscription function and manages toast notifications
   */
  const handleUpdatePayment = async () => {
    try {
      setIsUpdatingPayment(true);
      
      // Check if we have a subscription with required data
      if (!subscription.subscription) {
        console.error("No subscription data available");
        toast.error("Cannot update payment method", {
          description: "No subscription information found. Please refresh the page and try again."
        });
        return;
      }
      
      console.log("Initiating payment update with subscription:", subscription.subscription);
      toast.loading("Preparing payment update...");
      
      const result = await subscription.renewSubscription();
      
      console.log("Renewal result:", result);
      
      if (result && result.success && result.url) {
        toast.dismiss();
        toast.success("Redirecting to payment portal", {
          description: "You'll be redirected to update your payment method."
        });
        
        setTimeout(() => {
          window.location.href = result.url;
        }, 1000);
      } else {
        console.error("Invalid renewal result:", result);
        toast.dismiss();
        
        // More specific error handling based on the result structure
        if (result && result.error) {
          toast.error("Payment update failed", {
            description: result.error.message || "Please try again or contact support."
          });
        } else {
          toast.error("Could not initiate payment update", {
            description: "No valid response from the server. Please try again or contact support."
          });
        }
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast.dismiss();
      toast.error("Payment update failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred."
      });
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  return {
    handleUpdatePayment,
    isUpdatingPayment
  };
}

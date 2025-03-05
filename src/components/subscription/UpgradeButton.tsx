
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/types/subscription";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/hooks/subscription/use-subscription-actions";

const PRICE_IDS = {
  starterMonthly: 'price_1QlhMNCcQ0GhLgJorKCY8aBE',
  starterAnnual: 'price_1QlhMNCcQ0GhLgJoVMuDzJRp',
  proMonthly: 'price_1QlhNHCcQ0GhLgJo8NIFKtlo',
  proAnnual: 'price_1QlhNHCcQ0GhLgJoKuBKfXLa'
};

interface UpgradeButtonProps {
  currentPlan: SubscriptionPlan | null;
  targetPlan: 'starter' | 'pro';
  variant?: 'monthly' | 'annual';
}

export function UpgradeButton({ currentPlan, targetPlan, variant = 'monthly' }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getPriceId = () => {
    if (targetPlan === 'starter') {
      return variant === 'monthly' ? PRICE_IDS.starterMonthly : PRICE_IDS.starterAnnual;
    }
    return variant === 'monthly' ? PRICE_IDS.proMonthly : PRICE_IDS.proAnnual;
  };

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      toast.loading("Processing your request...");

      const priceId = getPriceId();
      console.log(`Upgrading to ${targetPlan} (${variant}) with price ID: ${priceId}`);
      
      // Use the createCheckoutSession function from our actions
      const { url, error } = await createCheckoutSession(priceId);
      
      if (error) {
        throw error;
      }

      if (!url) {
        throw new Error('No checkout URL returned');
      }

      // Dismiss loading toast and show success message before redirecting
      toast.dismiss();
      toast.success("Redirecting to checkout", {
        description: "You'll be redirected to the payment page in a moment"
      });

      // Short delay to allow the success toast to be seen
      setTimeout(() => {
        // Redirect to Stripe Checkout
        window.location.href = url;
      }, 1000);
    } catch (error) {
      console.error('Error in upgrade process:', error);
      toast.dismiss(); // Dismiss loading toast
      toast.error(error instanceof Error ? error.message : "Failed to start upgrade process", {
        description: "Please try again or contact support if the issue persists"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPlan = currentPlan?.plan_type === targetPlan;
  const isUpgradeDisabled = isLoading || isCurrentPlan;

  return (
    <Button 
      onClick={handleUpgrade} 
      disabled={isUpgradeDisabled}
      className="w-full"
      variant={isCurrentPlan ? "outline" : "default"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : isCurrentPlan ? (
        "Current Plan"
      ) : (
        `Upgrade to ${targetPlan}`
      )}
    </Button>
  );
}

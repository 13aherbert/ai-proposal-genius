import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/types/subscription";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/hooks/subscription/use-subscription-actions";
import { STRIPE_PRICE_IDS } from "@/config/stripe-prices";

interface UpgradeButtonProps {
  currentPlan: SubscriptionPlan | null;
  targetPlan: 'starter' | 'growth' | 'business' | 'enterprise';
  variant?: 'monthly' | 'annual';
}

export function UpgradeButton({ currentPlan, targetPlan, variant = 'monthly' }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getPriceId = () => {
    if (targetPlan === 'growth' || targetPlan === 'business') {
      return STRIPE_PRICE_IDS[targetPlan][variant];
    }
    return null;
  };

  const handleUpgrade = async () => {
    if (targetPlan === 'starter') {
      toast.success("Great! You can continue using the free plan", {
        description: "You can upgrade anytime when you're ready for more features"
      });
      return;
    }

    if (targetPlan === 'enterprise') {
      toast.success("Demo request sent! Our team will contact you within 24 hours.");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Processing your request...");

      const priceId = getPriceId();
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }
      
      console.log(`Upgrading to ${targetPlan} (${variant}) with price ID: ${priceId}`);
      
      const { url, error } = await createCheckoutSession(priceId);
      
      if (error) throw error;
      if (!url) throw new Error('No checkout URL returned');

      toast.dismiss();
      toast.success("Redirecting to checkout", {
        description: "You'll be redirected to the payment page in a moment"
      });

      setTimeout(() => {
        window.location.href = url;
      }, 1000);
    } catch (error) {
      console.error('Error in upgrade process:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to start upgrade process", {
        description: "Please try again or contact support if the issue persists"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPlan = currentPlan?.plan_type === targetPlan;
  const isUpgradeDisabled = isLoading || isCurrentPlan;

  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (isCurrentPlan) return "Current Plan";
    if (targetPlan === 'starter') return "Continue with Free Plan";
    const displayName = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1);
    return `Upgrade to ${displayName}`;
  };

  return (
    <Button 
      onClick={handleUpgrade} 
      disabled={isUpgradeDisabled}
      className="w-full"
      variant={isCurrentPlan ? "outline" : targetPlan === 'starter' ? "outline" : "default"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        getButtonText()
      )}
    </Button>
  );
}

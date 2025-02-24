
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/hooks/use-subscription";

const PRICE_IDS = {
  trial: 'price_1OtVd8CcQ0GhLgJo7zFkWQ0Y',
  starterMonthly: 'price_1OtVd8CcQ0GhLgJoQZcIR7V9',
  starterAnnual: 'price_1OtVd8CcQ0GhLgJoH2K9L3M5',
  proMonthly: 'price_1OtVd9CcQ0GhLgJoXYWNP4Q8',
  proAnnual: 'price_1OtVd9CcQ0GhLgJoK8M5B2R1'
};

interface UpgradeButtonProps {
  currentPlan: SubscriptionPlan | null;
  targetPlan: 'trial' | 'starter' | 'pro';
  variant?: 'monthly' | 'annual';
}

export function UpgradeButton({ currentPlan, targetPlan, variant = 'monthly' }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getPriceId = () => {
    if (targetPlan === 'trial') return PRICE_IDS.trial;
    if (targetPlan === 'starter') {
      return variant === 'monthly' ? PRICE_IDS.starterMonthly : PRICE_IDS.starterAnnual;
    }
    return variant === 'monthly' ? PRICE_IDS.proMonthly : PRICE_IDS.proAnnual;
  };

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Session error: ' + sessionError.message);
      }

      if (!session) {
        toast.error("Please log in to upgrade your subscription");
        return;
      }

      // Call the create-checkout-session function with appropriate headers
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId: getPriceId() 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('Checkout session response:', data);

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error in upgrade process:', error);
      toast.error(error instanceof Error ? error.message : "Failed to start upgrade process");
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
      {isLoading ? "Processing..." : isCurrentPlan ? "Current Plan" : `Upgrade to ${targetPlan}`}
    </Button>
  );
}

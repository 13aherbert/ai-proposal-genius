import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/hooks/use-subscription";

const PRICE_IDS = {
  trial: 'price_1QlhL0CcQ0GhLgJoeSDq6zEY',
  starterMonthly: 'price_1QlhMNCcQ0GhLgJorKCY8aBE',
  starterAnnual: 'price_1QlhMNCcQ0GhLgJoVMuDzJRp',
  proMonthly: 'price_1QlhNHCcQ0GhLgJo8NIFKtlo',
  proAnnual: 'price_1QlhNHCcQ0GhLgJoKuBKfXLa'
};

interface UpgradeButtonProps {
  currentPlan: SubscriptionPlan;
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to upgrade your subscription");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: getPriceId() }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error("Failed to start upgrade process");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleUpgrade} 
      disabled={isLoading || (currentPlan === targetPlan)}
      className="w-full"
    >
      {isLoading ? "Loading..." : `Upgrade to ${targetPlan}`}
    </Button>
  );
}
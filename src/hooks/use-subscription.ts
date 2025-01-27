import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = 'trial' | 'starter' | 'pro' | null;

interface SubscriptionStatus {
  subscribed: boolean;
  plan: SubscriptionPlan;
}

const checkSubscription = async (): Promise<SubscriptionStatus> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { subscribed: false, plan: null };
  }

  const { data, error } = await supabase.functions.invoke('check-subscription', {
    method: 'GET'
  });

  if (error) {
    console.error('Error checking subscription:', error);
    throw new Error('Failed to check subscription status');
  }

  return data;
};

export const useSubscription = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
  });
};
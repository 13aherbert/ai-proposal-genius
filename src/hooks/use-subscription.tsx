
import { useSubscription as useSubscriptionHook, SubscriptionProvider } from './subscription/providers/SubscriptionProvider';
import { useCallback } from 'react';

// Stable pass-through hook — no cascading error-recovery effects
const useSubscriptionWithFallback = () => {
  const subscriptionData = useSubscriptionHook();

  // Simple pass-through with compatibility aliases
  return {
    ...subscriptionData,
    data: subscriptionData.subscription,
    loading: subscriptionData.isLoading,
    checkSubscription: subscriptionData.refreshSubscription,
    refreshWithFallbacks: subscriptionData.refreshSubscription,
  };
};

// Re-export for use in components
export const useSubscription = useSubscriptionWithFallback;
export { SubscriptionProvider };

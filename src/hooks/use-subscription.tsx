
import { useSubscription as useSubscriptionHook, SubscriptionProvider } from './subscription/providers/SubscriptionProvider';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Enhanced hook with fallback mechanism
const useSubscriptionWithFallback = () => {
  const subscriptionData = useSubscriptionHook();
  
  useEffect(() => {
    // If the subscription data is not available and we're not loading, try to force a refresh
    if (!subscriptionData.data && !subscriptionData.loading) {
      console.log("Subscription data not available, forcing a refresh");
      subscriptionData.checkSubscription(true).catch(err => {
        console.error("Error during forced subscription check:", err);
      });
    }
  }, [subscriptionData.data, subscriptionData.loading, subscriptionData.checkSubscription]);
  
  return subscriptionData;
};

// Re-export enhanced hook for use in components
export const useSubscription = useSubscriptionWithFallback;
export { SubscriptionProvider };

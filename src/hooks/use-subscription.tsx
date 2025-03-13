
import { useSubscription as useSubscriptionHook, SubscriptionProvider } from './subscription/providers/SubscriptionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Enhanced hook with fallback mechanism
const useSubscriptionWithFallback = () => {
  const subscriptionData = useSubscriptionHook();
  const [hasTriedForceRefresh, setHasTriedForceRefresh] = useState(false);
  
  useEffect(() => {
    // If the subscription data is not available and we're not loading, try to force a refresh
    if (!subscriptionData.data && !subscriptionData.loading && !hasTriedForceRefresh) {
      console.log("Subscription data not available, forcing a refresh");
      
      // Add a small delay to avoid immediate refresh
      const timer = setTimeout(() => {
        subscriptionData.checkSubscription(true).catch(err => {
          console.error("Error during forced subscription check:", err);
          toast.error("Could not load subscription data");
          
          // As a last resort, try a direct database query
          tryDirectDatabaseFetch();
        });
        setHasTriedForceRefresh(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [subscriptionData.data, subscriptionData.loading, hasTriedForceRefresh]);
  
  // Function to try a direct database fetch as last resort
  const tryDirectDatabaseFetch = async () => {
    try {
      console.log("Attempting direct subscription fetch as last resort");
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user?.id) {
        console.error("No authenticated user found for direct fetch");
        return;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .single();
        
      if (error) {
        console.error("Error in direct subscription fetch:", error);
      } else if (data) {
        console.log("Successfully fetched subscription directly:", data);
        // Force a subscription check to update the context
        subscriptionData.checkSubscription(true).catch(err => {
          console.error("Error during second forced check:", err);
        });
      }
    } catch (err) {
      console.error("Exception in direct fetch:", err);
    }
  };
  
  return subscriptionData;
};

// Re-export enhanced hook for use in components
export const useSubscription = useSubscriptionWithFallback;
export { SubscriptionProvider };

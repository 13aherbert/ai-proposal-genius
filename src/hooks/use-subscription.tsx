
import { useSubscription as useSubscriptionHook, SubscriptionProvider } from './subscription/providers/SubscriptionProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionPlan, SubscriptionStatus } from '@/types/subscription';
import { isNetworkError, getNetworkErrorMessage } from '@/utils/network';
import { withRetry } from '@/utils/network/retry';

// Pass-through hook that maintains compatibility with the original hook
const useSubscriptionWithFallback = () => {
  const subscriptionData = useSubscriptionHook();
  const [hasTriedForceRefresh, setHasTriedForceRefresh] = useState(false);
  const [hasTriedDirectFetch, setHasTriedDirectFetch] = useState(false);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [directFetchError, setDirectFetchError] = useState<Error | null>(null);
  const isAttemptingFallback = useRef(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  // Load from localStorage on mount
  useEffect(() => {
    if (!subscriptionData.subscription && !fallbackLoaded) {
      try {
        const storedData = localStorage.getItem('subscriptionData');
        if (storedData) {
          console.log("Using cached subscription data while loading");
          const parsedData = JSON.parse(storedData);
          
          // Verify this is our data and it's somewhat recent (last 24 hours)
          const isRecent = parsedData.updated_at 
            ? (Date.now() - new Date(parsedData.updated_at).getTime() < 86400000)
            : false;
            
          if (parsedData.subscription_id && isRecent) {
            setFallbackLoaded(true);
            // Dispatch event to let components know we have cached data
            window.dispatchEvent(new CustomEvent('subscriptionCacheLoaded', { 
              detail: { data: parsedData } 
            }));
          }
        }
      } catch (err) {
        console.error("Error reading from localStorage:", err);
      }
    }
  }, [subscriptionData.subscription, fallbackLoaded]);
  
  // Store subscription data in localStorage whenever it's updated
  useEffect(() => {
    if (subscriptionData.subscription) {
      try {
        // Add timestamp for freshness check
        const dataToStore = {
          ...subscriptionData.subscription,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('subscriptionData', JSON.stringify(dataToStore));
        console.log("Subscription data stored in localStorage for persistence");
      } catch (err) {
        console.error("Error storing subscription data:", err);
      }
    }
  }, [subscriptionData.subscription]);

  // Attempt direct database fetch if main method fails
  useEffect(() => {
    const attemptDirectFetch = async () => {
      if (
        subscriptionData.error && 
        !hasTriedDirectFetch && 
        !isAttemptingFallback.current && 
        !subscriptionData.subscription
      ) {
        isAttemptingFallback.current = true;
        setHasTriedDirectFetch(true);
        
        try {
          console.log("Attempting direct subscription fetch after error");
          
          // Get the current session
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.user?.id) {
            console.log("No authenticated user found for direct fetch");
            isAttemptingFallback.current = false;
            return;
          }
          
          // Query the database directly
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', sessionData.session.user.id)
            .single();
            
          if (error) {
            console.error("Direct fetch error:", error);
            setDirectFetchError(error);
            throw error;
          }
          
          if (data) {
            console.log("Successfully fetched subscription data directly");
            
            // Store in localStorage
            const typedData: SubscriptionPlan = {
              ...data,
              status: data.status as SubscriptionStatus,
              features: typeof data.features === 'object' && data.features !== null 
                ? data.features as Record<string, any> 
                : {}
            };
            
            localStorage.setItem('subscriptionData', JSON.stringify({
              ...typedData,
              updated_at: new Date().toISOString()
            }));
            
            // Force a subscription refresh with our new data
            subscriptionData.refreshSubscription();
          }
        } catch (err) {
          console.error("Error in direct subscription fetch:", err);
          if (isNetworkError(err)) {
            toast.error(getNetworkErrorMessage(err));
          }
        } finally {
          isAttemptingFallback.current = false;
        }
      }
    };
    
    attemptDirectFetch();
  }, [subscriptionData.error, hasTriedDirectFetch, subscriptionData.subscription, subscriptionData.refreshSubscription]);
  
  // Check if a force refresh is needed due to errors
  useEffect(() => {
    if (
      subscriptionData.error && 
      !hasTriedForceRefresh && 
      !isAttemptingFallback.current
    ) {
      setHasTriedForceRefresh(true);
      
      console.log("Force refreshing subscription after error");
      
      // Timeout to avoid immediate retry
      setTimeout(() => {
        subscriptionData.refreshSubscription();
      }, 1000);
    }
  }, [subscriptionData.error, hasTriedForceRefresh, subscriptionData.refreshSubscription]);
  
  // Enhance the checkSubscription method to update localStorage
  const enhancedCheckSubscription = useCallback(async (forceRecheck?: boolean) => {
    // Rate limit refreshes to prevent hammering the server
    const now = Date.now();
    if (!forceRecheck && now - lastRefreshTime < 10000) {
      console.log("Skipping subscription check - too soon since last check");
      return;
    }
    
    setLastRefreshTime(now);
    
    try {
      await subscriptionData.refreshSubscription();
    } catch (err) {
      console.error("Error in subscription check, falling back to cached data:", err);
      const cachedData = localStorage.getItem('subscriptionData');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData.subscription_id) {
            console.log("Using cached subscription data after failed check");
            // Dispatch event to notify components
            window.dispatchEvent(new CustomEvent('subscriptionCacheLoaded', { 
              detail: { data: parsedData } 
            }));
          }
        } catch (parseErr) {
          console.error("Error parsing cached subscription data:", parseErr);
        }
      }
    }
  }, [subscriptionData.refreshSubscription, lastRefreshTime]);
  
  // Return a merged object that contains all properties from the original hook
  // plus our extended properties for backwards compatibility
  return {
    ...subscriptionData,
    fallbackLoaded,
    directFetchError,
    refreshWithFallbacks: enhancedCheckSubscription,
    data: subscriptionData.subscription,
    loading: subscriptionData.isLoading,
    checkSubscription: subscriptionData.refreshSubscription,
  };
};

// Re-export enhanced hook for use in components
export const useSubscription = useSubscriptionWithFallback;
export { SubscriptionProvider };


import { useSubscription as useSubscriptionHook, SubscriptionProvider } from './subscription/providers/SubscriptionProvider';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionPlan, SubscriptionStatus } from '@/types/subscription';
import { isNetworkError, getNetworkErrorMessage } from '@/utils/network';

// Enhanced hook with improved fallback mechanism
const useSubscriptionWithFallback = () => {
  const subscriptionData = useSubscriptionHook();
  const [hasTriedForceRefresh, setHasTriedForceRefresh] = useState(false);
  const [hasTriedDirectFetch, setHasTriedDirectFetch] = useState(false);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const isAttemptingFallback = useRef(false);
  
  // Load from localStorage on mount
  useEffect(() => {
    if (!subscriptionData.data && !fallbackLoaded) {
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
  }, [subscriptionData.data, fallbackLoaded]);
  
  // Store subscription data in localStorage whenever it's updated
  useEffect(() => {
    if (subscriptionData.data) {
      try {
        // Add timestamp for freshness check
        const dataToStore = {
          ...subscriptionData.data,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('subscriptionData', JSON.stringify(dataToStore));
        console.log("Subscription data stored in localStorage for persistence");
      } catch (err) {
        console.error("Error storing subscription data:", err);
      }
    }
  }, [subscriptionData.data]);
  
  // Enhance the checkSubscription method to update localStorage
  const enhancedCheckSubscription = async (forceRecheck?: boolean) => {
    try {
      await subscriptionData.checkSubscription(forceRecheck);
    } catch (err) {
      console.error("Error in subscription check, falling back to cached data:", err);
      const cachedData = localStorage.getItem('subscriptionData');
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData.subscription_id) {
            console.log("Using cached subscription data after failed check");
          }
        } catch (parseErr) {
          console.error("Error parsing cached subscription data:", parseErr);
        }
      }
    }
  };
  
  // Add our new method to the returned object
  return {
    ...subscriptionData,
    fallbackLoaded,
    refreshWithFallbacks: enhancedCheckSubscription
  };
};

// Re-export enhanced hook for use in components
export const useSubscription = useSubscriptionWithFallback;
export { SubscriptionProvider };

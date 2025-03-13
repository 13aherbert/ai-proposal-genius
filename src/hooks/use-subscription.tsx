
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
          }
        }
      } catch (err) {
        console.error("Error reading from localStorage:", err);
      }
    }
  }, [subscriptionData.data, fallbackLoaded]);
  
  useEffect(() => {
    // If the subscription data is not available and we're not loading, try to force a refresh
    if (!subscriptionData.data && !subscriptionData.loading && !hasTriedForceRefresh && !isAttemptingFallback.current) {
      console.log("Subscription data not available, forcing a refresh");
      isAttemptingFallback.current = true;
      
      // Add a small delay to avoid immediate refresh
      const timer = setTimeout(() => {
        subscriptionData.checkSubscription(true).catch(err => {
          console.error("Error during forced subscription check:", err);
          
          // Check if this is a network error
          if (isNetworkError(err)) {
            const errorMessage = getNetworkErrorMessage(err);
            toast.error("Network issue detected", {
              description: errorMessage
            });
          } else {
            toast.error("Could not load subscription data");
          }
          
          setHasTriedForceRefresh(true);
          isAttemptingFallback.current = false;
          
          // As a second fallback, try a direct database query
          tryDirectDatabaseFetch();
        });
        setHasTriedForceRefresh(true);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        isAttemptingFallback.current = false;
      };
    }
  }, [subscriptionData.data, subscriptionData.loading, hasTriedForceRefresh]);
  
  // Function to try a direct database fetch as last resort
  const tryDirectDatabaseFetch = async () => {
    if (hasTriedDirectFetch || isAttemptingFallback.current) return;
    
    try {
      console.log("Attempting direct subscription fetch as last resort");
      isAttemptingFallback.current = true;
      setHasTriedDirectFetch(true);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error for direct fetch:", sessionError);
        isAttemptingFallback.current = false;
        return;
      }
      
      if (!sessionData?.session?.user?.id) {
        console.error("No authenticated user found for direct fetch");
        isAttemptingFallback.current = false;
        return;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error in direct subscription fetch:", error);
        
        // If this is a network error, try using localStorage as absolute last resort
        if (isNetworkError(error)) {
          useLocalStorageFallback(sessionData.session.user.id);
        }
      } else if (data) {
        console.log("Successfully fetched subscription directly:", data);
        // Properly type the data before storing
        const typedData: SubscriptionPlan = {
          ...data,
          status: data.status as SubscriptionStatus,
          features: typeof data.features === 'object' && data.features !== null 
            ? data.features as Record<string, any>
            : {}
        };
        
        // Store in localStorage for future use with timestamp
        typedData.updated_at = new Date().toISOString();
        try {
          localStorage.setItem('subscriptionData', JSON.stringify(typedData));
        } catch (e) {
          console.error("Error storing subscription data locally:", e);
        }
        
        // Force a subscription check to update the context
        subscriptionData.checkSubscription(true).catch(err => {
          console.error("Error during second forced check:", err);
        });
      } else {
        // No data returned, try localStorage
        useLocalStorageFallback(sessionData.session.user.id);
      }
    } catch (err) {
      console.error("Exception in direct fetch:", err);
      // Final fallback to localStorage
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user?.id) {
          useLocalStorageFallback(session.session.user.id);
        }
      } catch (e) {
        console.error("Failed to get session for localStorage fallback:", e);
      }
    } finally {
      isAttemptingFallback.current = false;
    }
  };
  
  // Function to use localStorage as final fallback
  const useLocalStorageFallback = (userId: string) => {
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Only use if it belongs to the current user
        if (parsedData.user_id === userId) {
          console.log("Using localStorage subscription fallback for current user");
          
          // Force a context update with this data
          const typedData: SubscriptionPlan = {
            ...parsedData,
            status: parsedData.status as SubscriptionStatus,
            features: typeof parsedData.features === 'object' && parsedData.features !== null 
              ? parsedData.features as Record<string, any>
              : {}
          };
          
          // Store back with updated timestamp
          typedData.updated_at = new Date().toISOString();
          localStorage.setItem('subscriptionData', JSON.stringify(typedData));
        }
      }
    } catch (err) {
      console.error("Error using localStorage fallback:", err);
    }
  };
  
  return {
    ...subscriptionData,
    fallbackLoaded
  };
};

// Re-export enhanced hook for use in components
export const useSubscription = useSubscriptionWithFallback;
export { SubscriptionProvider };

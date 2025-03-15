
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/hooks/network';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/types/subscription';
import { createDefaultSubscription, createStarterSubscription } from '../utils/subscription-creation';
import { storeSubscriptionDataLocally, getStoredSubscriptionData } from '../feature-access';

// Context type definitions
type SubscriptionContextType = {
  subscription: SubscriptionPlan | null;
  data: SubscriptionPlan | null; // Add data alias for subscription
  isLoading: boolean;
  loading: boolean; // Add loading alias for isLoading
  hasCheckedSubscription: boolean;
  error: Error | null;
  refreshSubscription: () => Promise<void>;
  checkSubscription: (forceRecheck?: boolean) => Promise<void>; // Add alias for refreshSubscription
  setSubscription: (subscription: SubscriptionPlan) => void;
  clearSubscription: () => void;
  hasFailedPayment: () => boolean; // Add subscription status checker methods
  isInGracePeriod: () => boolean;
  renewSubscription: () => Promise<{ url?: string; success?: boolean; error?: any }>;
};

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  data: null,
  isLoading: true,
  loading: true,
  hasCheckedSubscription: false,
  error: null,
  refreshSubscription: async () => {},
  checkSubscription: async () => {},
  setSubscription: () => {},
  clearSubscription: () => {},
  hasFailedPayment: () => false,
  isInGracePeriod: () => false,
  renewSubscription: async () => ({ success: false }),
});

// Hook for accessing the subscription context
export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline, withNetworkCheck } = useNetwork();

  // Clear subscription data
  const clearSubscription = useCallback(() => {
    console.log('Clearing subscription data');
    setSubscription(null);
    localStorage.removeItem('subscription_data');
    setHasCheckedSubscription(false);
  }, []);
  
  // Status checker methods
  const hasFailedPayment = useCallback(() => {
    if (!subscription) return false;
    return subscription.status === 'past_due' || subscription.status === 'unpaid';
  }, [subscription]);
  
  const isInGracePeriod = useCallback(() => {
    if (!subscription || !subscription.current_period_end) return false;
    
    const endDate = new Date(subscription.current_period_end);
    const today = new Date();
    const gracePeriodEnd = new Date(endDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
    
    return today > endDate && today <= gracePeriodEnd;
  }, [subscription]);

  // Mock renewal function (to be implemented with Stripe)
  const renewSubscription = useCallback(async () => {
    console.log('Renewing subscription');
    try {
      // This would normally call a Stripe API endpoint
      return { 
        success: true, 
        url: 'https://example.com/payment' 
      };
    } catch (err) {
      console.error('Error in renewSubscription:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err : new Error('Unknown error') 
      };
    }
  }, []);

  // Fetch subscription data from the API
  const fetchSubscriptionData = useCallback(async () => {
    console.log('Fetching subscription data from API');
    try {
      // If we're offline, don't try to fetch from the API
      if (!isOnline) {
        console.log('Offline: Using cached subscription data');
        const cachedData = getStoredSubscriptionData();
        if (cachedData) {
          setSubscription(cachedData);
          setHasCheckedSubscription(true);
        }
        setIsLoading(false);
        return;
      }

      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        console.log('No session found, clearing subscription');
        clearSubscription();
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch subscription from database
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No subscription found, create a default one
          console.log('No subscription found, creating default');
          const defaultSub = await createDefaultSubscription(
            userId,
            setSubscription,
            undefined,
            setIsLoading,
            setHasCheckedSubscription
          );
          return defaultSub;
        } else {
          console.error('Error fetching subscription:', fetchError);
          throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
        }
      }

      if (data) {
        console.log('Subscription found:', data);
        setSubscription(data as SubscriptionPlan);
        storeSubscriptionDataLocally(data as SubscriptionPlan);
      } else {
        console.log('No subscription data, creating default');
        const defaultSub = await createDefaultSubscription(
          userId,
          setSubscription,
          undefined,
          setIsLoading,
          setHasCheckedSubscription
        );
        return defaultSub;
      }
    } catch (err) {
      console.error('Error in fetchSubscriptionData:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching subscription'));
      
      // On error, try to use cached data
      const cachedData = getStoredSubscriptionData();
      if (cachedData) {
        console.log('Using cached subscription data after error');
        setSubscription(cachedData);
      }
      
      // Show a toast message
      toast.error('Failed to fetch subscription data. Using cached data if available.');
    } finally {
      setIsLoading(false);
      setHasCheckedSubscription(true);
    }
  }, [clearSubscription, isOnline]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    console.log('Manually refreshing subscription data');
    setIsLoading(true);
    await withNetworkCheck(fetchSubscriptionData);
    setIsLoading(false);
  }, [fetchSubscriptionData, withNetworkCheck]);

  // Initialize subscription on mount
  useEffect(() => {
    console.log('SubscriptionProvider initializing');
    
    // If we're offline, try to load from cache first
    if (!isOnline) {
      console.log('Offline: Using cached subscription data on init');
      const cachedData = getStoredSubscriptionData();
      if (cachedData) {
        setSubscription(cachedData);
        setHasCheckedSubscription(true);
        setIsLoading(false);
        return;
      }
    }
    
    // Otherwise fetch fresh data
    fetchSubscriptionData();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        clearSubscription();
      } else if (event === 'SIGNED_IN') {
        fetchSubscriptionData();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [clearSubscription, fetchSubscriptionData, isOnline]);

  // The context value
  const value = {
    subscription,
    data: subscription, // Add data alias for subscription
    isLoading,
    loading: isLoading, // Add loading alias for isLoading
    hasCheckedSubscription,
    error,
    refreshSubscription,
    checkSubscription: refreshSubscription, // Add alias for refreshSubscription
    setSubscription,
    clearSubscription,
    hasFailedPayment,
    isInGracePeriod,
    renewSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

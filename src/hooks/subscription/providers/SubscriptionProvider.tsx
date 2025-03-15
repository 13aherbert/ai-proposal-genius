import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/hooks/network';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/types/subscription';
import { createDefaultSubscription, createStarterSubscription } from '../utils/subscription-creation';
import { storeSubscriptionDataLocally, retrieveSubscriptionDataLocally } from '../feature-access';

// Context type definitions
type SubscriptionContextType = {
  subscription: SubscriptionPlan | null;
  isLoading: boolean;
  hasCheckedSubscription: boolean;
  error: Error | null;
  refreshSubscription: () => Promise<void>;
  setSubscription: (subscription: SubscriptionPlan) => void;
  clearSubscription: () => void;
};

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  hasCheckedSubscription: false,
  error: null,
  refreshSubscription: async () => {},
  setSubscription: () => {},
  clearSubscription: () => {},
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

  // Fetch subscription data from the API
  const fetchSubscriptionData = useCallback(async () => {
    console.log('Fetching subscription data from API');
    try {
      // If we're offline, don't try to fetch from the API
      if (!isOnline) {
        console.log('Offline: Using cached subscription data');
        const cachedData = retrieveSubscriptionDataLocally();
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
      const cachedData = retrieveSubscriptionDataLocally();
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
      const cachedData = retrieveSubscriptionDataLocally();
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
    isLoading,
    hasCheckedSubscription,
    error,
    refreshSubscription,
    setSubscription,
    clearSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

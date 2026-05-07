
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNetwork } from '@/hooks/network';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/types/subscription';
import { createDefaultSubscription, createStarterSubscription } from '../utils/subscription-creation';
import { storeSubscriptionDataLocally, getStoredSubscriptionData } from '../feature-access';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useAuth } from '@/components/AuthProvider';

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
  const { organization, loading: orgLoading } = useCurrentOrganization();
  const { session } = useAuth();
  const hasFetchedRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

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

  // Renew subscription - calls the actual edge function
  const renewSubscription = useCallback(async () => {
    console.log('Renewing subscription');
    try {
      const { data, error } = await supabase.functions.invoke('renew-subscription', {
        body: { 
          subscriptionId: subscription?.stripe_subscription_id,
          customerId: subscription?.stripe_customer_id
        }
      });
      
      if (error) {
        console.error('Error calling renew-subscription:', error);
        return { 
          success: false, 
          error: error 
        };
      }
      
      if (data?.url) {
        return { 
          success: true, 
          url: data.url 
        };
      }
      
      return { 
        success: false, 
        error: new Error('No URL returned from payment portal') 
      };
    } catch (err) {
      console.error('Error in renewSubscription:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err : new Error('Unknown error') 
      };
    }
  }, [subscription?.stripe_subscription_id, subscription?.stripe_customer_id]);

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

      // Use session from AuthProvider instead of fetching independently
      if (!session) {
        console.log('No session found, clearing subscription');
        clearSubscription();
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;

      // If no organization yet, wait for it to load
      if (!organization?.id) {
        // If org is still loading, keep isLoading true and wait
        if (orgLoading) {
          return; // useEffect will re-trigger when orgLoading changes
        }
        // Org finished loading but is null -- fall through to check
        // the user's individual subscription table as a fallback
        console.log('No organization found, checking user subscription table');
        const { data: userSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (userSub) {
          const subscriptionPlan: SubscriptionPlan = {
            subscription_id: userSub.subscription_id,
            user_id: userId,
            status: userSub.status as SubscriptionPlan['status'],
            plan_type: userSub.plan_type,
            current_period_end: userSub.current_period_end,
            project_limit: userSub.project_limit,
            features: (userSub.features as Record<string, any>) || {},
            stripe_customer_id: userSub.stripe_customer_id,
            stripe_subscription_id: userSub.stripe_subscription_id,
            created_at: userSub.created_at,
            updated_at: userSub.updated_at,
            cancel_at_period_end: userSub.cancel_at_period_end || false,
          };
          setSubscription(subscriptionPlan);
          storeSubscriptionDataLocally(subscriptionPlan);
          return;
        }

        // Only create a default starter if there's truly no subscription anywhere
        const defaultSub = await createDefaultSubscription(
          userId, setSubscription, undefined, setIsLoading, setHasCheckedSubscription
        );
        return defaultSub;
      }

      // Fetch organization subscription from database
      const { data, error: fetchError } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching organization subscription:', fetchError);
        // Fall back to a default starter so consumers can render instead of
        // hanging in a loading state.
        const defaultSub = await createDefaultSubscription(
          userId, setSubscription, undefined, setIsLoading, setHasCheckedSubscription
        );
        return defaultSub;
      }

      if (!data) {
        // No subscription row found — use default starter.
        console.log('No organization subscription found, creating default');
        const defaultSub = await createDefaultSubscription(
          userId, setSubscription, undefined, setIsLoading, setHasCheckedSubscription
        );
        return defaultSub;
      }

      // Convert organization subscription to SubscriptionPlan format
      const subscriptionPlan: SubscriptionPlan = {
        subscription_id: data.subscription_id,
        user_id: userId,
        status: data.status as SubscriptionPlan['status'],
        plan_type: data.plan_type,
        current_period_end: data.current_period_end,
        project_limit: data.project_limit,
        features: (data.features as Record<string, any>) || {},
        stripe_customer_id: data.stripe_customer_id,
        stripe_subscription_id: data.stripe_subscription_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        cancel_at_period_end: data.cancel_at_period_end || false,
      };

      setSubscription(subscriptionPlan);
      storeSubscriptionDataLocally(subscriptionPlan);
      console.error('Error in fetchSubscriptionData:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching subscription'));
      
      // On error, try to use cached data
      const cachedData = getStoredSubscriptionData();
      if (cachedData) {
        console.log('Using cached subscription data after error');
        setSubscription(cachedData);
      }
      
      // Error state is set above; consumers can react to it. No toast here to avoid spam.
    } finally {
      setIsLoading(false);
      setHasCheckedSubscription(true);
    }
  }, [clearSubscription, isOnline, organization?.id, orgLoading, session]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    console.log('Manually refreshing subscription data');
    setIsLoading(true);
    await fetchSubscriptionData();
    setIsLoading(false);
  }, [fetchSubscriptionData]);

  // Initialize subscription on mount - stabilized to prevent re-render storms
  useEffect(() => {
    // Wait for organization to load before fetching subscription
    if (orgLoading) return;
    
    // No session means no subscription
    if (!session?.user) {
      clearSubscription();
      setIsLoading(false);
      return;
    }

    // Deduplicate: only fetch if org ID actually changed
    const orgKey = organization?.id || 'none';
    if (hasFetchedRef.current === orgKey) return;
    if (isFetchingRef.current) return;
    
    // If we're offline, try to load from cache first
    if (!isOnline) {
      const cachedData = getStoredSubscriptionData();
      if (cachedData) {
        setSubscription(cachedData);
        setHasCheckedSubscription(true);
        setIsLoading(false);
      }
      return;
    }
    
    isFetchingRef.current = true;
    hasFetchedRef.current = orgKey;
    fetchSubscriptionData().finally(() => {
      isFetchingRef.current = false;
    });
  }, [session?.user?.id, organization?.id, orgLoading, isOnline, fetchSubscriptionData, clearSubscription]);

  // Listen for auth state changes separately (stable effect)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        hasFetchedRef.current = null;
        clearSubscription();
      } else if (event === 'SIGNED_IN') {
        hasFetchedRef.current = null; // Reset so next render fetches
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [clearSubscription]);

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

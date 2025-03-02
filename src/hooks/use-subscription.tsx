
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  SubscriptionPlan, 
  SubscriptionContextType, 
  SubscriptionStatus,
  DEFAULT_TRIAL_SUBSCRIPTION
} from '@/types/subscription';
import { 
  isPastGracePeriod, 
  isInGracePeriod, 
  isActive, 
  hasFailedPayment 
} from './subscription/use-subscription-helpers';
import { 
  createTrialSubscription, 
  renewSubscription as renewUserSubscription 
} from './subscription/use-subscription-actions';

// Create context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  data: null,
  subscription: null,
  loading: true,
  isLoading: true,
  error: null,
  checkSubscription: async () => {},
  renewSubscription: async () => ({}),
  isPastGracePeriod: () => false,
  isInGracePeriod: () => false,
  isActive: () => false,
  hasFailedPayment: () => false,
});

/**
 * Provider component for subscription data and functionality
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();

  /**
   * Fetches the user's subscription data from the database
   */
  const checkSubscription = async () => {
    try {
      if (!session?.user) {
        setSubscription(null);
        return;
      }

      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, created_at, updated_at, status, plan_type, project_limit, features, current_period_end, stripe_customer_id, stripe_subscription_id, cancel_at_period_end')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      
      if (data) {
        // Safely type-cast the data object with proper validation
        const subscriptionData: SubscriptionPlan = {
          subscription_id: data.subscription_id,
          user_id: data.user_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
          status: (data.status || 'trialing') as SubscriptionStatus,
          plan_type: data.plan_type || 'trial',
          project_limit: data.project_limit || 3,
          // Ensure features is an object, not a string or other type
          features: typeof data.features === 'object' && data.features !== null 
            ? data.features as Record<string, any>
            : {},
          current_period_end: data.current_period_end,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id,
          cancel_at_period_end: data.cancel_at_period_end || false
        };
        
        setSubscription(subscriptionData);
      } else {
        // Create new trial subscription
        const newSubscription = await createTrialSubscription(session.user.id);
        setSubscription(newSubscription);
      }
    } catch (e) {
      console.error('Error fetching subscription:', e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renews a failed or expired subscription
   * @returns Promise with URL for the billing portal
   */
  const renewSubscription = async () => {
    try {
      console.log("Attempting subscription renewal with data:", subscription);
      
      if (!subscription) {
        return { error: "No subscription data available" };
      }
      
      const result = await renewUserSubscription(
        subscription.stripe_subscription_id,
        subscription.stripe_customer_id
      );
      
      if (result.success) {
        // Refresh subscription data after successful renewal
        await checkSubscription();
      }
      
      return result;
    } catch (error) {
      console.error("Error in renewSubscription:", error);
      return { success: false, error };
    }
  };

  // Local wrapper functions for the helper functions
  const checkIsPastGracePeriod = () => isPastGracePeriod(subscription);
  const checkIsInGracePeriod = () => isInGracePeriod(subscription);
  const checkIsActive = () => isActive(subscription);
  const checkHasFailedPayment = () => hasFailedPayment(subscription);

  // Fetch subscription data when session changes
  useEffect(() => {
    checkSubscription();
  }, [session]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        data: subscription,
        subscription,
        loading,
        isLoading: loading,
        error,
        checkSubscription,
        renewSubscription,
        isPastGracePeriod: checkIsPastGracePeriod,
        isInGracePeriod: checkIsInGracePeriod,
        isActive: checkIsActive,
        hasFailedPayment: checkHasFailedPayment
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription data and functions
 * @returns Subscription context values
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

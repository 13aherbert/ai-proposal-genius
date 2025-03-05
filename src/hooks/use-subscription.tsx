
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
import { toast } from 'sonner';

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

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const checkSubscription = async () => {
    try {
      if (!session?.user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      console.log("Checking subscription for user:", session.user.id);
      setLoading(true);

      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, created_at, updated_at, status, plan_type, project_limit, features, current_period_end, stripe_customer_id, stripe_subscription_id, cancel_at_period_end')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      
      if (data) {
        console.log("Found subscription data:", data);
        const subscriptionData: SubscriptionPlan = {
          subscription_id: data.subscription_id,
          user_id: data.user_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
          status: (data.status || 'trialing') as SubscriptionStatus,
          plan_type: data.plan_type || 'trial',
          project_limit: data.project_limit || 3,
          features: typeof data.features === 'object' && data.features !== null 
            ? data.features as Record<string, any>
            : {},
          current_period_end: data.current_period_end,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id,
          cancel_at_period_end: data.cancel_at_period_end || false
        };
        
        console.log("Processed subscription data:", subscriptionData);
        setSubscription(subscriptionData);
        
        // Show a toast notification when a subscription changes from the previous state
        if (subscription && 
            (subscription.status !== subscriptionData.status || 
             subscription.plan_type !== subscriptionData.plan_type)) {
          toast.success(`Subscription updated to ${subscriptionData.plan_type} (${subscriptionData.status})`, {
            id: "subscription-update",
          });
        }
      } else {
        console.log("No subscription found, creating trial subscription");
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

  const renewSubscription = async () => {
    try {
      console.log("Attempting subscription renewal with data:", subscription);
      
      if (!subscription) {
        console.error("No subscription data available for renewal");
        return { success: false, error: { message: "No subscription data available" } };
      }
      
      console.log("Using subscription data for renewal:", {
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id
      });
      
      const result = await renewUserSubscription(
        subscription.stripe_subscription_id,
        subscription.stripe_customer_id
      );
      
      if (result.success) {
        await checkSubscription();
      }
      
      return result;
    } catch (error) {
      console.error("Error in renewSubscription:", error);
      return { success: false, error };
    }
  };

  const checkIsPastGracePeriod = () => isPastGracePeriod(subscription);
  const checkIsInGracePeriod = () => isInGracePeriod(subscription);
  const checkIsActive = () => isActive(subscription);
  const checkHasFailedPayment = () => hasFailedPayment(subscription);

  useEffect(() => {
    let pollInterval: number | undefined;
    
    if (session?.user) {
      checkSubscription();
      
      // Poll more frequently (every 10 seconds) to catch subscription changes
      pollInterval = window.setInterval(() => {
        console.log("Polling for subscription updates");
        setLastRefresh(Date.now());
      }, 10000);
    }
    
    return () => {
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      checkSubscription();
    }
  }, [lastRefresh, session]);

  useEffect(() => {
    const handlePaymentStatusParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      
      if (paymentStatus) {
        console.log("Payment status detected in URL, refreshing subscription immediately");
        await checkSubscription();
        
        // Check the subscription again after a short delay to catch backend updates
        setTimeout(() => {
          console.log("Performing follow-up subscription check after payment status detected");
          checkSubscription();
        }, 3000);
        
        // And once more to ensure we have the latest data
        setTimeout(() => {
          console.log("Final subscription check after payment status detected");
          checkSubscription();
        }, 10000);
      }
    };
    
    handlePaymentStatusParams();
  }, [window.location.search]);

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

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};


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
  const [initialFetchCompleted, setInitialFetchCompleted] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  const checkSubscription = async () => {
    try {
      if (!session?.user) {
        console.log("No active session, clearing subscription data");
        setSubscription(null);
        setLoading(false);
        setSubscriptionChecked(true);
        return;
      }

      if (subscriptionChecked && subscription) {
        console.log("Subscription already checked, skipping redundant fetch");
        return;
      }

      console.log("Checking subscription for user:", session.user.id, session.user.email);
      setLoading(true);

      // Query subscriptions table directly
      const { data: directData, error: directError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (directError) {
        console.error("Error fetching subscription:", directError);
        throw directError;
      }

      if (directData) {
        console.log("Found subscription data:", directData);
        // Ensure the status is a valid SubscriptionStatus
        const validatedStatus = validateSubscriptionStatus(directData.status);
        const validatedData: SubscriptionPlan = {
          ...directData,
          status: validatedStatus
        };
        setSubscription(validatedData);
        setInitialFetchCompleted(true);
      } else {
        console.log("No subscription found, creating trial subscription");
        const newSubscription = await createTrialSubscription(session.user.id);
        if (newSubscription) {
          setSubscription(newSubscription);
        }
        setInitialFetchCompleted(true);
      }
    } catch (e) {
      console.error('Error fetching subscription:', e);
      setError(e as Error);
    } finally {
      setLoading(false);
      setSubscriptionChecked(true);
    }
  };

  // Helper function to validate subscription status
  const validateSubscriptionStatus = (status: string): SubscriptionStatus => {
    const validStatuses: SubscriptionStatus[] = [
      'trialing', 'active', 'canceled', 'incomplete', 
      'incomplete_expired', 'past_due', 'unpaid'
    ];
    
    return validStatuses.includes(status as SubscriptionStatus) 
      ? status as SubscriptionStatus 
      : 'trialing'; // Default fallback
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
    if (session?.user && !initialFetchCompleted) {
      console.log("Session available, checking subscription");
      checkSubscription();
    } else if (!session?.user) {
      console.log("No session available, subscription data cleared");
      setSubscription(null);
      setLoading(false);
      setInitialFetchCompleted(false);
      setSubscriptionChecked(false);
    }
  }, [session]);

  useEffect(() => {
    const handlePaymentStatusParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const paymentIntent = urlParams.get('payment_intent');
      
      if (paymentStatus === 'failed' && paymentIntent) {
        console.log("Payment status detected in URL:", paymentStatus);
        
        await checkSubscription();
        
        const checkTimes = [1000, 3000, 5000];
        
        checkTimes.forEach(delay => {
          setTimeout(() => {
            console.log(`Follow-up subscription check after ${delay}ms`);
            setLastRefresh(Date.now());
          }, delay);
        });
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

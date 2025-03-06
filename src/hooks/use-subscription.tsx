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
  const [pollCount, setPollCount] = useState(0);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);
  const [initialFetchCompleted, setInitialFetchCompleted] = useState(false);

  const checkSubscription = async () => {
    try {
      if (!session?.user) {
        console.log("No active session, clearing subscription data");
        setSubscription(null);
        setLoading(false);
        return;
      }

      console.log("Checking subscription for user:", session.user.id, session.user.email);
      setLoading(true);

      // Try direct fetch from the edge function first
      if (!directFetchAttempted) {
        try {
          if (!session.access_token) {
            console.error("No access token available");
            throw new Error("No access token available");
          }
          
          console.log("Attempting direct fetch from edge function with token:", 
            session.access_token.substring(0, 10) + "...");
          
          const { data: directData, error: directError } = await supabase.functions.invoke('check-subscription', {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          
          console.log("Direct fetch response:", directData, directError);
          setDirectFetchAttempted(true);
          
          if (directError) {
            console.error("Error from edge function:", directError);
            throw directError;
          }
          
          if (!directData) {
            console.error("No data returned from edge function");
            throw new Error("No data returned from edge function");
          }
          
          if (directData.error) {
            console.warn("Edge function returned error:", directData.error);
            // Continue to fallback method instead of throwing
          } else if (directData.subscription) {
            console.log("Direct fetch successful:", directData);
            const subscriptionData: SubscriptionPlan = {
              subscription_id: directData.subscription.subscription_id,
              user_id: directData.subscription.user_id,
              created_at: directData.subscription.created_at,
              updated_at: directData.subscription.updated_at,
              status: (directData.subscription.status || 'trialing') as SubscriptionStatus,
              plan_type: directData.subscription.plan_type || 'trial',
              project_limit: directData.subscription.project_limit || 3,
              features: typeof directData.subscription.features === 'object' && directData.subscription.features !== null 
                ? directData.subscription.features as Record<string, any>
                : {},
              current_period_end: directData.subscription.current_period_end,
              stripe_customer_id: directData.subscription.stripe_customer_id,
              stripe_subscription_id: directData.subscription.stripe_subscription_id,
              cancel_at_period_end: directData.subscription.cancel_at_period_end || false
            };
            
            setSubscription(subscriptionData);
            setLoading(false);
            setInitialFetchCompleted(true);
            return;
          }
        } catch (directFetchError) {
          console.error("Error during direct fetch:", directFetchError);
          // Continue to fallback method
        }
      }

      // Fall back to database query if direct fetch fails
      console.log("Falling back to direct database query");
      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, created_at, updated_at, status, plan_type, project_limit, features, current_period_end, stripe_customer_id, stripe_subscription_id, cancel_at_period_end')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error("Error in fallback database query:", subError);
        throw subError;
      }
      
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
        
        // Compare with previous subscription to check for changes
        if (subscription && 
            (subscription.status !== subscriptionData.status || 
             subscription.plan_type !== subscriptionData.plan_type)) {
          toast.success(`Subscription updated to ${subscriptionData.plan_type} (${subscriptionData.status})`, {
            id: "subscription-update",
          });
        }
        
        setSubscription(subscriptionData);
        setInitialFetchCompleted(true);
      } else {
        console.log("No subscription found, creating trial subscription");
        const newSubscription = await createTrialSubscription(session.user.id);
        setSubscription(newSubscription);
        setInitialFetchCompleted(true);
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
    if (session?.user && !initialFetchCompleted) {
      console.log("Session available, checking subscription");
      setDirectFetchAttempted(false); // Reset for fresh fetch
      checkSubscription();
      
      const pollInterval = window.setInterval(() => {
        console.log("Polling for subscription updates");
        setPollCount(prev => prev + 1);
      }, 30000); // Poll every 30 seconds (increased from 5 seconds)
      
      return () => {
        window.clearInterval(pollInterval);
      };
    } else if (!session?.user) {
      console.log("No session available, subscription data cleared");
      setSubscription(null);
      setLoading(false);
      setInitialFetchCompleted(false);
      setDirectFetchAttempted(false);
    }
  }, [session, initialFetchCompleted]);

  useEffect(() => {
    if (session?.user && initialFetchCompleted) {
      checkSubscription();
    }
  }, [pollCount, lastRefresh, session]);

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

  const forceRefresh = () => {
    setLastRefresh(Date.now());
  };

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


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
import { getProjectLimitForPlan } from './subscription/feature-access';

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
  const [forceRecheckFlag, setForceRecheckFlag] = useState(0);

  const checkSubscription = async (forceRecheck = false) => {
    try {
      if (!session?.user) {
        console.log("No active session, clearing subscription data");
        setSubscription(null);
        setLoading(false);
        setSubscriptionChecked(true);
        return;
      }

      if (subscriptionChecked && subscription && !forceRecheck) {
        console.log("Subscription already checked, skipping redundant fetch. Use forceRecheck=true to override.");
        return;
      }

      console.log("Checking subscription for user:", session.user.id, session.user.email);
      setLoading(true);
      setError(null); // Clear any previous errors

      // Query subscriptions table directly with no-cache headers
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
        
        // Convert JSON features to Record<string, any>
        let parsedFeatures: Record<string, any> = {};
        if (directData.features) {
          try {
            // If features is a string, parse it to an object
            if (typeof directData.features === 'string') {
              parsedFeatures = JSON.parse(directData.features);
            } 
            // If features is already an object, use it directly
            else if (typeof directData.features === 'object') {
              parsedFeatures = directData.features as Record<string, any>;
            }
          } catch (e) {
            console.error("Error parsing features:", e);
            // Use empty object as fallback
            parsedFeatures = {};
          }
        }
        
        // Normalize plan type to lowercase for consistent comparison
        const normalizedPlanType = directData.plan_type?.toLowerCase() || 'trial';
        
        // Create validated subscription data with correct types
        const validatedData: SubscriptionPlan = {
          subscription_id: directData.subscription_id,
          user_id: directData.user_id,
          status: validatedStatus,
          plan_type: normalizedPlanType,
          current_period_end: directData.current_period_end,
          created_at: directData.created_at,
          updated_at: directData.updated_at || directData.created_at,
          project_limit: directData.project_limit || getProjectLimitForPlan(normalizedPlanType),
          features: parsedFeatures,
          stripe_customer_id: directData.stripe_customer_id,
          stripe_subscription_id: directData.stripe_subscription_id,
          cancel_at_period_end: directData.cancel_at_period_end || false
        };
        
        // For starter plans, ensure the project limit is set to 10
        if (normalizedPlanType === 'starter' && validatedData.project_limit !== 10) {
          console.log(`Correcting starter plan project limit locally from ${validatedData.project_limit} to 10`);
          validatedData.project_limit = 10;
          
          // Update the database with the correct limit
          const { data: updateData, error: updateError } = await supabase
            .from('subscriptions')
            .update({ project_limit: 10 })
            .eq('subscription_id', directData.subscription_id);
            
          if (updateError) {
            console.error("Error updating project limit in database:", updateError);
          } else {
            console.log("Successfully updated project limit in database to 10");
          }
        }
        
        console.log("Processed subscription data:", validatedData);
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
      // Don't stop loading on error if we haven't completed initial fetch
      if (initialFetchCompleted) {
        setLoading(false);
      }
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
        // Force a recheck of subscription
        setForceRecheckFlag(prev => prev + 1);
        await checkSubscription(true);
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

  // Force recheck on flag change
  useEffect(() => {
    if (forceRecheckFlag > 0 && session?.user) {
      console.log("Force rechecking subscription");
      checkSubscription(true);
    }
  }, [forceRecheckFlag]);

  useEffect(() => {
    const handlePaymentStatusParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const paymentIntent = urlParams.get('payment_intent');
      
      if (paymentStatus === 'failed' && paymentIntent) {
        console.log("Payment status detected in URL:", paymentStatus);
        
        await checkSubscription(true);
        
        const checkTimes = [1000, 3000, 5000];
        
        checkTimes.forEach(delay => {
          setTimeout(() => {
            console.log(`Follow-up subscription check after ${delay}ms`);
            setLastRefresh(Date.now());
            setForceRecheckFlag(prev => prev + 1);
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
        checkSubscription: (forceRecheck = true) => checkSubscription(forceRecheck),
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

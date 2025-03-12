import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  SubscriptionPlan, 
  SubscriptionContextType, 
  SubscriptionStatus,
  DEFAULT_TRIAL_SUBSCRIPTION,
  SUBSCRIPTION_PLAN_LIMITS
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
import { withRetry } from '@/utils/network';

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const checkInProgressRef = useRef(false);
  const localStorageCheckedRef = useRef(false);

  useEffect(() => {
    if (!localStorageCheckedRef.current && session?.user && !subscription) {
      try {
        const storedDataStr = localStorage.getItem('subscriptionData');
        if (storedDataStr) {
          const { data, timestamp } = JSON.parse(storedDataStr);
          const isFresh = Date.now() - timestamp < 30 * 60 * 1000;
          
          if (isFresh && data && data.user_id === session.user.id) {
            console.log("Using cached subscription data from localStorage", data);
            setSubscription(data);
            setLoading(false);
            setInitialFetchCompleted(true);
          }
        }
      } catch (e) {
        console.error("Error loading subscription from localStorage:", e);
      }
      
      localStorageCheckedRef.current = true;
    }
  }, [session, subscription]);

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

      if (checkInProgressRef.current && !forceRecheck) {
        console.log("Subscription check already in progress, skipping");
        return;
      }

      if (abortControllerRef.current) {
        console.log("Cancelling existing subscription check");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      abortControllerRef.current = new AbortController();
      checkInProgressRef.current = true;

      console.log("Checking subscription for user:", session.user.id, session.user.email);
      setLoading(true);
      setError(null);

      const timeoutDuration = 8000;
      timeoutRef.current = window.setTimeout(() => {
        if (checkInProgressRef.current) {
          console.log(`Subscription check timed out after ${timeoutDuration}ms`);
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          
          if (subscription) {
            console.log("Using existing subscription data despite timeout");
            checkInProgressRef.current = false;
            setLoading(false);
          } else {
            console.log("No existing subscription, creating default trial after timeout");
            setError(new Error("Subscription check timed out"));
            createDefaultSubscription();
          }
        }
      }, timeoutDuration);

      try {
        console.log("Calling check-subscription edge function for fresh data");
        
        const edgeFunctionResult = await withRetry(async () => {
          const response = await supabase.functions.invoke('check-subscription', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: { force_refresh: forceRecheck }
          });
          
          console.log("Edge function response:", response);
          
          if (response.error) {
            throw new Error(`Edge function error: ${response.error}`);
          }
          
          return response.data;
        }, 3);

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (edgeFunctionResult?.subscription) {
          console.log("Edge function returned subscription data:", edgeFunctionResult.subscription);
          
          const normalizedPlanType = edgeFunctionResult.subscription.plan_type?.toLowerCase() || 'trial';
          
          let projectLimit = edgeFunctionResult.subscription.project_limit || getProjectLimitForPlan(normalizedPlanType);
          
          if (normalizedPlanType === 'starter' && projectLimit !== 10) {
            console.log(`Correcting starter plan project limit from ${projectLimit} to 10`);
            projectLimit = 10;
          }
          
          const validatedData: SubscriptionPlan = {
            ...edgeFunctionResult.subscription,
            plan_type: normalizedPlanType,
            project_limit: projectLimit
          };
          
          try {
            localStorage.setItem('subscriptionData', JSON.stringify({
              data: validatedData,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("Error storing subscription in localStorage:", e);
          }
          
          console.log("Final processed subscription data:", validatedData);
          setSubscription(validatedData);
          setInitialFetchCompleted(true);
          setLoading(false);
          setSubscriptionChecked(true);
          checkInProgressRef.current = false;
          return;
        }
        
        console.log("Edge function did not return subscription data, falling back to direct query");
      } catch (edgeError) {
        console.error("Error with edge function approach:", edgeError);
        console.log("Falling back to direct database query");
      }

      try {
        const { data: directData, error: directError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (directError) {
          console.error("Error fetching subscription:", directError);
          throw directError;
        }

        if (directData) {
          console.log("Found subscription data:", directData);
          const validatedStatus = validateSubscriptionStatus(directData.status);
          
          let parsedFeatures: Record<string, any> = {};
          if (directData.features) {
            try {
              if (typeof directData.features === 'string') {
                parsedFeatures = JSON.parse(directData.features);
              } else if (typeof directData.features === 'object') {
                parsedFeatures = directData.features as Record<string, any>;
              }
            } catch (e) {
              console.error("Error parsing features:", e);
              parsedFeatures = {};
            }
          }
          
          const normalizedPlanType = directData.plan_type?.toLowerCase() || 'trial';
          
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
          
          if (normalizedPlanType === 'starter' && validatedData.project_limit !== 10) {
            console.log(`Correcting starter plan project limit locally from ${validatedData.project_limit} to 10`);
            validatedData.project_limit = 10;
            
            try {
              const { data: updateData, error: updateError } = await supabase
                .from('subscriptions')
                .update({ 
                  project_limit: 10,
                  plan_type: 'starter'
                })
                .eq('subscription_id', directData.subscription_id);
                
              if (updateError) {
                console.error("Error updating project limit in database:", updateError);
              } else {
                console.log("Successfully updated project limit in database to 10");
              }
            } catch (updateErr) {
              console.error("Failed to update project limit:", updateErr);
            }
          }
          
          console.log("Processed subscription data:", validatedData);
          setSubscription(validatedData);
          setInitialFetchCompleted(true);
          setLoading(false);
          setSubscriptionChecked(true);
          checkInProgressRef.current = false;
          return;
        } else {
          console.log("No subscription found, creating trial subscription");
          createDefaultSubscription();
        }
      } catch (directError) {
        console.error("Error with direct database query:", directError);
        if (subscription) {
          console.log("Using existing subscription data despite error");
          setLoading(false);
        } else {
          createDefaultSubscription();
        }
      }
    } catch (e) {
      console.error('Error fetching subscription:', e);
      setError(e as Error);
      
      if (initialFetchCompleted || subscription) {
        setLoading(false);
      } else {
        createDefaultSubscription();
      }
    } finally {
      checkInProgressRef.current = false;
      setTimeout(() => {
        if (loading) {
          console.log("Forcing loading state to false after delay");
          setLoading(false);
        }
      }, 1000);
    }
  };

  const createDefaultSubscription = async () => {
    try {
      console.log("Creating default trial subscription as fallback");
      const newSubscription = await createTrialSubscription(session?.user?.id || '');
      if (newSubscription) {
        setSubscription(newSubscription);
      } else {
        console.log("Using hardcoded default trial subscription");
        setSubscription({
          subscription_id: crypto.randomUUID(),
          user_id: session?.user?.id || '',
          status: 'trialing',
          plan_type: 'trial',
          project_limit: 3,
          features: {},
          current_period_end: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cancel_at_period_end: false
        });
      }
      setInitialFetchCompleted(true);
    } catch (error) {
      console.error("Failed to create default subscription:", error);
      setSubscription({
        subscription_id: crypto.randomUUID(),
        user_id: session?.user?.id || '',
        status: 'trialing',
        plan_type: 'trial',
        project_limit: 3,
        features: {},
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cancel_at_period_end: false
      });
    } finally {
      setLoading(false);
      setSubscriptionChecked(true);
    }
  };

  const validateSubscriptionStatus = (status: string): SubscriptionStatus => {
    const validStatuses: SubscriptionStatus[] = [
      'trialing', 'active', 'canceled', 'incomplete', 
      'incomplete_expired', 'past_due', 'unpaid'
    ];
    
    return validStatuses.includes(status as SubscriptionStatus) 
      ? status as SubscriptionStatus 
      : 'trialing';
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
      checkSubscription(true);
    } else if (!session?.user) {
      console.log("No session available, subscription data cleared");
      setSubscription(null);
      setLoading(false);
      setInitialFetchCompleted(false);
      setSubscriptionChecked(false);
    }
  }, [session]);

  useEffect(() => {
    if (forceRecheckFlag > 0 && session?.user) {
      console.log("Force rechecking subscription");
      checkSubscription(true);
    }
  }, [forceRecheckFlag]);

  useEffect(() => {
    if (session?.user) {
      const refreshTimer = setInterval(() => {
        console.log("Regular refresh timer: rechecking subscription");
        checkSubscription(true);
      }, 60000);
      
      return () => clearInterval(refreshTimer);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && loading) {
      const fallbackTimer = setTimeout(() => {
        if (loading && !subscription) {
          console.log("Loading timeout reached, using fallback subscription data");
          createDefaultSubscription();
        }
      }, 5000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [session, loading, subscription]);

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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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


import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  SubscriptionPlan, 
  SubscriptionContextType, 
  SubscriptionStatus,
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
import { 
  getProjectLimitForPlan, 
  storeSubscriptionDataLocally, 
  getStoredSubscriptionData 
} from './subscription/feature-access';
import { withRetry } from '@/utils/network';

const LOCAL_STORAGE_KEY = 'subscriptionData';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
  const lastCheckTimestampRef = useRef<number>(0);

  // Load cached subscription data on initial render
  useEffect(() => {
    try {
      if (session?.user && !subscription) {
        console.log("Checking for cached subscription data");
        const storedData = getStoredSubscriptionData();
        
        if (storedData && storedData.user_id === session.user.id) {
          console.log("Using cached subscription data:", storedData);
          setSubscription(storedData);
          setLoading(false);
          setInitialFetchCompleted(true);
          setSubscriptionChecked(true);
        }
      }
    } catch (e) {
      console.error("Error loading from cache:", e);
    }
  }, [session, subscription]);

  const checkSubscription = useCallback(async (forceRecheck = false) => {
    // Don't run if no session exists
    if (!session?.user) {
      console.log("No active session, clearing subscription data");
      setSubscription(null);
      setLoading(false);
      setSubscriptionChecked(true);
      return;
    }

    // Don't run if check is in progress
    if (checkInProgressRef.current && !forceRecheck) {
      console.log("Subscription check already in progress, skipping");
      return;
    }

    // Don't run if we've checked recently (unless forced)
    const now = Date.now();
    if (!forceRecheck && now - lastCheckTimestampRef.current < 10000) {
      console.log("Subscription checked recently, skipping");
      return;
    }

    // Clear any existing timeout or abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set up new abort controller and mark check as in progress
    abortControllerRef.current = new AbortController();
    checkInProgressRef.current = true;
    lastCheckTimestampRef.current = now;
    
    try {
      console.log("Checking subscription for user:", session.user.id);
      setLoading(true);
      setError(null);

      // Set up timeout to fallback to cached data if available
      const timeoutDuration = 5000;
      timeoutRef.current = window.setTimeout(() => {
        if (checkInProgressRef.current) {
          console.log(`Subscription check timed out after ${timeoutDuration}ms`);
          
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }

          // Use cached data if available
          const cachedData = getStoredSubscriptionData();
          if (cachedData && cachedData.user_id === session.user.id) {
            console.log("Using cached subscription data after timeout:", cachedData);
            setSubscription(cachedData);
            setLoading(false);
            setSubscriptionChecked(true);
          } else if (subscription) {
            console.log("Using existing subscription data despite timeout");
            setLoading(false);
          } else {
            console.log("No cached data available, falling back to trial");
            setError(new Error("Subscription check timed out"));
            createDefaultSubscription();
          }
          
          checkInProgressRef.current = false;
        }
      }, timeoutDuration);

      // Try to get subscription data from edge function first
      console.log("Calling check-subscription edge function");
      const { data: edgeFunctionResult, error: edgeFunctionError } = await supabase.functions.invoke(
        'check-subscription',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          body: { force_refresh: forceRecheck },
        }
      );

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Handle edge function error
      if (edgeFunctionError) {
        console.error("Edge function error:", edgeFunctionError);
        throw new Error(`Edge function error: ${edgeFunctionError}`);
      }

      // Process and store subscription data if available
      if (edgeFunctionResult?.subscription) {
        console.log("Edge function returned subscription data:", edgeFunctionResult.subscription);
        
        // Normalize plan type
        const normalizedPlanType = edgeFunctionResult.subscription.plan_type?.toLowerCase() || 'trial';
        
        // Ensure correct project limit, particularly for starter plans
        let projectLimit = edgeFunctionResult.subscription.project_limit;
        
        if (normalizedPlanType === 'starter' && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log(`Correcting starter plan project limit from ${projectLimit} to ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
        } else if (normalizedPlanType === 'pro' && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.pro) {
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.pro;
        } else if ((normalizedPlanType === 'trial' || !normalizedPlanType) && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.trial) {
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.trial;
        }
        
        // Prepare validated subscription data
        const validatedData: SubscriptionPlan = {
          ...edgeFunctionResult.subscription,
          plan_type: normalizedPlanType,
          project_limit: projectLimit
        };
        
        // Store in local storage
        storeSubscriptionDataLocally(validatedData);
        
        // Update state
        setSubscription(validatedData);
        setInitialFetchCompleted(true);
        setLoading(false);
        setSubscriptionChecked(true);
        checkInProgressRef.current = false;
        return;
      }
      
      // No data from edge function, try direct DB query
      console.log("Edge function did not return subscription data, falling back to direct query");
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
        console.log("Found subscription data from direct query:", directData);
        
        // Normalize plan type
        const normalizedPlanType = directData.plan_type?.toLowerCase() || 'trial';
        
        // Determine correct project limit
        let projectLimit = directData.project_limit;
        
        if (normalizedPlanType === 'starter' && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log(`Correcting starter plan project limit from ${projectLimit} to ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
          
          // Update the database with correct limit
          try {
            await supabase
              .from('subscriptions')
              .update({ 
                project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
                plan_type: 'starter'
              })
              .eq('subscription_id', directData.subscription_id);
            
            console.log("Successfully updated project limit in database to correct value");
          } catch (updateErr) {
            console.error("Failed to update project limit:", updateErr);
          }
        }
        
        // Prepare validated subscription data
        const validatedData: SubscriptionPlan = {
          subscription_id: directData.subscription_id,
          user_id: directData.user_id,
          status: directData.status || 'trialing',
          plan_type: normalizedPlanType,
          current_period_end: directData.current_period_end,
          created_at: directData.created_at,
          updated_at: directData.updated_at || directData.created_at,
          project_limit: projectLimit || getProjectLimitForPlan(normalizedPlanType),
          features: directData.features || {},
          stripe_customer_id: directData.stripe_customer_id,
          stripe_subscription_id: directData.stripe_subscription_id,
          cancel_at_period_end: directData.cancel_at_period_end || false
        };
        
        // Store in local storage
        storeSubscriptionDataLocally(validatedData);
        
        // Update state
        setSubscription(validatedData);
        setInitialFetchCompleted(true);
        setLoading(false);
        setSubscriptionChecked(true);
        checkInProgressRef.current = false;
        return;
      }
      
      // No subscription found, create trial subscription
      console.log("No subscription found, creating trial subscription");
      createDefaultSubscription();
      
    } catch (e) {
      console.error('Error fetching subscription:', e);
      setError(e as Error);
      
      // Use cached data if available
      const cachedData = getStoredSubscriptionData();
      if (cachedData && cachedData.user_id === session.user.id) {
        console.log("Using cached subscription data after error:", cachedData);
        setSubscription(cachedData);
        setLoading(false);
      } else if (initialFetchCompleted || subscription) {
        setLoading(false);
      } else {
        createDefaultSubscription();
      }
    } finally {
      checkInProgressRef.current = false;
      
      // Ensure loading is set to false
      setTimeout(() => {
        if (loading) {
          console.log("Forcing loading state to false after delay");
          setLoading(false);
        }
      }, 500);
    }
  }, [session, initialFetchCompleted, subscription]);

  // Create a default trial subscription
  const createDefaultSubscription = async () => {
    try {
      console.log("Creating default trial subscription");
      const newSubscription = await createTrialSubscription(session?.user?.id || '');
      
      if (newSubscription) {
        console.log("Successfully created new trial subscription:", newSubscription);
        storeSubscriptionDataLocally(newSubscription);
        setSubscription(newSubscription);
      } else {
        console.log("Using hardcoded default trial subscription");
        const defaultSub = {
          subscription_id: crypto.randomUUID(),
          user_id: session?.user?.id || '',
          status: 'trialing' as SubscriptionStatus,
          plan_type: 'trial',
          project_limit: SUBSCRIPTION_PLAN_LIMITS.trial,
          features: {},
          current_period_end: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cancel_at_period_end: false
        };
        storeSubscriptionDataLocally(defaultSub);
        setSubscription(defaultSub);
      }
      
      setInitialFetchCompleted(true);
    } catch (error) {
      console.error("Failed to create default subscription:", error);
      const defaultSub = {
        subscription_id: crypto.randomUUID(),
        user_id: session?.user?.id || '',
        status: 'trialing' as SubscriptionStatus,
        plan_type: 'trial',
        project_limit: SUBSCRIPTION_PLAN_LIMITS.trial,
        features: {},
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cancel_at_period_end: false
      };
      storeSubscriptionDataLocally(defaultSub);
      setSubscription(defaultSub);
    } finally {
      setLoading(false);
      setSubscriptionChecked(true);
    }
  };

  // Renew a subscription
  const renewSubscription = async () => {
    try {
      console.log("Attempting subscription renewal with data:", subscription);
      
      if (!subscription) {
        console.error("No subscription data available for renewal");
        return { success: false, error: { message: "No subscription data available" } };
      }
      
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

  // Status check functions
  const checkIsPastGracePeriod = () => isPastGracePeriod(subscription);
  const checkIsInGracePeriod = () => isInGracePeriod(subscription);
  const checkIsActive = () => isActive(subscription);
  const checkHasFailedPayment = () => hasFailedPayment(subscription);

  // Initial check when session becomes available
  useEffect(() => {
    if (session?.user && !initialFetchCompleted) {
      console.log("Session available, checking subscription");
      checkSubscription(true);
    } else if (!session?.user) {
      console.log("No session available, clearing subscription data");
      setSubscription(null);
      setLoading(false);
      setInitialFetchCompleted(false);
      setSubscriptionChecked(false);
    }
  }, [session, checkSubscription, initialFetchCompleted]);

  // Force recheck when flag changes
  useEffect(() => {
    if (forceRecheckFlag > 0 && session?.user) {
      console.log("Force rechecking subscription");
      checkSubscription(true);
    }
  }, [forceRecheckFlag, session, checkSubscription]);

  // Regular refresh on an interval (much less frequent)
  useEffect(() => {
    if (session?.user) {
      const refreshTimer = setInterval(() => {
        console.log("Regular refresh timer: rechecking subscription");
        checkSubscription(true);
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(refreshTimer);
    }
  }, [session, checkSubscription]);

  // Cleanup function
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

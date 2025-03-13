
import { useCallback, useRef, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  SubscriptionPlan, 
  SubscriptionStatus,
  SUBSCRIPTION_PLAN_LIMITS
} from '@/types/subscription';
import { renewSubscription as renewUserSubscription } from '../use-subscription-actions';
import { 
  storeSubscriptionDataLocally, 
  getStoredSubscriptionData,
  getProjectLimitForPlan
} from '../feature-access';
import { createStarterSubscription, createDefaultSubscription } from '../utils/subscription-creation';

interface UseSubscriptionActionsProps {
  subscription: SubscriptionPlan | null;
  setSubscription: (subscription: SubscriptionPlan | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setInitialFetchCompleted: (completed: boolean) => void;
  setSubscriptionChecked: (checked: boolean) => void;
  isUserStarter: React.RefObject<boolean>;
  session: Session | null;
  initialFetchCompleted: boolean;
  setForceRecheckFlag: (value: React.SetStateAction<number>) => void;
}

/**
 * Custom hook for subscription-related actions
 */
export function useSubscriptionActions({
  subscription,
  setSubscription,
  setLoading,
  setError,
  setInitialFetchCompleted,
  setSubscriptionChecked,
  isUserStarter,
  session,
  initialFetchCompleted,
  setForceRecheckFlag
}: UseSubscriptionActionsProps) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const checkInProgressRef = useRef(false);
  const lastCheckTimestampRef = useRef<number>(0);

  /**
   * Check and update the user's subscription
   */
  const checkSubscription = useCallback(async (forceRecheck = false) => {
    if (!session?.user) {
      console.log("No active session, clearing subscription data");
      setSubscription(null);
      setLoading(false);
      setSubscriptionChecked(true);
      return;
    }

    if (isUserStarter.current && !forceRecheck) {
      console.log("STARTER USER DETECTED: Using cached starter plan");
      
      const cachedData = getStoredSubscriptionData();
      const starterPlan = {
        subscription_id: cachedData?.subscription_id || crypto.randomUUID(),
        user_id: session.user.id,
        status: 'active' as SubscriptionStatus,
        plan_type: 'starter',
        current_period_end: null,
        project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
        features: {},
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: cachedData?.created_at || new Date().toISOString(),
        updated_at: cachedData?.updated_at || new Date().toISOString()
      };
      
      if (cachedData && !forceRecheck) {
        if (cachedData.plan_type?.toLowerCase() === 'starter' && 
            cachedData.project_limit === SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log("Using correctly cached starter plan data");
          setSubscription(cachedData);
          setLoading(false);
          setSubscriptionChecked(true);
          return;
        }
      }
      
      console.log("Setting default starter plan data and requesting fresh data");
      setSubscription(starterPlan);
      storeSubscriptionDataLocally(starterPlan);
    }

    if (checkInProgressRef.current && !forceRecheck) {
      console.log("Subscription check already in progress, skipping");
      return;
    }

    const now = Date.now();
    if (!forceRecheck && now - lastCheckTimestampRef.current < 10000) {
      console.log("Subscription checked recently, skipping");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    abortControllerRef.current = new AbortController();
    checkInProgressRef.current = true;
    lastCheckTimestampRef.current = now;
    
    try {
      console.log("Checking subscription for user:", session.user.id);
      setLoading(true);
      setError(null);

      const timeoutDuration = 5000;
      timeoutRef.current = window.setTimeout(() => {
        if (checkInProgressRef.current) {
          console.log(`Subscription check timed out after ${timeoutDuration}ms`);
          
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }

          if (isUserStarter.current) {
            console.log("TIMEOUT - Force setting starter plan for specific user");
            const starterPlan = {
              subscription_id: crypto.randomUUID(),
              user_id: session.user.id,
              status: 'active' as SubscriptionStatus,
              plan_type: 'starter',
              current_period_end: null,
              project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
              features: {},
              stripe_customer_id: null,
              stripe_subscription_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            setSubscription(starterPlan);
            storeSubscriptionDataLocally(starterPlan);
            setLoading(false);
            setSubscriptionChecked(true);
            checkInProgressRef.current = false;
            return;
          }

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
            createDefaultSubscription(
              session.user.id, 
              setSubscription, 
              () => setInitialFetchCompleted(true),
              setLoading,
              setSubscriptionChecked
            );
          }
          
          checkInProgressRef.current = false;
        }
      }, timeoutDuration);

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

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (edgeFunctionError) {
        console.error("Edge function error:", edgeFunctionError);
        throw new Error(`Edge function error: ${edgeFunctionError}`);
      }

      if (edgeFunctionResult?.subscription) {
        console.log("Edge function returned subscription data:", edgeFunctionResult.subscription);
        
        let normalizedPlanType = edgeFunctionResult.subscription.plan_type?.toLowerCase() || 'trial';
        let projectLimit = edgeFunctionResult.subscription.project_limit;
        
        if (isUserStarter.current) {
          console.log("CRITICAL USER - Force setting starter plan values");
          edgeFunctionResult.subscription.plan_type = 'starter';
          edgeFunctionResult.subscription.project_limit = SUBSCRIPTION_PLAN_LIMITS.starter;
          normalizedPlanType = 'starter';
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
        }
        else if (normalizedPlanType === 'starter' && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log(`Correcting starter plan project limit from ${projectLimit} to ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
        } else if (normalizedPlanType === 'pro' && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.pro) {
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.pro;
        } else if ((normalizedPlanType === 'trial' || !normalizedPlanType) && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.trial) {
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.trial;
        }
        
        const normalizedStatus = edgeFunctionResult.subscription.status?.toLowerCase() || 'trialing';
        const validStatus: SubscriptionStatus = 
          (['trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'].includes(normalizedStatus) 
            ? normalizedStatus as SubscriptionStatus 
            : 'trialing');
        
        const features = typeof edgeFunctionResult.subscription.features === 'object' && edgeFunctionResult.subscription.features !== null
          ? edgeFunctionResult.subscription.features as Record<string, any>
          : {};
        
        const validatedData: SubscriptionPlan = {
          ...edgeFunctionResult.subscription,
          plan_type: normalizedPlanType,
          project_limit: projectLimit,
          status: validStatus,
          features: features
        };
        
        storeSubscriptionDataLocally(validatedData);
        
        setSubscription(validatedData);
        setInitialFetchCompleted(true);
        setLoading(false);
        setSubscriptionChecked(true);
        checkInProgressRef.current = false;
        return;
      }
      
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
        
        let normalizedPlanType = directData.plan_type?.toLowerCase() || 'trial';
        const normalizedStatus = directData.status?.toLowerCase() || 'trialing';
        const validStatus: SubscriptionStatus = 
          (['trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'].includes(normalizedStatus) 
            ? normalizedStatus as SubscriptionStatus 
            : 'trialing');
        
        let projectLimit = directData.project_limit;
        
        if (isUserStarter.current) {
          console.log("CRITICAL USER from direct query - Force setting starter plan values");
          normalizedPlanType = 'starter';
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
          
          try {
            await supabase
              .from('subscriptions')
              .update({ 
                project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
                plan_type: 'starter',
                status: 'active'
              })
              .eq('subscription_id', directData.subscription_id);
            
            console.log("Successfully updated project limit in database to starter values");
          } catch (updateErr) {
            console.error("Failed to update project limit:", updateErr);
          }
        }
        else if (normalizedPlanType === 'starter' && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log(`Correcting starter plan project limit from ${projectLimit} to ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
          projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
          
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
        
        const features = typeof directData.features === 'object' && directData.features !== null
          ? directData.features as Record<string, any>
          : {};
        
        const validatedData: SubscriptionPlan = {
          subscription_id: directData.subscription_id,
          user_id: directData.user_id,
          status: validStatus,
          plan_type: normalizedPlanType,
          current_period_end: directData.current_period_end,
          created_at: directData.created_at,
          updated_at: directData.updated_at || directData.created_at,
          project_limit: projectLimit || getProjectLimitForPlan(normalizedPlanType),
          features: features,
          stripe_customer_id: directData.stripe_customer_id,
          stripe_subscription_id: directData.stripe_subscription_id,
          cancel_at_period_end: directData.cancel_at_period_end || false
        };
        
        storeSubscriptionDataLocally(validatedData);
        
        setSubscription(validatedData);
        setInitialFetchCompleted(true);
        setLoading(false);
        setSubscriptionChecked(true);
        checkInProgressRef.current = false;
        return;
      }
      
      if (isUserStarter.current) {
        console.log("No subscription found but this is starter user - creating starter subscription");
        const starterSub = await createStarterSubscription(session.user.id);
        if (starterSub) {
          setSubscription(starterSub);
          setInitialFetchCompleted(true);
          setLoading(false);
          setSubscriptionChecked(true);
          checkInProgressRef.current = false;
          return;
        }
      }
      
      console.log("No subscription found, creating trial subscription");
      createDefaultSubscription(
        session.user.id, 
        setSubscription, 
        () => setInitialFetchCompleted(true),
        setLoading,
        setSubscriptionChecked
      );
    } catch (e) {
      console.error('Error fetching subscription:', e);
      setError(e as Error);
      
      if (isUserStarter.current) {
        console.log("ERROR - Force setting starter plan for specific user");
        const starterPlan = {
          subscription_id: crypto.randomUUID(),
          user_id: session.user.id,
          status: 'active' as SubscriptionStatus,
          plan_type: 'starter',
          current_period_end: null,
          project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
          features: {},
          stripe_customer_id: null,
          stripe_subscription_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSubscription(starterPlan);
        storeSubscriptionDataLocally(starterPlan);
        setLoading(false);
        setSubscriptionChecked(true);
        checkInProgressRef.current = false;
        return;
      }
      
      const cachedData = getStoredSubscriptionData();
      if (cachedData && cachedData.user_id === session.user.id) {
        console.log("Using cached subscription data after error:", cachedData);
        setSubscription(cachedData);
        setLoading(false);
      } else if (initialFetchCompleted || subscription) {
        setLoading(false);
      } else {
        createDefaultSubscription(
          session?.user?.id || '', 
          setSubscription, 
          () => setInitialFetchCompleted(true),
          setLoading,
          setSubscriptionChecked
        );
      }
    } finally {
      checkInProgressRef.current = false;
      
      setTimeout(() => {
        if (setLoading) {
          console.log("Forcing loading state to false after delay");
          setLoading(false);
        }
      }, 500);
    }
  }, [session, initialFetchCompleted, subscription, isUserStarter, setSubscription, setLoading, setError, setInitialFetchCompleted, setSubscriptionChecked]);

  /**
   * Renew a subscription
   */
  const renewSubscription = useCallback(async () => {
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
  }, [subscription, setForceRecheckFlag, checkSubscription]);

  // Cleanup effect for abort controller and timeouts
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

  return {
    checkSubscription,
    renewSubscription
  };
}

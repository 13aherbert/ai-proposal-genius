import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  SubscriptionPlan, 
  SubscriptionContextType,
  SubscriptionStatus
} from '@/types/subscription';
import { useSubscriptionCheckers } from '../hooks/useSubscriptionCheckers';
import { createCheckoutSession, createTrialSubscription } from '../hooks/useSubscriptionActions';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { 
  storeSubscriptionDataLocally, 
  getStoredSubscriptionData,
  isStarterUser
} from '../feature-access';
import { withRetry } from '@/utils/network/retry';
import { withRateLimitByKey } from '@/utils/network/rate-limit';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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
  const [initialFetchCompleted, setInitialFetchCompleted] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [forceRecheckFlag, setForceRecheckFlag] = useState(0);
  
  const initialCheckCompleted = useRef(false);
  const isUserStarter = useRef<boolean>(false);
  const subscriptionCheckInProgress = useRef<boolean>(false);
  const lastCheckTime = useRef<number>(0);
  
  const { 
    checkIsPastGracePeriod, 
    checkIsInGracePeriod, 
    checkIsActive, 
    checkHasFailedPayment 
  } = useSubscriptionCheckers(subscription);

  const rawCheckSubscription = async (forceRecheck?: boolean) => {
    console.log("Checking subscription, force:", forceRecheck);

    if (!session?.user?.id) {
      console.error("No user ID found, cannot check subscription");
      return null;
    }

    try {
      console.log("Fetching subscription data from Supabase");
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching subscription data:", error);
        setError(error);
        return null;
      }

      if (data) {
        console.log("Subscription data received:", data);
        
        const typedSubscription: SubscriptionPlan = {
          ...data,
          status: data.status as SubscriptionStatus,
        };
        
        storeSubscriptionDataLocally(typedSubscription);
        setSubscription(typedSubscription);
      } else {
        console.log("No subscription data found, creating trial subscription");
        const trialSubscription = await createTrialSubscription(session.user.id);
        if (trialSubscription) {
          console.log("Trial subscription created:", trialSubscription);
          storeSubscriptionDataLocally(trialSubscription);
          setSubscription(trialSubscription);
        } else {
          console.error("Failed to create trial subscription");
        }
      }
    } catch (err) {
      console.error("Error during subscription check:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
      setInitialFetchCompleted(true);
      setSubscriptionChecked(true);
    }
    
    return null;
  };
  
  const checkSubscription = async (forceRecheck?: boolean) => {
    if (subscriptionCheckInProgress.current && !forceRecheck) {
      console.log("Subscription check already in progress, skipping");
      return;
    }
    
    const now = Date.now();
    if (!forceRecheck && now - lastCheckTime.current < 10000) {
      console.log("Skipping subscription check - too soon since last check");
      return;
    }
    
    try {
      subscriptionCheckInProgress.current = true;
      lastCheckTime.current = now;
      
      await withRetry(
        () => rawCheckSubscription(forceRecheck),
        3,
        1000
      );
    } catch (err) {
      console.error("Final error after retries in subscription check:", err);
      
      const cachedData = getStoredSubscriptionData();
      if (cachedData && !subscription) {
        console.log("Using cached subscription data after failed retries");
        setSubscription(cachedData);
        setLoading(false);
      }
    } finally {
      subscriptionCheckInProgress.current = false;
    }
  };

  const renewSubscription = async (): Promise<{ success?: boolean; url?: string; error?: any }> => {
    try {
      if (!subscription) {
        console.error("Cannot renew: No subscription data available");
        return { 
          success: false, 
          error: { message: "No subscription information found" } 
        };
      }
      
      console.log("Initiating renewal with subscription data:", subscription);
      
      const subscriptionId = subscription.stripe_subscription_id;
      const customerId = subscription.stripe_customer_id;
      
      if (!subscriptionId && !customerId) {
        console.error("Missing required subscription IDs");
        return { 
          success: false, 
          error: { message: "No active subscription or customer found" } 
        };
      }
      
      const renewKey = `renew-subscription-${subscriptionId || customerId}`;
      const result = await withRateLimitByKey(renewKey, async () => {
        console.log("Getting current session");
        const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !authSession) {
          throw new Error(sessionError?.message || "No active session found");
        }
        
        console.log("Invoking renew-subscription edge function");
        return supabase.functions.invoke('renew-subscription', {
          body: { 
            subscriptionId, 
            customerId 
          },
          headers: {
            Authorization: `Bearer ${authSession.access_token}`
          }
        });
      });
      
      if (result.error) {
        throw new Error(result.error.message || JSON.stringify(result.error));
      }
      
      return { 
        success: true, 
        url: result.data?.url,
        error: result.data?.error
      };
    } catch (error: any) {
      console.error('Error in renewSubscription:', error);
      return { 
        success: false, 
        error 
      };
    }
  };

  useEffect(() => {
    if (initialCheckCompleted.current) return;
    
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
          initialCheckCompleted.current = true;
        }
      }
    } catch (e) {
      console.error("Error loading from cache:", e);
    }
  }, [session?.user?.id, subscription]);

  useEffect(() => {
    if (initialCheckCompleted.current) return;
    
    if (session?.user) {
      isUserStarter.current = isStarterUser();
      console.log(`SubscriptionProvider: User is ${isUserStarter.current ? 'STARTER' : 'regular'}`);
      initialCheckCompleted.current = true;
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (initialCheckCompleted.current) return;
    
    if (session?.user && !initialFetchCompleted) {
      console.log("Session available, checking subscription");
      setTimeout(() => {
        checkSubscription(true).catch(err => {
          console.error("Error during initial subscription check:", err);
        });
        initialCheckCompleted.current = true;
      }, 100);
    } else if (!session?.user) {
      console.log("No session available, clearing subscription data");
      setSubscription(null);
      setLoading(false);
      setInitialFetchCompleted(false);
      setSubscriptionChecked(false);
    }
  }, [session?.user?.id, initialFetchCompleted]);

  useEffect(() => {
    if (forceRecheckFlag > 0 && session?.user) {
      console.log("Force rechecking subscription");
      checkSubscription(true).catch(err => {
        console.error("Error during forced subscription check:", err);
      });
    }
  }, [forceRecheckFlag, session?.user?.id]);

  useAutoRefresh(session, checkSubscription);

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

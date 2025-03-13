
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  SubscriptionPlan, 
  SubscriptionContextType,
  SubscriptionStatus
} from '@/types/subscription';
import { useSubscriptionCheckers } from '../hooks/useSubscriptionCheckers';
import { useSubscriptionActions } from '../hooks/useSubscriptionActions';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { 
  storeSubscriptionDataLocally, 
  getStoredSubscriptionData,
  isStarterUser
} from '../feature-access';

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
  
  // Store refs to prevent unnecessary re-renders and track state between renders
  const initialCheckCompleted = useRef(false);
  const isUserStarter = useRef<boolean>(false);
  const subscriptionCheckInProgress = useRef<boolean>(false);
  const lastCheckTime = useRef<number>(0);
  
  // Initialize subscription checkers (isPastGracePeriod, isInGracePeriod, etc.)
  const { 
    checkIsPastGracePeriod, 
    checkIsInGracePeriod, 
    checkIsActive, 
    checkHasFailedPayment 
  } = useSubscriptionCheckers(subscription);

  // Get subscription actions (check, renew, etc.)
  const { 
    checkSubscription: rawCheckSubscription, 
    renewSubscription
  } = useSubscriptionActions({
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
  });
  
  // Wrap the checkSubscription to add debouncing
  const checkSubscription = async (forceRecheck?: boolean) => {
    // If a check is already in progress, skip this one unless forced
    if (subscriptionCheckInProgress.current && !forceRecheck) {
      console.log("Subscription check already in progress, skipping");
      return;
    }
    
    // Implement time-based throttling - minimum 10 seconds between checks unless forced
    const now = Date.now();
    if (!forceRecheck && now - lastCheckTime.current < 10000) {
      console.log("Skipping subscription check - too soon since last check");
      return;
    }
    
    try {
      subscriptionCheckInProgress.current = true;
      lastCheckTime.current = now;
      await rawCheckSubscription(forceRecheck);
    } finally {
      subscriptionCheckInProgress.current = false;
    }
  };

  // Check for cached subscription data on mount - only once
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
  }, [session?.user?.id, subscription]); // Only depend on user ID, not the entire session object

  // Determine if user is a starter user on mount - only once
  useEffect(() => {
    if (initialCheckCompleted.current) return;
    
    if (session?.user) {
      isUserStarter.current = isStarterUser();
      console.log(`SubscriptionProvider: User is ${isUserStarter.current ? 'STARTER' : 'regular'}`);
      initialCheckCompleted.current = true;
    }
  }, [session?.user?.id]); // Only depend on user ID, not the entire session object

  // Initial subscription check when session becomes available - only once
  useEffect(() => {
    if (initialCheckCompleted.current) return;
    
    if (session?.user && !initialFetchCompleted) {
      console.log("Session available, checking subscription");
      // Use a setTimeout to prevent immediate execution and give other effects time to run
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
  }, [session?.user?.id, initialFetchCompleted]); // Only depend on user ID, not the entire session object

  // Handle force recheck
  useEffect(() => {
    if (forceRecheckFlag > 0 && session?.user) {
      console.log("Force rechecking subscription");
      checkSubscription(true).catch(err => {
        console.error("Error during forced subscription check:", err);
      });
    }
  }, [forceRecheckFlag, session?.user?.id]); // Only depend on user ID, not the entire session object

  // Setup auto-refresh of subscription data
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

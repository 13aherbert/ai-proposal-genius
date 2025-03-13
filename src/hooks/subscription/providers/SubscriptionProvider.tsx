
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

  // Store refs that need to persist between renders
  const isUserStarter = useRef<boolean>(false);
  
  // Initialize subscription checkers (isPastGracePeriod, isInGracePeriod, etc.)
  const { 
    checkIsPastGracePeriod, 
    checkIsInGracePeriod, 
    checkIsActive, 
    checkHasFailedPayment 
  } = useSubscriptionCheckers(subscription);

  // Get subscription actions (check, renew, etc.)
  const { 
    checkSubscription, 
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

  // Check for cached subscription data on mount
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

  // Determine if user is a starter user on mount
  useEffect(() => {
    if (session?.user) {
      isUserStarter.current = isStarterUser();
      console.log(`SubscriptionProvider: User is ${isUserStarter.current ? 'STARTER' : 'regular'}`);
    }
  }, [session]);

  // Initial subscription check when session becomes available
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

  // Handle force recheck
  useEffect(() => {
    if (forceRecheckFlag > 0 && session?.user) {
      console.log("Force rechecking subscription");
      checkSubscription(true);
    }
  }, [forceRecheckFlag, session, checkSubscription]);

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

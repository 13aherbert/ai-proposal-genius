
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useUserStatus } from '@/hooks/use-user-status';
import { useSubscription } from '@/hooks/use-subscription';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNetworkStatus } from './useNetworkStatus';
import { useErrorRecovery } from './useErrorRecovery';
import { useUserStatusRefresh } from './useUserStatusRefresh';
import { AuthUserContextType } from './types';
import { toast } from 'sonner';

/**
 * Context for authentication and user data
 * Provides centralized access to user authentication state, permissions,
 * subscription status, and related functionality
 */
const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

/**
 * Provider component for AuthUserContext
 * Manages user authentication state, permissions, and subscription info
 */
export const AuthUserProvider = ({ children }: { children: ReactNode }) => {
  const { session, loading: isLoadingAuth } = useAuth();
  const [initializationComplete, setInitializationComplete] = useState(false);
  
  // User status and roles from useUserStatus hook
  const {
    status,
    roles,
    subscription,
    isLoading: isLoadingStatus,
    isAdmin,
    isBetaTester,
    isUser,
    hasRole,
    fetchUserStatus,
    getProjectLimit,
    getSubscriptionPlan,
    getSubscriptionStatus,
  } = useUserStatus();
  
  // Network status management
  const networkStatus = useNetworkStatus();
  
  // Subscription helper functions
  const subscriptionHelpers = useSubscription();
  
  // Error recovery functionality
  const errorRecovery = useErrorRecovery(session, networkStatus.isOffline, fetchUserStatus);
  
  // User status initialization and refresh functionality
  const userStatusRefresh = useUserStatusRefresh(
    session,
    isLoadingStatus,
    fetchUserStatus,
    errorRecovery.setLastError
  );
  
  // Add timeout to ensure we eventually set initialization complete
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!initializationComplete) {
        console.log("Forcing AuthUserContext initialization complete after timeout");
        setInitializationComplete(true);
        
        if (isLoadingAuth) {
          toast.warning("Session verification is taking longer than expected", {
            description: "Some features may be limited until verification completes"
          });
        }
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [initializationComplete, isLoadingAuth]);
  
  // Mark initialization complete when auth loading finishes
  useEffect(() => {
    if (!isLoadingAuth && !initializationComplete) {
      console.log("Auth loading complete, marking AuthUserContext as initialized");
      setInitializationComplete(true);
    }
  }, [isLoadingAuth, initializationComplete]);
  
  // Create computed properties for subscription status
  // Using memoized values instead of functions to match the expected type
  const isActive = subscriptionHelpers.isActive();
  const isInGracePeriod = subscriptionHelpers.isInGracePeriod();
  const isPastGracePeriod = subscriptionHelpers.isPastGracePeriod();
  const hasFailedPayment = subscriptionHelpers.hasFailedPayment();
  
  return (
    <ErrorBoundary name="AuthUserContext">
      <AuthUserContext.Provider
        value={{
          // Authentication state
          session,
          isLoadingAuth,
          isAuthenticated: !!session?.user,
          
          // User roles and permissions
          isAdmin,
          isBetaTester,
          isUser,
          roles,
          hasRole,
          
          // User status
          status,
          isLoadingStatus,
          subscription,
          
          // Subscription status functions - now properties
          isActive,
          isInGracePeriod,
          isPastGracePeriod,
          hasFailedPayment,
          
          // Actions
          refreshUserStatus: userStatusRefresh.refreshUserStatus,
          getProjectLimit,
          getSubscriptionPlan,
          getSubscriptionStatus,
          
          // Offline and error recovery
          isOffline: networkStatus.isOffline,
          hasRecoveredFromError: errorRecovery.hasRecoveredFromError,
          lastError: errorRecovery.lastError,
          retryAuthentication: errorRecovery.retryAuthentication,
        }}
      >
        {children}
      </AuthUserContext.Provider>
    </ErrorBoundary>
  );
};

/**
 * Hook for accessing the auth user context
 * Provides access to the current user's authentication state,
 * permissions, subscription status, and related actions
 */
export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error('useAuthUser must be used within an AuthUserProvider');
  }
  return context;
};

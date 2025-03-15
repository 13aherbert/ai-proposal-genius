
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useUserStatus } from '@/hooks/use-user-status';
import { useSubscription } from '@/hooks/use-subscription';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useNetworkStatus } from './useNetworkStatus';
import { useErrorRecovery } from './useErrorRecovery';
import { useUserStatusRefresh } from './useUserStatusRefresh';
import { AuthUserContextType } from './types';

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
  const { isOffline } = useNetworkStatus();
  
  // Subscription helper functions
  const subscriptionHelpers = useSubscription();
  
  // Error recovery functionality
  const {
    lastError,
    setLastError,
    hasRecoveredFromError,
    retryAuthentication
  } = useErrorRecovery(session, isOffline, fetchUserStatus);
  
  // User status initialization and refresh functionality
  const { refreshUserStatus } = useUserStatusRefresh(
    session,
    isLoadingStatus,
    fetchUserStatus,
    setLastError
  );
  
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
          
          // Correctly passing the functions themselves, not their return values
          isActive: subscriptionHelpers.isActive,
          isInGracePeriod: subscriptionHelpers.isInGracePeriod,
          isPastGracePeriod: subscriptionHelpers.isPastGracePeriod,
          hasFailedPayment: subscriptionHelpers.hasFailedPayment,
          
          // Actions
          refreshUserStatus,
          getProjectLimit,
          getSubscriptionPlan,
          getSubscriptionStatus,
          
          // Offline and error recovery
          isOffline,
          hasRecoveredFromError,
          lastError,
          retryAuthentication,
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

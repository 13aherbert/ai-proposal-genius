
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '@/components/AuthProvider';
import { useUserStatus, UserStatusData, UserRoleData } from '@/hooks/use-user-status';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { useAuthPersistence } from './useAuthPersistence';
import { setupNetworkListeners, broadcastNetworkStatus } from '@/utils/network/offline-detection';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export type AuthUserContextType = {
  // Authentication state
  session: Session | null;
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  
  // User roles and permissions
  isAdmin: boolean;
  isBetaTester: boolean;
  isUser: boolean;
  roles: UserRoleData[];
  hasRole: (role: string) => boolean;
  
  // User status
  status: UserStatusData | null;
  isLoadingStatus: boolean;
  subscription: any | null;
  
  // Updated: Subscription status functions with correct function types
  isActive: () => boolean;
  isInGracePeriod: () => boolean;
  isPastGracePeriod: () => boolean;
  hasFailedPayment: () => boolean;
  
  // Actions
  refreshUserStatus: (force?: boolean) => Promise<void>;
  getProjectLimit: () => number;
  getSubscriptionPlan: () => string;
  getSubscriptionStatus: () => string;
  
  // Offline and error recovery
  isOffline: boolean;
  hasRecoveredFromError: boolean;
  lastError: Error | null;
  retryAuthentication: () => Promise<void>;
};

const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

export const AuthUserProvider = ({ children }: { children: ReactNode }) => {
  const { session, loading: isLoadingAuth } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [hasRecoveredFromError, setHasRecoveredFromError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
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
  
  const subscriptionHelpers = useSubscription();
  const { restoreSession } = useAuthPersistence();
  
  useEffect(() => {
    const cleanup = setupNetworkListeners((online) => {
      setIsOffline(!online);
      
      if (online && lastError) {
        retryAuthentication();
      }
    });
    
    return cleanup;
  }, [lastError]);
  
  const retryAuthentication = useCallback(async () => {
    if (isOffline) {
      toast.error("Cannot retry while offline", {
        description: "Please check your internet connection"
      });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    try {
      if (!session) {
        const restoredSession = await restoreSession();
        if (restoredSession) {
          toast.success("Session restored successfully");
        }
      }
      
      await fetchUserStatus(true);
      
      setLastError(null);
      setHasRecoveredFromError(true);
      toast.success("Authentication recovered successfully");
    } catch (error) {
      console.error("Failed to retry authentication:", error);
      setLastError(error instanceof Error ? error : new Error(String(error)));
      
      toast.error("Recovery attempt failed", {
        description: retryCount >= 2 ? "Please try signing in again" : "Will try again automatically"
      });
      
      if (retryCount < 2) {
        setTimeout(() => {
          retryAuthentication();
        }, 3000);
      }
    }
  }, [isOffline, session, retryCount, restoreSession, fetchUserStatus]);
  
  useEffect(() => {
    if (!isInitialized && session?.user && !isLoadingStatus) {
      console.log("Initializing AuthUserContext");
      fetchUserStatus(true)
        .catch(error => {
          console.error("Error during initial status fetch:", error);
          setLastError(error instanceof Error ? error : new Error(String(error)));
          
          setIsInitialized(true);
          
          if (navigator.onLine) {
            toast.error("Failed to load user data", {
              description: "Using cached data if available"
            });
          }
        });
      setIsInitialized(true);
    }
  }, [session, isInitialized, isLoadingStatus, fetchUserStatus]);
  
  useEffect(() => {
    if (session?.user?.id) {
      setIsInitialized(false);
      setHasRecoveredFromError(false);
    }
  }, [session?.user?.id]);
  
  const refreshUserStatus = async (force = false) => {
    if (session?.user) {
      try {
        await fetchUserStatus(force);
        if (lastError) {
          setLastError(null);
        }
      } catch (error) {
        console.error("Error refreshing user status:", error);
        setLastError(error instanceof Error ? error : new Error(String(error)));
        
        if (navigator.onLine) {
          toast.error("Failed to refresh user data", {
            description: "Using cached data if available"
          });
        }
      }
    }
  };
  
  return (
    <ErrorBoundary name="AuthUserContext">
      <AuthUserContext.Provider
        value={{
          session,
          isLoadingAuth,
          isAuthenticated: !!session?.user,
          
          isAdmin,
          isBetaTester,
          isUser,
          roles,
          hasRole,
          
          status,
          isLoadingStatus,
          subscription,
          
          // Pass the function types directly, not their invocation results
          isActive: subscriptionHelpers.isActive,
          isInGracePeriod: subscriptionHelpers.isInGracePeriod,
          isPastGracePeriod: subscriptionHelpers.isPastGracePeriod,
          hasFailedPayment: subscriptionHelpers.hasFailedPayment,
          
          refreshUserStatus,
          getProjectLimit,
          getSubscriptionPlan,
          getSubscriptionStatus,
          
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

export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error('useAuthUser must be used within an AuthUserProvider');
  }
  return context;
};

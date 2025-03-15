
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '@/components/AuthProvider';
import { useUserStatus, UserStatusData, UserRoleData } from '@/hooks/use-user-status';
import { useSubscription } from '@/hooks/use-subscription';

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
  
  // Subscription status functions - these should be functions
  isActive: () => boolean;
  isInGracePeriod: () => boolean;
  isPastGracePeriod: () => boolean;
  hasFailedPayment: () => boolean;
  
  // Actions
  refreshUserStatus: (force?: boolean) => Promise<void>;
  getProjectLimit: () => number;
  getSubscriptionPlan: () => string;
  getSubscriptionStatus: () => string;
};

const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

export const AuthUserProvider = ({ children }: { children: ReactNode }) => {
  const { session, loading: isLoadingAuth } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
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
  
  useEffect(() => {
    if (!isInitialized && session?.user && !isLoadingStatus) {
      console.log("Initializing AuthUserContext");
      fetchUserStatus(true);
      setIsInitialized(true);
    }
  }, [session, isInitialized, isLoadingStatus, fetchUserStatus]);
  
  useEffect(() => {
    if (session?.user?.id) {
      setIsInitialized(false);
    }
  }, [session?.user?.id]);
  
  const refreshUserStatus = async (force = false) => {
    if (session?.user) {
      await fetchUserStatus(force);
    }
  };
  
  return (
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
        
        // Wrap these in functions to match the expected type
        isActive: () => subscriptionHelpers.isActive(),
        isInGracePeriod: () => subscriptionHelpers.isInGracePeriod(),
        isPastGracePeriod: () => subscriptionHelpers.isPastGracePeriod(),
        hasFailedPayment: () => subscriptionHelpers.hasFailedPayment(),
        
        refreshUserStatus,
        getProjectLimit,
        getSubscriptionPlan,
        getSubscriptionStatus,
      }}
    >
      {children}
    </AuthUserContext.Provider>
  );
};

export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error('useAuthUser must be used within an AuthUserProvider');
  }
  return context;
};

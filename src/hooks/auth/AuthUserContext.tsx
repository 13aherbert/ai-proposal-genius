
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
  
  // Subscription status functions
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
  
  const {
    isActive,
    isInGracePeriod,
    isPastGracePeriod,
    hasFailedPayment,
  } = useSubscription();
  
  // Initialize and ensure data is loaded
  useEffect(() => {
    if (!isInitialized && session?.user && !isLoadingStatus) {
      console.log("Initializing AuthUserContext");
      fetchUserStatus(true);
      setIsInitialized(true);
    }
  }, [session, isInitialized, isLoadingStatus, fetchUserStatus]);
  
  // Reset when session changes
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
        // Auth state
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
        
        // Subscription status functions - Pass the functions directly
        isActive,
        isInGracePeriod,
        isPastGracePeriod,
        hasFailedPayment,
        
        // Actions
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


import { Session } from '@supabase/supabase-js';
import { UserStatusData, UserRoleData } from '@/hooks/use-user-status';

/**
 * Authentication user context type definition
 * Provides all authentication and user-related state and functions
 */
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
  
  // Offline and error recovery
  isOffline: boolean;
  hasRecoveredFromError: boolean;
  lastError: Error | null;
  retryAuthentication: () => Promise<void>;
};

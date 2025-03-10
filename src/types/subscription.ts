
/**
 * Subscription-related type definitions
 */

/**
 * Possible subscription status values
 */
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';

/**
 * Represents a user's subscription plan
 */
export interface SubscriptionPlan {
  subscription_id: string;
  status: SubscriptionStatus;
  plan_type: string;
  current_period_end: string | null;
  project_limit: number;
  features: Record<string, any>;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  cancel_at_period_end?: boolean;
}

/**
 * Context type for subscription data and operations
 */
export interface SubscriptionContextType {
  data: SubscriptionPlan | null;
  subscription: SubscriptionPlan | null;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  checkSubscription: (forceRecheck?: boolean) => Promise<void>;
  renewSubscription: () => Promise<{ url?: string; success?: boolean; error?: any }>;
  isPastGracePeriod: () => boolean;
  isInGracePeriod: () => boolean;
  isActive: () => boolean;
  hasFailedPayment: () => boolean;
}

/**
 * Default trial subscription data
 */
export const DEFAULT_TRIAL_SUBSCRIPTION: Partial<SubscriptionPlan> = {
  status: 'trialing',
  plan_type: 'trial',
  project_limit: 3,  // Trial users get 3 projects
  features: {},
  current_period_end: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

/**
 * Project limits for each subscription plan
 */
export const SUBSCRIPTION_PLAN_LIMITS = {
  trial: 3,     // Trial users get 3 projects
  starter: 10,  // Starter users get 10 projects 
  pro: 30      // Pro users get 30 projects
};

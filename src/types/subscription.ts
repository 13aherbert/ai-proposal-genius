
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
 * Default starter subscription data - free forever
 */
export const DEFAULT_STARTER_SUBSCRIPTION: Partial<SubscriptionPlan> = {
  status: 'active',
  plan_type: 'starter',
  project_limit: 6,  // Free starter users get 6 projects
  features: {},
  current_period_end: null, // No end date for free plan
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

/**
 * Project limits for each subscription plan
 */
export const SUBSCRIPTION_PLAN_LIMITS = {
  starter: 6,       // Free starter plan - 6 projects
  growth: 36,       // Growth paid plan - 36 projects
  business: 120,    // Business paid plan - 120 projects
  enterprise: -1,   // Enterprise plan - unlimited projects
  // Legacy aliases for backward compatibility (DB rows that still say "pro"/"basic"/"trial")
  basic: 36,
  pro: 120,
  trial: 6,
};

// Compatibility type to make Subscription from use-subscription.ts work with SubscriptionPlan
export type SubscriptionCompatibilityType = SubscriptionPlan & {
  // Add any missing fields from Subscription that might be needed
};

// Type guard to check if a subscription is a SubscriptionPlan
export function isSubscriptionPlan(sub: any): sub is SubscriptionPlan {
  return sub && typeof sub === 'object' && 
    'subscription_id' in sub &&
    'status' in sub &&
    'plan_type' in sub &&
    'created_at' in sub &&
    'updated_at' in sub;
}

// Helper function to convert any subscription-like object to a valid SubscriptionPlan
export function toSubscriptionPlan(sub: any): SubscriptionPlan {
  if (!sub) return null as unknown as SubscriptionPlan;
  
  // If the object already has all required fields, return it
  if (isSubscriptionPlan(sub)) return sub;
  
  // Otherwise, add the missing fields
  return {
    subscription_id: sub.subscription_id || '',
    status: sub.status as SubscriptionStatus,
    plan_type: sub.plan_type || 'trial',
    current_period_end: sub.current_period_end || null,
    project_limit: sub.project_limit || 6,
    features: sub.features || {},
    stripe_customer_id: sub.stripe_customer_id || null,
    stripe_subscription_id: sub.stripe_subscription_id || null,
    created_at: sub.created_at || new Date().toISOString(),
    updated_at: sub.updated_at || new Date().toISOString(),
    user_id: sub.user_id || '',
    cancel_at_period_end: sub.cancel_at_period_end || false
  };
}

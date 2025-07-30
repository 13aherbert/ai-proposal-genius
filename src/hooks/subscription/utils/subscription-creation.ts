
/**
 * Helper functions for creating default subscription objects
 */
import { SubscriptionPlan, SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { storeSubscriptionDataLocally } from "../feature-access";

/**
 * Creates a starter subscription for a user
 */
export async function createStarterSubscription(
  userId: string,
  setSubscription: (subscription: SubscriptionPlan) => void,
  onComplete?: () => void,
  setLoading?: (loading: boolean) => void,
  setSubscriptionChecked?: (checked: boolean) => void
): Promise<SubscriptionPlan> {
  // Create a new starter subscription object
  const subscription: SubscriptionPlan = {
    subscription_id: crypto.randomUUID(),
    user_id: userId,
    status: 'active',
    plan_type: 'starter',
    current_period_end: null,
    project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
    features: {},
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Update the state
  setSubscription(subscription);
  
  // Store in localStorage
  storeSubscriptionDataLocally(subscription);
  
  // Call any additional callbacks
  if (setLoading) setLoading(false);
  if (setSubscriptionChecked) setSubscriptionChecked(true);
  if (onComplete) onComplete();
  
  return subscription;
}

/**
 * Creates a default (trial) subscription for a user - now perpetual
 */
export async function createDefaultSubscription(
  userId: string,
  setSubscription: (subscription: SubscriptionPlan) => void,
  onComplete?: () => void,
  setLoading?: (loading: boolean) => void,
  setSubscriptionChecked?: (checked: boolean) => void
): Promise<SubscriptionPlan> {
  // Create a new perpetual starter subscription object
  const subscription: SubscriptionPlan = {
    subscription_id: crypto.randomUUID(),
    user_id: userId,
    status: 'active', // Active free starter plan
    plan_type: 'starter',
    current_period_end: null, // No end date for free plan
    project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
    features: {},
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Update the state
  setSubscription(subscription);
  
  // Store in localStorage
  storeSubscriptionDataLocally(subscription);
  
  // Call any additional callbacks
  if (setLoading) setLoading(false);
  if (setSubscriptionChecked) setSubscriptionChecked(true);
  if (onComplete) onComplete();
  
  return subscription;
}

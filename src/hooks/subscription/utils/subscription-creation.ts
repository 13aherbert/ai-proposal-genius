
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan, SubscriptionStatus, SUBSCRIPTION_PLAN_LIMITS } from '@/types/subscription';
import { storeSubscriptionDataLocally } from '../feature-access';
import { createTrialSubscription } from '../use-subscription-actions';

/**
 * Creates a starter subscription for a user
 */
export const createStarterSubscription = async (userId: string): Promise<SubscriptionPlan | null> => {
  try {
    console.log("Creating starter subscription for user:", userId);
    const subscriptionId = crypto.randomUUID();
    const newSubscription: SubscriptionPlan = {
      subscription_id: subscriptionId,
      user_id: userId,
      status: 'active',
      plan_type: 'starter',
      project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
      features: {},
      current_period_end: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert([newSubscription]);
    
    if (insertError) {
      console.error("Failed to insert starter subscription:", insertError);
      storeSubscriptionDataLocally(newSubscription);
      return newSubscription;
    }
    
    console.log("Successfully created starter subscription");
    storeSubscriptionDataLocally(newSubscription);
    return newSubscription;
  } catch (e) {
    console.error("Error creating starter subscription:", e);
    return null;
  }
};

/**
 * Creates a default trial subscription
 */
export const createDefaultSubscription = async (
  userId: string,
  onComplete: (subscription: SubscriptionPlan) => void,
  onSetInitialFetchCompleted: () => void,
  onSetLoading: (loading: boolean) => void,
  onSetSubscriptionChecked: (checked: boolean) => void
) => {
  try {
    console.log("Creating default trial subscription");
    const newSubscription = await createTrialSubscription(userId);
    
    if (newSubscription) {
      console.log("Successfully created new trial subscription:", newSubscription);
      storeSubscriptionDataLocally(newSubscription);
      onComplete(newSubscription);
    } else {
      console.log("Using hardcoded default trial subscription");
      const defaultSub = {
        subscription_id: crypto.randomUUID(),
        user_id: userId || '',
        status: 'trialing' as SubscriptionStatus,
        plan_type: 'trial',
        project_limit: SUBSCRIPTION_PLAN_LIMITS.trial,
        features: {},
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cancel_at_period_end: false
      };
      storeSubscriptionDataLocally(defaultSub);
      onComplete(defaultSub);
    }
    
    onSetInitialFetchCompleted();
  } catch (error) {
    console.error("Failed to create default subscription:", error);
    const defaultSub = {
      subscription_id: crypto.randomUUID(),
      user_id: userId || '',
      status: 'trialing' as SubscriptionStatus,
      plan_type: 'trial',
      project_limit: SUBSCRIPTION_PLAN_LIMITS.trial,
      features: {},
      current_period_end: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cancel_at_period_end: false
    };
    storeSubscriptionDataLocally(defaultSub);
    onComplete(defaultSub);
  } finally {
    onSetLoading(false);
    onSetSubscriptionChecked(true);
  }
};

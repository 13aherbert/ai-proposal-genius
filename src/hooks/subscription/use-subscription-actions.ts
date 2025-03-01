
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan } from '@/types/subscription';
import { toast } from 'sonner';

/**
 * Creates a new trial subscription for a user
 * @param userId User ID to create subscription for
 * @returns New trial subscription
 */
export const createTrialSubscription = async (userId: string): Promise<SubscriptionPlan | null> => {
  const newSubscription: SubscriptionPlan = {
    subscription_id: crypto.randomUUID(),
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'trialing',
    plan_type: 'trial',
    project_limit: 3,
    features: {},
    current_period_end: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };

  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert([newSubscription]);

  if (insertError) {
    console.error('Error creating trial subscription:', insertError);
  }
  
  return newSubscription;
};

/**
 * Renews a failed or expired subscription
 * @param userId User ID
 * @param subscriptionId Stripe subscription ID
 * @returns Promise resolving with success or error
 */
export const renewSubscription = async (
  subscriptionId: string | null
): Promise<{ success: boolean, error?: any }> => {
  try {
    if (!subscriptionId) {
      toast.error("Cannot renew subscription", { 
        description: "No active subscription found" 
      });
      return { success: false, error: "No active subscription found" };
    }

    // Call the renew-subscription edge function
    const { error } = await supabase.functions.invoke('renew-subscription', {
      body: { 
        subscriptionId: subscriptionId
      }
    });

    if (error) throw error;

    toast.success("Renewal initiated", {
      description: "Your subscription renewal has been initiated. Please check your email for payment details."
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error renewing subscription:', error);
    toast.error("Failed to renew subscription", {
      description: error.message || "Please try again or contact support"
    });
    return { success: false, error };
  }
};

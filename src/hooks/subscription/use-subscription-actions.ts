
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
 * Creates a checkout session for subscription upgrade
 * @param priceId The Stripe price ID for the selected plan
 * @returns Promise resolving with checkout URL or error
 */
export const createCheckoutSession = async (priceId: string): Promise<{ url?: string; error?: any }> => {
  try {
    // Get current session
    const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }

    if (!authSession) {
      throw new Error('No active session found. Please log in again.');
    }

    console.log('Creating checkout session with price ID:', priceId);
    
    // Call the create-checkout-session function with appropriate headers
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId },
      headers: {
        Authorization: `Bearer ${authSession.access_token}`
      }
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned from the server');
    }

    return { url: data.url };
  } catch (error: any) {
    console.error('Error in createCheckoutSession:', error);
    return { error };
  }
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

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('Authentication error: ' + sessionError.message);
    }

    if (!session) {
      throw new Error('No active session found. Please log in again.');
    }

    // Call the renew-subscription edge function
    const { error } = await supabase.functions.invoke('renew-subscription', {
      body: { 
        subscriptionId: subscriptionId
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
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

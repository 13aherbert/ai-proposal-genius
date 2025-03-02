
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
 * @param subscriptionId Stripe subscription ID
 * @param customerId Stripe customer ID
 * @returns Promise resolving with success status, URL, or error
 */
export const renewSubscription = async (
  subscriptionId: string | null,
  customerId: string | null
): Promise<{ success: boolean, url?: string, error?: any }> => {
  try {
    if (!subscriptionId && !customerId) {
      toast.error("Cannot renew subscription", { 
        description: "No active subscription or customer found" 
      });
      return { success: false, error: "No active subscription or customer found" };
    }

    console.log("Attempting to renew subscription with:", { subscriptionId, customerId });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }

    if (!session) {
      console.error("No active session found");
      throw new Error('No active session found. Please log in again.');
    }

    // Call the renew-subscription edge function
    const { data, error } = await supabase.functions.invoke('renew-subscription', {
      body: { 
        subscriptionId, 
        customerId 
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error("Edge function error:", error);
      throw error;
    }
    
    if (!data?.url) {
      console.error("No URL returned:", data);
      throw new Error('No portal URL returned from the server');
    }

    console.log('Received portal URL:', data.url);
    
    return { success: true, url: data.url };
  } catch (error: any) {
    console.error('Error renewing subscription:', error);
    toast.error("Failed to renew subscription", {
      description: error.message || "Please try again or contact support"
    });
    return { success: false, error };
  }
};


import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import Stripe from 'https://esm.sh/stripe@12.5.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT token from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Unauthorized');
    }

    // Get the cancellation reason from the request body
    const { reason } = await req.json();
    
    console.log(`User ${user.id} is cancelling subscription with reason: ${reason}`);

    // Get the user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      throw new Error('Error fetching subscription');
    }

    if (!subscription?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    console.log(`Cancelling Stripe subscription: ${subscription.stripe_subscription_id}`);

    // Cancel the subscription at the end of the current period
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        metadata: { 
          cancel_reason: reason || 'No reason provided',
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString(),
        },
      }
    );

    console.log(`Subscription cancelled successfully, will end at period end: ${updatedSubscription.cancel_at}`);

    // Update the local subscription record
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
      // Continue anyway since the Stripe update was successful
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription will be cancelled at the end of the current billing period' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to cancel subscription' 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { targetPlan, reason } = await req.json();

    if (!targetPlan || !['basic', 'starter'].includes(targetPlan)) {
      return new Response(
        JSON.stringify({ error: 'Invalid target plan. Must be "basic" or "starter"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's current organization subscription
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('current_organization_id')
      .eq('profile_id', user.id)
      .single();

    if (!profile?.current_organization_id) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subscription, error: subError } = await supabaseClient
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', profile.current_organization_id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe subscription found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Get the Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    if (!stripeSubscription || stripeSubscription.status === 'canceled') {
      return new Response(
        JSON.stringify({ error: 'Subscription not found or already canceled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the price ID for the target plan
    const priceMap: Record<string, string | undefined> = {
      'basic': Deno.env.get('STRIPE_BASIC_PRICE_ID'),
      'starter': undefined, // Starter is free, no Stripe price
    };

    // If downgrading to starter (free), cancel the subscription
    if (targetPlan === 'starter') {
      // Cancel at period end to give user access until billing period ends
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
        metadata: {
          downgrade_to: 'starter',
          downgrade_reason: reason || 'User requested downgrade',
        }
      });

      // Update database
      await supabaseClient
        .from('organization_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', profile.current_organization_id);

      console.log(`Subscription ${subscription.stripe_subscription_id} set to cancel at period end (downgrade to starter)`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Your subscription will downgrade to Starter at the end of your billing period.`,
          newPlan: 'starter',
          effectiveDate: new Date(stripeSubscription.current_period_end * 1000).toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Downgrade to basic
    const basicPriceId = priceMap[targetPlan];
    if (!basicPriceId) {
      return new Response(
        JSON.stringify({ error: 'Basic plan price not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the subscription to the new price with proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: basicPriceId,
      }],
      proration_behavior: 'create_prorations', // Credit for unused time
      metadata: {
        downgrade_from: subscription.plan_type,
        downgrade_to: targetPlan,
        downgrade_reason: reason || 'User requested downgrade',
      }
    });

    // Update database
    const newProjectLimit = targetPlan === 'basic' ? 10 : 3;
    await supabaseClient
      .from('organization_subscriptions')
      .update({
        plan_type: targetPlan,
        project_limit: newProjectLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', profile.current_organization_id);

    console.log(`Subscription ${subscription.stripe_subscription_id} downgraded to ${targetPlan}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Your subscription has been downgraded to ${targetPlan === 'basic' ? 'Basic' : 'Starter'}.`,
        newPlan: targetPlan,
        prorationCredit: 'Your account will be credited for unused time.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Downgrade subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to downgrade subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

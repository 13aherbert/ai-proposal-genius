
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Stripe API key is set
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeApiKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      throw new Error('Stripe API key is not configured');
    }

    const { priceId } = await req.json();
    console.log('Price ID received:', priceId);

    if (!priceId) {
      console.error('No price ID provided');
      throw new Error('Price ID is required');
    }
    
    // Verify authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Missing authorization header');
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Supabase configuration is missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log('Verifying user token...');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed: ' + userError.message);
    }

    if (!user) {
      console.error('No user found after auth');
      throw new Error('User not found');
    }

    if (!user.email) {
      console.error('User has no email');
      throw new Error('User email not found');
    }

    console.log('Processing checkout for user:', user.id);

    // Initialize Stripe
    const stripe = new Stripe(stripeApiKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(), // Ensure we're using Fetch
    });

    // Validate priceId against server-side allowlist (subscription_plan_templates / pricing_tiers)
    try {
      const [{ data: tpl }, { data: tier }] = await Promise.all([
        supabaseClient.from('subscription_plan_templates').select('stripe_price_id').eq('stripe_price_id', priceId).maybeSingle(),
        supabaseClient.from('pricing_tiers').select('stripe_price_id_monthly,stripe_price_id_annual').or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`).maybeSingle(),
      ]);
      if (!tpl && !tier) {
        console.error('priceId not in allowlist:', priceId);
        return new Response(
          JSON.stringify({ error: 'Invalid price ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error('Allowlist check failed:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid price ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Verify the price exists in Stripe
      const price = await stripe.prices.retrieve(priceId);
      console.log('Price verified:', price.id);
    } catch (stripeError) {
      console.error('Error verifying price:', stripeError);
      throw new Error('Invalid price ID');
    }

    // Get or create customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('Found existing customer:', customer.id);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        console.log('Created new customer:', customer.id);
      }
    } catch (stripeError) {
      console.error('Error managing customer:', stripeError);
      throw new Error('Failed to manage customer');
    }

    // Create checkout session
    try {
      console.log('Creating checkout session...');
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        // CRITICAL: client_reference_id is what stripe-webhook reads to link
        // the resulting subscription row back to the Supabase user.
        client_reference_id: user.id,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/subscription`,
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            user_id: user.id,
          },
        },
      });

      console.log('Checkout session created successfully:', session.id);
      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Error creating checkout session:', stripeError);
      throw new Error('Failed to create checkout session: ' + stripeError.message);
    }
  } catch (error) {
    console.error('Final error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

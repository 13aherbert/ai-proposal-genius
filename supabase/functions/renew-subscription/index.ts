
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import Stripe from 'https://esm.sh/stripe@12.5.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    // Get the JWT token from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user ID from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Unauthorized');
    }
    
    // Get request data
    const { subscriptionId } = await req.json();
    
    // Validate request data
    if (!subscriptionId) {
      throw new Error('Missing subscription ID');
    }

    // Get the user's subscription
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (subError || !subscriptionData) {
      console.error('Subscription error:', subError);
      throw new Error('Subscription not found');
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscriptionData.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/account-settings`,
    });

    // Return the session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error in renew-subscription function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to renew subscription' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});

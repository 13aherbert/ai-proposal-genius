
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
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
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    // Get the user from the request
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          error: { message: 'Unauthorized - authentication required' } 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Parse request body
    const { subscriptionId, customerId } = await req.json();
    console.log('Handling renewal request:', { subscriptionId, customerId, userId: user.id });

    // Handle missing required parameters
    if (!customerId && !subscriptionId) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: { message: 'Missing customer ID or subscription ID' } }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Priority: Use customerId if available, otherwise fall back to subscriptionId
    let session;
    let sessionParams = {};

    // Create parameters for the billing portal session
    if (customerId) {
      console.log('Creating billing portal session with customer ID:', customerId);
      sessionParams = {
        customer: customerId,
        return_url: `${req.headers.get('origin')}/subscription`,
      };
    } else if (subscriptionId) {
      console.log('Creating billing portal session with subscription ID:', subscriptionId);
      // First get the subscription to find the customer
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!subscription || !subscription.customer) {
        return new Response(
          JSON.stringify({ error: { message: 'Could not find subscription or customer' } }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      sessionParams = {
        customer: subscription.customer as string,
        return_url: `${req.headers.get('origin')}/subscription`,
      };
    }

    // Create the billing portal session with Stripe
    try {
      session = await stripe.billingPortal.sessions.create(sessionParams);
      console.log('Billing portal session created successfully:', { sessionId: session.id, url: session.url });
      
      // Return the session URL
      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    } catch (stripeError) {
      console.error('Stripe error creating portal session:', stripeError);
      return new Response(
        JSON.stringify({ error: { message: `Stripe error: ${stripeError.message}` } }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: { message: 'Internal server error' } }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

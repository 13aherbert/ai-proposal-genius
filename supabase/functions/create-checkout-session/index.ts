
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { priceId: productId } = await req.json();
    console.log('Product ID received:', productId);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    console.log('Auth header present');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const token = authHeader.replace('Bearer ', '');
    console.log('Attempting to get user from token');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }

    if (!user) {
      console.error('No user found');
      throw new Error('No user found');
    }

    if (!user.email) {
      console.error('User has no email:', user);
      throw new Error('No email found');
    }

    console.log('User found with email:', user.email);

    const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Get the product's prices
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    if (prices.data.length === 0) {
      throw new Error('No prices found for this product')
    }

    // Use the first active price for the product
    const priceId = prices.data[0].id;
    console.log('Found price ID:', priceId);

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    let customerId = undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    }

    console.log('Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/dashboard`,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    })

    console.log('Checkout session created:', session.id);
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

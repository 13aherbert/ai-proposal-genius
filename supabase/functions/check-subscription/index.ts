
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user?.email) {
      throw new Error('No email found')
    }

    console.log('Checking subscription for user:', user.id)

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subscriptionError) {
      console.log('No active subscription found, defaulting to trial plan')
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          plan: 'trial'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    let plan = 'trial';
    if (subscription) {
      if (subscription.plan_type.includes('starter')) {
        plan = 'starter';
      } else if (subscription.plan_type.includes('pro')) {
        plan = 'pro';
      }
    }

    console.log('Subscription check result:', { subscribed: !!subscription, plan })

    return new Response(
      JSON.stringify({ 
        subscribed: !!subscription,
        plan: plan
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        subscribed: false,
        plan: 'trial',
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

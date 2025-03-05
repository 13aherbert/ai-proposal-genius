
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

    // Extract and validate auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No Authorization header provided')
      throw new Error('No authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('Using token for auth:', token.substring(0, 10) + '...')
    
    // Get user data from token
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError) {
      console.error('Error getting user from token:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!authData || !authData.user) {
      console.error('No user data returned from auth')
      throw new Error('User not found')
    }
    
    const user = authData.user
    console.log('Found user:', user.id, user.email || 'No email')
    
    // If no email is available but we have a user ID, we can still proceed
    if (!user.email) {
      console.warn('User has no email, but continuing with user ID:', user.id)
    }

    // Fetch subscription by user_id
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.log('Error finding subscription:', subscriptionError);
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          plan: 'trial',
          error: subscriptionError.message,
          user: {
            id: user.id,
            email: user.email || null
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    let plan = 'trial';
    let isActive = false;
    
    if (subscription) {
      console.log('Found subscription:', subscription);
      isActive = subscription.status === 'active';
      
      if (subscription.plan_type.includes('starter')) {
        plan = 'starter';
      } else if (subscription.plan_type.includes('pro')) {
        plan = 'pro';
      }
    } else {
      // No subscription found, check if we need to create a default trial
      console.log('No subscription found for user:', user.id);
      
      // Here we could create a trial subscription, but for now we'll just return trial status
      // The client-side useSubscription hook should handle creating the trial subscription
    }

    console.log('Subscription check result:', { 
      subscribed: isActive, 
      plan, 
      userEmail: user.email || 'Not available',
      userId: user.id 
    })

    return new Response(
      JSON.stringify({ 
        subscribed: isActive,
        plan: plan,
        subscription: subscription || null,
        user: {
          id: user.id,
          email: user.email || null
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in check-subscription function:', error)
    return new Response(
      JSON.stringify({ 
        subscribed: false,
        plan: 'trial',
        error: error.message,
        debug: {
          timestamp: new Date().toISOString(),
          version: '1.1'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

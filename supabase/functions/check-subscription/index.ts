
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or key');
      throw new Error('Server configuration error');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get JWT from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header provided');
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Using token for JWT auth:', token.substring(0, 10) + '...');
    
    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) {
      console.error('No user found after auth');
      throw new Error('User not found');
    }
    
    console.log('Successfully authenticated user:', user.id);
    
    // Continue with subscription check using user ID (which is always available)
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Error finding subscription:', subscriptionError);
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
    let projectLimit = 3; // Default to trial limit
    
    if (subscription) {
      console.log('Found subscription:', subscription);
      isActive = subscription.status === 'active';
      
      if (subscription.plan_type.includes('starter')) {
        plan = 'starter';
        projectLimit = 10; // Starter users get 10 projects
      } else if (subscription.plan_type.includes('pro')) {
        plan = 'pro';
        projectLimit = 30; // Pro users get 30 projects
      }
      
      // If there's a specific project_limit in the subscription, use that
      if (subscription.project_limit) {
        projectLimit = subscription.project_limit;
      }
      
      // Make sure plan_type is clearly set for frontend
      subscription.plan_type = plan;
      
      // Ensure project_limit is included
      if (!subscription.project_limit) {
        subscription.project_limit = projectLimit;
      }
    } else {
      console.log('No subscription found for user:', user.id);
    }

    console.log('Subscription check result:', { 
      subscribed: isActive, 
      plan, 
      projectLimit,
      userEmail: user.email || 'Not available',
      userId: user.id 
    });

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
    console.error('Error in check-subscription function:', error);
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


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
      console.log('Plan type:', subscription.plan_type);
      console.log('Status:', subscription.status);
      console.log('Current project limit:', subscription.project_limit);
      
      isActive = subscription.status === 'active';
      
      // Normalize the plan type to lowercase for consistent comparison
      const normalizedPlanType = subscription.plan_type.toLowerCase();
      
      if (normalizedPlanType.includes('starter')) {
        plan = 'starter';
        projectLimit = 10; // Explicitly set starter users to get 10 projects
        console.log('Setting starter plan project limit to 10');
      } else if (normalizedPlanType.includes('pro')) {
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
      } else {
        // For starter plans, override if the stored limit is incorrect (3 instead of 10)
        if (plan === 'starter' && subscription.project_limit !== 10) {
          subscription.project_limit = 10;
          console.log('Corrected starter plan project limit from', subscription.project_limit, 'to 10');
          
          // Update the subscription record in the database with the correct limit
          try {
            console.log('Attempting to update subscription record with ID:', subscription.subscription_id);
            const { data: updateData, error: updateError } = await supabaseClient
              .from('subscriptions')
              .update({ 
                project_limit: 10,
                plan_type: 'starter' // Ensure plan_type is lowercase 'starter'
              })
              .eq('subscription_id', subscription.subscription_id)
              .select();
              
            if (updateError) {
              console.error('Error updating subscription project limit:', updateError);
            } else {
              console.log('Successfully updated project limit in database to 10. Updated data:', updateData);
            }
          } catch (updateError) {
            console.error('Exception updating subscription:', updateError);
          }
        }
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
          version: '1.4' // Incremented version for tracking
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})

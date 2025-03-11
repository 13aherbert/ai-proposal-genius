
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to check-subscription");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error('Unauthorized: Invalid token');
    }
    
    console.log("Authenticated user:", user.id);

    // Get the user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Error getting subscription:', subError);
      throw new Error(`Error getting subscription: ${subError.message}`);
    }

    // Handle case where user has no subscription
    if (!subscription) {
      console.log('No subscription found, creating default trial subscription');
      
      const now = new Date().toISOString();
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'trial',
          status: 'trialing',
          project_limit: 3,
          features: {},
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating trial subscription:', createError);
        throw new Error(`Error creating trial subscription: ${createError.message}`);
      }
      
      console.log('Created trial subscription:', newSubscription);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          subscription: newSubscription
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    console.log("Found subscription:", subscription);
    
    // Normalize plan type to lowercase for consistency
    const normalizedPlanType = (subscription.plan_type || '').toLowerCase();
    
    // Ensure project limit is correct based on plan type
    let projectLimit = subscription.project_limit;
    let needsUpdate = false;
    
    if (normalizedPlanType === 'starter' && projectLimit !== 10) {
      console.log(`Fixing incorrect starter plan project limit: ${projectLimit} -> 10`);
      projectLimit = 10;
      needsUpdate = true;
    } else if (normalizedPlanType === 'pro' && projectLimit !== 30) {
      console.log(`Fixing incorrect pro plan project limit: ${projectLimit} -> 30`);
      projectLimit = 30;
      needsUpdate = true;
    } else if (normalizedPlanType === 'trial' && projectLimit !== 3) {
      console.log(`Fixing incorrect trial plan project limit: ${projectLimit} -> 3`);
      projectLimit = 3;
      needsUpdate = true;
    }
    
    // If plan type was not lowercase or project limit was incorrect, update the record
    if (normalizedPlanType !== subscription.plan_type || needsUpdate) {
      console.log(`Updating subscription with correct plan type (${normalizedPlanType}) and project limit (${projectLimit})`);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: normalizedPlanType,
          project_limit: projectLimit,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscription.subscription_id);
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
      } else {
        console.log('Successfully updated subscription with normalized values');
      }
    }
    
    // Return normalized subscription data
    const normalizedSubscription = {
      ...subscription,
      plan_type: normalizedPlanType,
      project_limit: projectLimit
    };
    
    console.log("Returning normalized subscription:", normalizedSubscription);

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription: normalizedSubscription
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error in check-subscription:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

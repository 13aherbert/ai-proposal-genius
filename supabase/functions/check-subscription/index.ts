
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

    // Parse body for any special instructions
    let forceRefresh = false;
    let targetUserId = null;
    
    try {
      const body = await req.json();
      forceRefresh = !!body.force_refresh;
      targetUserId = body.user_id || null;
      console.log("Request body:", JSON.stringify(body));
    } catch (e) {
      // No body or invalid JSON, continue normally
    }

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
    
    console.log("Authenticated user:", user.id, user.email);
    
    // Use target user ID if provided and requester is an admin
    let userId = user.id;
    
    if (targetUserId && targetUserId !== userId) {
      // Check if requester is an admin
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        console.error("Non-admin user tried to access another user's subscription");
        throw new Error('Unauthorized: Only admins can check other users\' subscriptions');
      }
      
      console.log(`Admin ${user.id} is checking subscription for user ${targetUserId}`);
      userId = targetUserId;
    }

    // Get the user's subscription with no-cache headers if forced refresh is requested
    const cacheHeaders = forceRefresh ? 
      { 'Cache-Control': 'no-cache, no-store, must-revalidate' } : 
      {};
      
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Error getting subscription:', subError);
      throw new Error(`Error getting subscription: ${subError.message}`);
    }

    // Handle case where user has no subscription
    if (!subscription) {
      console.log(`No subscription found for user ${userId}, creating default trial subscription`);
      
      const now = new Date().toISOString();
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
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
    
    console.log("Found subscription:", JSON.stringify(subscription));
    
    // Normalize plan type to lowercase for consistency
    const normalizedPlanType = (subscription.plan_type || '').toLowerCase();
    
    // Debug info: Check if subscription data is as expected
    console.log(`Current subscription details:
      - User ID: ${userId}
      - Email: ${user.email}
      - Plan Type: ${subscription.plan_type} (normalized: ${normalizedPlanType})
      - Status: ${subscription.status}
      - Project Limit: ${subscription.project_limit}
      - Subscription ID: ${subscription.subscription_id}
    `);
    
    // CRITICAL FIX: Ensure project limit is correct based on plan type
    let projectLimit = subscription.project_limit;
    let needsUpdate = false;
    
    // Force correct limits for each plan type regardless of stored value
    if (normalizedPlanType === 'starter') {
      if (projectLimit !== 10) {
        console.log(`Fixing incorrect starter plan project limit: ${projectLimit} -> 10`);
        projectLimit = 10;
        needsUpdate = true;
      }
    } else if (normalizedPlanType === 'pro') {
      if (projectLimit !== 30) {
        console.log(`Fixing incorrect pro plan project limit: ${projectLimit} -> 30`);
        projectLimit = 30;
        needsUpdate = true;
      }
    } else if (normalizedPlanType === 'trial') {
      if (projectLimit !== 3) {
        console.log(`Fixing incorrect trial plan project limit: ${projectLimit} -> 3`);
        projectLimit = 3;
        needsUpdate = true;
      }
    }
    
    // If plan type was not lowercase or project limit was incorrect, update the record
    if (normalizedPlanType !== subscription.plan_type || needsUpdate) {
      console.log(`Updating subscription with correct plan type (${normalizedPlanType}) and project limit (${projectLimit})`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: normalizedPlanType,
          project_limit: projectLimit,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscription.subscription_id)
        .select();
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
      } else {
        console.log('Successfully updated subscription with normalized values:', updateData);
      }
    }
    
    // Double-check the subscription after any updates
    if (needsUpdate) {
      const { data: verifiedSub, error: verifyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscription_id', subscription.subscription_id)
        .single();
        
      if (verifyError) {
        console.error('Error verifying updated subscription:', verifyError);
      } else {
        console.log('Verified subscription after update:', verifiedSub);
      }
    }
    
    // Return normalized subscription data
    const normalizedSubscription = {
      ...subscription,
      plan_type: normalizedPlanType,
      project_limit: projectLimit
    };
    
    console.log("Returning normalized subscription:", JSON.stringify(normalizedSubscription));

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription: normalizedSubscription
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { corsHeaders } from "../_shared/cors.ts";
import { SUBSCRIPTION_PLAN_LIMITS } from "../_shared/subscription-limits.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to admin-update-subscription");
    
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
    
    console.log("Authenticated admin user:", user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body:", JSON.stringify(requestBody));
    } catch (e) {
      console.error("Error parsing request body:", e);
      throw new Error('Invalid request body: ' + e.message);
    }
    
    const { email, plan, status } = requestBody;
    
    if (!email) {
      console.error("Email is required but was not provided");
      throw new Error('Email is required');
    }

    // Find user by email (case insensitive)
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.listUsers();
      
    if (authUserError) {
      console.error('Error finding user in auth.users:', authUserError);
      throw new Error(`Error finding user: ${authUserError.message}`);
    }
    
    const foundUser = authUserData.users.find(u => 
      u.email && u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!foundUser) {
      console.error(`User with email ${email} not found`);
      throw new Error(`User with email ${email} not found`);
    }
    
    console.log(`Found user with ID: ${foundUser.id} via auth.users`);
    const userId = foundUser.id;

    // Normalize plan type to lowercase for consistency
    let planType = (plan || 'starter').toLowerCase(); // Default to starter if not specified
    let subscriptionStatus = status || 'active'; // Default to active if not specified
    
    // CRITICAL FIX: Determine project limit based on plan (enforce strict plan types)
    let projectLimit;
    
    // Always use the constant values from subscription limits
    switch (planType) {
      case 'pro':
        projectLimit = SUBSCRIPTION_PLAN_LIMITS.pro; // 30 projects
        break;
      case 'starter':
        // IMPORTANT: All starter plans must have 10 projects
        projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter; // 10 projects
        break;
      case 'trial':
        projectLimit = SUBSCRIPTION_PLAN_LIMITS.trial; // 3 projects
        break;
      default:
        // Force valid plan type
        console.log(`Invalid plan type: ${plan}, forcing to 'starter' with limit ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
        planType = 'starter';
        projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
    }

    console.log(`Target subscription update - Plan: ${planType}, Status: ${subscriptionStatus}, Limit: ${projectLimit}`);

    // Log existing subscription state
    const { data: currentSub, error: currentSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (currentSubError) {
      console.error("Error fetching current subscription:", currentSubError);
    } else {
      console.log("Current subscription state:", currentSub);
    }

    const now = new Date().toISOString();
    
    let result;
    if (currentSub) {
      // Update existing subscription
      console.log(`Updating subscription ${currentSub.subscription_id}`);
      result = await supabase
        .from('subscriptions')
        .update({
          plan_type: planType,
          status: subscriptionStatus,
          project_limit: projectLimit,
          updated_at: now
        })
        .eq('subscription_id', currentSub.subscription_id);
    } else {
      // Create new subscription
      console.log(`Creating new subscription for user ${userId}`);
      result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: subscriptionStatus,
          project_limit: projectLimit,
          updated_at: now,
          created_at: now
        });
    }

    if (result.error) {
      console.error('Error updating subscription:', result.error);
      throw new Error(`Error updating subscription: ${result.error.message}`);
    }

    // Force a direct verification of the update with explicit fields check
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('subscription_id, plan_type, status, project_limit, user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (verifyError) {
      console.error('Error verifying subscription update:', verifyError);
      throw new Error('Failed to verify subscription update');
    }

    if (!verifyData) {
      console.error('Verification failed - no subscription found after update');
      throw new Error('Subscription update verification failed - no data found');
    }

    // Strict verification of all fields
    const isValid = 
      verifyData.plan_type === planType &&
      verifyData.status === subscriptionStatus &&
      verifyData.project_limit === projectLimit &&
      verifyData.user_id === userId;

    if (!isValid) {
      console.error('Verification failed - subscription data mismatch:', {
        expected: {
          plan_type: planType,
          status: subscriptionStatus,
          project_limit: projectLimit,
          user_id: userId
        },
        actual: verifyData
      });
      throw new Error('Subscription update verification failed - data mismatch');
    }

    console.log('Subscription update verified successfully:', verifyData);

    // Force a refresh of the check-subscription edge function cache by calling it directly
    try {
      const checkResponse = await fetch(`${supabaseUrl}/functions/v1/check-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({ 
          force_refresh: true,
          user_id: userId 
        })
      });

      if (!checkResponse.ok) {
        throw new Error(`HTTP error! status: ${checkResponse.status}`);
      }
      console.log("Successfully triggered subscription cache refresh");
    } catch (refreshErr) {
      console.error("Failed to trigger subscription cache refresh:", refreshErr);
      // Non-critical error, continue with the response
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated subscription for ${email} to ${planType} plan with status ${subscriptionStatus}`,
        user: userId,
        plan: planType,
        status: subscriptionStatus,
        project_limit: projectLimit,
        verified_data: verifyData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in admin-update-subscription:', error);
    
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

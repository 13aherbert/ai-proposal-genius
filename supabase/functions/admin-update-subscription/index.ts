
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { corsHeaders } from "../_shared/cors.ts";

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
    
    console.log("Authenticated user:", user.id);

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
    
    // Determine project limit based on plan (enforce strict plan types)
    let projectLimit;
    switch (planType) {
      case 'pro':
        projectLimit = 30;
        break;
      case 'starter':
        projectLimit = 10;
        break;
      case 'trial':
        projectLimit = 3;
        break;
      default:
        // Force valid plan type
        console.log(`Invalid plan type: ${plan}, forcing to 'starter' with limit 10`);
        planType = 'starter';
        projectLimit = 10;
    }

    console.log(`Updating subscription - Plan: ${planType}, Status: ${subscriptionStatus}, Limit: ${projectLimit}`);

    // Check existing subscription
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Error checking subscription:', subError);
      throw new Error(`Error checking subscription: ${subError.message}`);
    }

    const now = new Date().toISOString();
    
    let result;
    if (existingSub) {
      // Update existing subscription
      console.log(`Updating subscription ${existingSub.subscription_id}`);
      result = await supabase
        .from('subscriptions')
        .update({
          plan_type: planType,
          status: subscriptionStatus,
          project_limit: projectLimit,
          updated_at: now
        })
        .eq('subscription_id', existingSub.subscription_id);
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

    // Double verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (verifyError) {
      console.error('Error verifying subscription update:', verifyError);
    } else {
      console.log('Verified subscription data:', verifyData);
      
      if (verifyData) {
        // Check if data matches what we tried to set
        const isValid = 
          verifyData.plan_type === planType &&
          verifyData.status === subscriptionStatus &&
          verifyData.project_limit === projectLimit;
          
        if (!isValid) {
          console.error('Verification failed - subscription data mismatch:', {
            expected: { planType, subscriptionStatus, projectLimit },
            actual: {
              plan_type: verifyData.plan_type,
              status: verifyData.status,
              project_limit: verifyData.project_limit
            }
          });
          throw new Error('Subscription update verification failed');
        }
      }
    }

    // Create profile if needed
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!profileData && !profileError) {
      console.log(`Creating profile for user ${userId}`);
      await supabase
        .from('profiles')
        .insert({
          profile_id: userId,
          username: email,
          created_at: now,
          updated_at: now
        });
    }

    console.log('Subscription updated and verified successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated subscription for ${email} to ${planType} plan with status ${subscriptionStatus}`,
        user: userId,
        plan: planType,
        status: subscriptionStatus,
        project_limit: projectLimit
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

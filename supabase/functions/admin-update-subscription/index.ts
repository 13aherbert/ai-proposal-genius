
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

    console.log(`Checking user with email: ${email}`);

    // Find the user by email (case insensitive)
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.listUsers();
      
    if (authUserError) {
      console.error('Error finding user in auth.users:', authUserError);
      throw new Error(`Error finding user: ${authUserError.message}`);
    }
    
    // Debug: log all emails for comparison
    console.log("Available emails:", authUserData?.users.map(u => u.email?.toLowerCase()));
    
    // Find user with case-insensitive email matching
    const foundUser = authUserData.users.find(u => 
      u.email && u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!foundUser) {
      console.error(`User with email ${email} not found. Available emails: ${authUserData?.users.map(u => u.email)}`);
      throw new Error(`User with email ${email} not found`);
    }
    
    console.log(`Found user with ID: ${foundUser.id} via auth.users`);
    const userId = foundUser.id;

    // Determine project limit based on plan
    let projectLimit = 3; // Default for trial
    let planType = plan || 'starter'; // Default to starter if not specified
    let subscriptionStatus = status || 'active'; // Default to active if not specified
    
    if (planType === 'pro') {
      projectLimit = 30;
    } else if (planType === 'starter') {
      projectLimit = 10;
    }

    // Check if user has an existing subscription
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('subscription_id, status, plan_type, project_limit')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Existing subscription:', existingSub);

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking subscription:', subError);
      throw new Error(`Error checking subscription: ${subError.message}`);
    }

    // Log important information about the subscription update
    console.log(`Plan: ${planType} (${planType.toLowerCase()}), Project Limit: ${projectLimit}`);
    
    if (existingSub) {
      console.log(`Current plan: ${existingSub.plan_type}, Current limit: ${existingSub.project_limit}`);
      
      // Verify if plan is starter and limit is correct
      if (existingSub.plan_type && existingSub.plan_type.toLowerCase() === 'starter' && existingSub.project_limit !== 10) {
        console.log(`WARNING: Starter plan had incorrect project limit (${existingSub.project_limit}). Fixing to 10.`);
      }
      
      // Verify if plan is pro and limit is correct
      if (existingSub.plan_type && existingSub.plan_type.toLowerCase() === 'pro' && existingSub.project_limit !== 30) {
        console.log(`WARNING: Pro plan had incorrect project limit (${existingSub.project_limit}). Fixing to 30.`);
      }
    }

    let result;
    const now = new Date().toISOString();
    
    if (existingSub) {
      // Update the existing subscription
      console.log(`Updating subscription ${existingSub.subscription_id} to plan ${planType} with status ${subscriptionStatus} and project limit ${projectLimit}`);
      
      result = await supabase
        .from('subscriptions')
        .update({
          plan_type: planType.toLowerCase(), // Ensure lowercase for consistency
          status: subscriptionStatus,
          project_limit: projectLimit,
          updated_at: now
        })
        .eq('subscription_id', existingSub.subscription_id);
    } else {
      // Create a new subscription
      console.log(`Creating new ${planType} subscription for user ${userId} with status ${subscriptionStatus} and project limit ${projectLimit}`);
      
      result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType.toLowerCase(), // Ensure lowercase for consistency
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

    // Verify the subscription was updated correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('subscription_id, plan_type, status, project_limit')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (verifyError) {
      console.error('Error verifying subscription update:', verifyError);
    } else {
      console.log('Verified subscription after update:', verifyData);
      
      // Double check plan type and project limit are correct
      if (verifyData) {
        const normalizedPlanType = planType.toLowerCase();
        if (verifyData.plan_type !== normalizedPlanType) {
          console.error(`Plan type mismatch after update: expected ${normalizedPlanType}, got ${verifyData.plan_type}`);
        }
        
        if (verifyData.project_limit !== projectLimit) {
          console.error(`Project limit mismatch after update: expected ${projectLimit}, got ${verifyData.project_limit}`);
        }
      }
    }

    // Now check if the user has a profile and create one if not
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
    }

    if (!profileData) {
      console.log(`No profile found for user ${userId}, creating one`);
      
      // Create a profile for the user
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          profile_id: userId,
          username: email,
          first_name: '',
          last_name: '',
          business_name: '',
          created_at: now,
          updated_at: now
        });

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
      } else {
        console.log('Profile created successfully');
      }
    }

    console.log('Subscription updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated subscription for ${email} to ${planType} plan with status ${subscriptionStatus}`,
        user: userId,
        plan: planType.toLowerCase(),
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

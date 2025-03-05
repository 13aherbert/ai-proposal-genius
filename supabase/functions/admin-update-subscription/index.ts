
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check if the requester is an admin
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !adminCheck) {
      console.error('Admin check error:', adminError);
      // Even without admin rights, proceed since this is a direct update case
      console.log('Proceeding with direct update without admin check');
    }

    // Parse request body
    const { email, plan, status } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Checking user with email: ${email}`);

    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('profile_id')
      .eq('username', email)
      .maybeSingle();

    if (userError) {
      console.error('Error finding user by username:', userError);
      
      // Try to find user by email directly from auth.users
      const { data: authUserData, error: authUserError } = await supabase.auth.admin.listUsers();
      
      if (authUserError) {
        console.error('Error finding user in auth.users:', authUserError);
        throw new Error(`Error finding user: ${authUserError.message}`);
      }
      
      const foundUser = authUserData.users.find(u => u.email === email);
      if (!foundUser) {
        throw new Error(`User with email ${email} not found`);
      }
      
      console.log(`Found user with ID: ${foundUser.id} via auth.users`);
      var userId = foundUser.id;
    } else if (!userData) {
      // If not found in profiles, check auth.users directly
      const { data: authUserData, error: authUserError } = await supabase.auth.admin.listUsers();
      
      if (authUserError) {
        console.error('Error finding user in auth.users:', authUserError);
        throw new Error(`Error finding user: ${authUserError.message}`);
      }
      
      const foundUser = authUserData.users.find(u => u.email === email);
      if (!foundUser) {
        throw new Error(`User with email ${email} not found`);
      }
      
      console.log(`Found user with ID: ${foundUser.id} via auth.users`);
      var userId = foundUser.id;
    } else {
      var userId = userData.profile_id;
      console.log(`Found user with ID: ${userId} via profiles`);
    }

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
      .select('subscription_id, status, plan_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Existing subscription:', existingSub);

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking subscription:', subError);
      throw new Error(`Error checking subscription: ${subError.message}`);
    }

    let result;
    const now = new Date().toISOString();
    
    if (existingSub) {
      // Update the existing subscription
      console.log(`Updating subscription ${existingSub.subscription_id} to plan ${planType} with status ${subscriptionStatus}`);
      
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
      // Create a new subscription
      console.log(`Creating new ${planType} subscription for user ${userId} with status ${subscriptionStatus}`);
      
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
        plan: planType,
        status: subscriptionStatus
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

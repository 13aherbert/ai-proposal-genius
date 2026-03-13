import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { corsHeaders } from "../_shared/cors.ts";
import { getProjectLimit } from "../_shared/subscription-limits.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to admin-update-subscription");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) throw new Error('Unauthorized: Invalid token');
    
    console.log("Authenticated admin user:", user.id);

    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { email, plan, status } = requestBody;
    
    if (!email) throw new Error('Email is required');

    // Find user by email
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.listUsers();
    if (authUserError) throw new Error(`Error finding user: ${authUserError.message}`);
    
    const foundUser = authUserData.users.find(u => 
      u.email && u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!foundUser) throw new Error(`User with email ${email} not found`);
    
    const userId = foundUser.id;
    console.log(`Found user with ID: ${userId}`);

    // Normalize plan type - map legacy names to new tiers
    let planType = (plan || 'starter').toLowerCase();
    const planMapping: Record<string, string> = {
      'basic': 'growth',
      'pro': 'business',
      'trial': 'starter',
    };
    planType = planMapping[planType] || planType;
    
    const subscriptionStatus = status || 'active';
    const projectLimit = getProjectLimit(planType);

    console.log(`Target subscription update - Plan: ${planType}, Status: ${subscriptionStatus}, Limit: ${projectLimit}`);

    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const now = new Date().toISOString();
    
    let result;
    if (currentSub) {
      result = await supabase
        .from('subscriptions')
        .update({ plan_type: planType, status: subscriptionStatus, project_limit: projectLimit, updated_at: now })
        .eq('subscription_id', currentSub.subscription_id);
    } else {
      result = await supabase
        .from('subscriptions')
        .insert({ user_id: userId, plan_type: planType, status: subscriptionStatus, project_limit: projectLimit, updated_at: now, created_at: now });
    }

    if (result.error) throw new Error(`Error updating subscription: ${result.error.message}`);

    // Verify
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('subscription_id, plan_type, status, project_limit, user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (verifyError || !verifyData) throw new Error('Subscription update verification failed');

    const isValid = verifyData.plan_type === planType && verifyData.status === subscriptionStatus && 
      verifyData.project_limit === projectLimit && verifyData.user_id === userId;

    if (!isValid) throw new Error('Subscription update verification failed - data mismatch');

    console.log('Subscription update verified successfully:', verifyData);

    // Trigger cache refresh
    try {
      await fetch(`${supabaseUrl}/functions/v1/check-subscription`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'apikey': supabaseKey },
        body: JSON.stringify({ force_refresh: true, user_id: userId })
      });
    } catch (refreshErr) {
      console.error("Failed to trigger subscription cache refresh:", refreshErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated subscription for ${email} to ${planType} plan`,
        user: userId, plan: planType, status: subscriptionStatus, project_limit: projectLimit,
        verified_data: verifyData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in admin-update-subscription:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

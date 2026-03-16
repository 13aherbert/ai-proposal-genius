
// @ts-ignore: Supabase Edge function doesn't use TypeScript directly
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getProjectLimit } from '../_shared/subscription-limits.ts';
import { corsHeaders, handleCors, addCorsHeaders } from '../_shared/cors.ts';

// The specific user ID that should always have starter plan
const STARTER_USER_ID = "315f2366-4b3e-4c20-83bf-e59d5b80ad4c";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization') || '';
    
    console.log(`Request received: ${req.method} | Auth header present: ${Boolean(authHeader)}`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Not authenticated', status: 401, message: userError?.message || 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ));
    }

    console.log(`Processing subscription check for user: ${user.id}`);

    let forceRefresh = false;
    try {
      const url = new URL(req.url);
      forceRefresh = url.searchParams.get('force') === 'true';
      if (!forceRefresh) {
        const body = await req.json().catch(() => ({}));
        forceRefresh = Boolean(body?.force_refresh);
      }
    } catch (e) {
      console.log("No force refresh parameter or invalid format");
    }

    const starterLimit = getProjectLimit('starter');

    // Special case: specific user always gets starter
    if (user.id === STARTER_USER_ID) {
      console.log(`CRITICAL USER DETECTED: ${user.id} - Force creating starter subscription`);
      
      const { data: existingSubscriptions, error: existingSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (!existingSubError && existingSubscriptions?.length > 0) {
        const existingSub = existingSubscriptions[0];
        const normalizedPlanType = (existingSub.plan_type || '').toLowerCase().trim();
        
        if (normalizedPlanType === 'starter' && existingSub.project_limit === starterLimit) {
          console.log(`User ${user.id} already has correct starter subscription`);
          const roles = await fetchUserRoles(supabase, user.id);
          return addCorsHeaders(new Response(
            JSON.stringify({ subscription: existingSub, roles, timestamp: Date.now() }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          ));
        }
        
        console.log(`Updating subscription for user ${user.id} to starter plan`);
        const { data: updatedSub } = await supabase
          .from('subscriptions')
          .update({ plan_type: 'starter', project_limit: starterLimit, status: 'active' })
          .eq('subscription_id', existingSub.subscription_id)
          .select()
          .single();
          
        const roles = await fetchUserRoles(supabase, user.id);
        return addCorsHeaders(new Response(
          JSON.stringify({ 
            subscription: updatedSub || { ...existingSub, plan_type: 'starter', project_limit: starterLimit, status: 'active' },
            roles, timestamp: Date.now()
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ));
      }
      
      // Create new starter subscription
      const newSub = await createSubscription(supabase, user.id, 'starter', starterLimit);
      const roles = await fetchUserRoles(supabase, user.id);
      return addCorsHeaders(new Response(
        JSON.stringify({ subscription: newSub, roles, timestamp: Date.now() }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));
    }

    // Fetch user roles
    const roles = await fetchUserRoles(supabase, user.id);
    const isBetaTester = roles.includes('beta_tester');

    // Query subscriptions
    console.log(`Querying subscriptions table for user ${user.id}`);
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (subError) {
      console.error(`Error fetching subscription: ${subError.message}`);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: `Database error: ${subError.message}`, status: 500, timestamp: Date.now() }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ));
    }

    const subscription = subscriptions?.[0];
    
    // If no subscription found, create starter
    if (!subscription) {
      console.log(`No subscription found for user ${user.id}, creating starter`);
      const newSub = await createSubscription(supabase, user.id, 'starter', starterLimit);
      return addCorsHeaders(new Response(
        JSON.stringify({ subscription: newSub, roles, timestamp: Date.now(), message: 'Created new starter subscription' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));
    }
    
    // Check and fix plan type / project limit mismatches
    const normalizedPlanType = (subscription.plan_type || '').toLowerCase().trim();
    const expectedLimit = getProjectLimit(normalizedPlanType);
    
    if (subscription.project_limit !== expectedLimit) {
      console.log(`CRITICAL FIX: Correcting project limit for ${normalizedPlanType} plan: ${subscription.project_limit} -> ${expectedLimit}`);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ project_limit: expectedLimit })
        .eq('subscription_id', subscription.subscription_id);
        
      if (!updateError) {
        subscription.project_limit = expectedLimit;
        console.log(`Project limit updated to ${expectedLimit}`);
      } else {
        console.error(`Error updating project limit: ${updateError.message}`);
      }
    }
    
    // Sync organization subscription_tier if mismatched
    await syncOrgTier(supabase, user.id, normalizedPlanType);
    
    console.log(`Returning subscription data for user ${user.id}: plan=${subscription.plan_type}, limit=${subscription.project_limit}`);

    return addCorsHeaders(new Response(
      JSON.stringify({ subscription, roles, timestamp: Date.now() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
  } catch (error) {
    console.error(`Unexpected error: ${error.message || error}`);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: `Server error: ${error.message || 'Unknown error'}`, status: 500, timestamp: Date.now() }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ));
  }
});

async function fetchUserRoles(supabase: any, userId: string): Promise<string[]> {
  try {
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (error) {
      console.error(`Error fetching user roles: ${error.message}`);
      return [];
    }
    return userRoles?.map((r: any) => r.role) || [];
  } catch (e) {
    console.error("Exception fetching user roles:", e);
    return [];
  }
}

async function createSubscription(supabase: any, userId: string, planType: string, projectLimit: number) {
  const newSubscription = {
    subscription_id: crypto.randomUUID(),
    user_id: userId,
    status: 'active',
    plan_type: planType,
    project_limit: projectLimit,
    features: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('subscriptions')
    .insert([newSubscription])
    .select();
    
  if (insertError) {
    console.error(`Error creating subscription: ${insertError.message}`);
    return newSubscription;
  }
  
  return insertData?.[0] || newSubscription;
}

/** Sync organizations.subscription_tier to match the user's subscription plan */
async function syncOrgTier(supabase: any, userId: string, planSlug: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!profile?.current_organization_id) return;

    const orgId = profile.current_organization_id;

    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', orgId)
      .maybeSingle();

    if (org?.subscription_tier === planSlug) return; // already in sync

    const isEnterprise = planSlug === 'enterprise';
    const updatePayload: Record<string, any> = {
      subscription_tier: planSlug,
      updated_at: new Date().toISOString(),
    };

    if (isEnterprise) {
      updatePayload.max_projects = -1;
      updatePayload.max_users = -1;
      updatePayload.sso_enabled = true;
    } else {
      updatePayload.max_projects = getProjectLimit(planSlug);
    }

    const { error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', orgId);

    if (error) {
      console.error(`Error syncing org tier: ${error.message}`);
    } else {
      console.log(`Synced org ${orgId} tier to ${planSlug}`);
    }
  } catch (e) {
    console.error('syncOrgTier error:', e);
  }
}

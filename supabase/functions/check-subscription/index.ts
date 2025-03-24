// @ts-ignore: Supabase Edge function doesn't use TypeScript directly
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SUBSCRIPTION_PLAN_LIMITS } from '../_shared/subscription-limits.ts';
import { corsHeaders, handleCors, addCorsHeaders } from '../_shared/cors.ts';

// The specific user ID that should always have starter plan
const STARTER_USER_ID = "315f2366-4b3e-4c20-83bf-e59d5b80ad4c";

serve(async (req) => {
  // Handle CORS preflight requests first
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create a Supabase client with the auth context of the request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Initialize the client with the request's authorization header
    const authHeader = req.headers.get('Authorization') || '';
    
    console.log(`Request received: ${req.method} | Auth header present: ${Boolean(authHeader)}`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          error: 'Not authenticated', 
          status: 401,
          message: userError?.message || 'Authentication required'
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ));
    }

    console.log(`Processing subscription check for user: ${user.id}`);

    // Try to handle force refresh parameter
    let forceRefresh = false;
    try {
      const url = new URL(req.url);
      forceRefresh = url.searchParams.get('force') === 'true';
      
      if (!forceRefresh) {
        // Also try from JSON body
        const body = await req.json().catch(() => ({}));
        forceRefresh = Boolean(body?.force_refresh);
      }
    } catch (e) {
      // If URL or JSON parsing fails, assume no force refresh
      console.log("No force refresh parameter or invalid format");
    }
    
    if (forceRefresh) {
      console.log("Force refresh requested");
    }

    // Special case: If this is our specific user who needs the starter plan
    if (user.id === STARTER_USER_ID) {
      console.log(`CRITICAL USER DETECTED: ${user.id} - Force creating starter subscription`);
      
      // First check if they already have a subscription
      const { data: existingSubscriptions, error: existingSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      // Log the result of the subscription query
      console.log(`Subscription query for ${user.id}: ${existingSubError ? 'Error' : 'Success'}`);
      if (existingSubError) {
        console.error(`Error checking for existing subscription: ${existingSubError.message}`);
      } else {
        console.log(`Found ${existingSubscriptions?.length || 0} subscriptions for ${user.id}`);
      }
      
      if (!existingSubError && existingSubscriptions && existingSubscriptions.length > 0) {
        // Check if this subscription is already a starter with correct project limit
        const existingSub = existingSubscriptions[0];
        const normalizedPlanType = (existingSub.plan_type || '').toLowerCase().trim();
        
        if (normalizedPlanType === 'starter' && existingSub.project_limit === SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log(`User ${user.id} already has correct starter subscription`);
          
          // Also fetch user roles for complete data
          try {
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id);
              
            const roles = userRoles?.map(r => r.role) || [];
            
            return addCorsHeaders(new Response(
              JSON.stringify({ 
                subscription: existingSub,
                roles,
                timestamp: Date.now() 
              }),
              { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
              }
            ));
          } catch (e) {
            console.error("Error fetching user roles:", e);
            
            return addCorsHeaders(new Response(
              JSON.stringify({ 
                subscription: existingSub,
                timestamp: Date.now() 
              }),
              { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
              }
            ));
          }
        }
        
        // Update subscription to correct values if needed
        console.log(`Updating subscription for user ${user.id} to starter plan`);
        
        const { data: updatedSub, error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            plan_type: 'starter',
            project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
            status: 'active'
          })
          .eq('subscription_id', existingSub.subscription_id)
          .select()
          .single();
          
        if (updateError) {
          console.error(`Error updating subscription: ${updateError.message}`);
        } else {
          console.log(`Successfully updated subscription for ${user.id}`);
        }
        
        // Fetch user roles
        try {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
            
          const roles = userRoles?.map(r => r.role) || [];
          
          // Even if update fails, return the starter subscription data to the client
          return addCorsHeaders(new Response(
            JSON.stringify({ 
              subscription: updatedSub || {
                ...existingSub,
                plan_type: 'starter',
                project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
                status: 'active'
              },
              roles,
              timestamp: Date.now()
            }),
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' } 
            }
          ));
        } catch (e) {
          console.error("Error fetching user roles:", e);
          
          // Return without roles if there was an error
          return addCorsHeaders(new Response(
            JSON.stringify({ 
              subscription: updatedSub || {
                ...existingSub,
                plan_type: 'starter',
                project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
                status: 'active'
              },
              timestamp: Date.now()
            }),
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' } 
            }
          ));
        }
      }
      
      // If no subscription exists, create a new starter subscription
      console.log(`Creating new starter subscription for user ${user.id}`);
      
      const subscriptionId = crypto.randomUUID();
      const newSubscription = {
        subscription_id: subscriptionId,
        user_id: user.id,
        status: 'active',
        plan_type: 'starter',
        project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
        features: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('subscriptions')
        .insert([newSubscription])
        .select();
        
      if (insertError) {
        console.error(`Error creating starter subscription: ${insertError.message}`);
        
        // Even if insert fails, return the starter subscription data to the client
        return addCorsHeaders(new Response(
          JSON.stringify({ 
            subscription: {
              ...newSubscription
            },
            timestamp: Date.now()
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        ));
      }
      
      const createdSubscription = insertData?.[0];
      console.log(`Starter subscription created: ${JSON.stringify(createdSubscription)}`);
      
      // Fetch user roles
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
          
        const roles = userRoles?.map(r => r.role) || [];
        
        return addCorsHeaders(new Response(
          JSON.stringify({ 
            subscription: createdSubscription || newSubscription,
            roles,
            timestamp: Date.now()
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        ));
      } catch (e) {
        console.error("Error fetching user roles:", e);
        
        return addCorsHeaders(new Response(
          JSON.stringify({ 
            subscription: createdSubscription || newSubscription,
            timestamp: Date.now()
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        ));
      }
    }

    // Check if user is a beta tester
    let isBetaTester = false;
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
        
      if (rolesError) {
        console.error(`Error fetching user roles: ${rolesError.message}`);
      } else {
        isBetaTester = userRoles?.some(r => r.role === 'beta_tester') || false;
        console.log(`User ${user.id} beta tester status: ${isBetaTester}`);
      }
    } catch (e) {
      console.error("Exception fetching user roles:", e);
    }

    // Query the subscriptions table for the user's subscription
    console.log(`Querying subscriptions table for user ${user.id}`);
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (subError) {
      console.error(`Error fetching subscription from database: ${subError.message}`);
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          error: `Database error: ${subError.message}`,
          status: 500,
          timestamp: Date.now()
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ));
    }

    const subscription = subscriptions?.[0];
    console.log(`Subscription data: ${subscription ? 'Found' : 'Not found'}`);
    
    // Fetch user roles
    let roles: string[] = [];
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
        
      if (rolesError) {
        console.error(`Error fetching user roles: ${rolesError.message}`);
      } else {
        roles = userRoles?.map(r => r.role) || [];
        console.log(`User roles: ${roles.join(', ') || 'None'}`);
      }
    } catch (e) {
      console.error("Exception fetching user roles:", e);
    }
    
    // If no subscription found, create a trial one (or starter for beta testers)
    if (!subscription) {
      console.log(`No subscription found for user ${user.id}`);
      
      const subscriptionId = crypto.randomUUID();
      const planType = isBetaTester ? 'starter' : 'trial';
      const projectLimit = isBetaTester ? SUBSCRIPTION_PLAN_LIMITS.starter : SUBSCRIPTION_PLAN_LIMITS.trial;
      
      console.log(`Creating default ${planType} subscription for user ${user.id}`);
      
      const newSubscription = {
        subscription_id: subscriptionId,
        user_id: user.id,
        status: isBetaTester ? 'active' : 'trialing',
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
        console.error(`Error creating ${planType} subscription: ${insertError.message}`);
        // Even if insert fails, return the subscription data to the client
        return addCorsHeaders(new Response(
          JSON.stringify({ 
            subscription: {
              ...newSubscription
            },
            roles,
            timestamp: Date.now(),
            message: `Created default ${planType} subscription (not saved due to error)`
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        ));
      }
      
      const createdSubscription = insertData?.[0];
      console.log(`${planType} subscription created: ${JSON.stringify(createdSubscription)}`);
      
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          subscription: createdSubscription || newSubscription,
          roles,
          timestamp: Date.now(),
          message: `Created new ${planType} subscription`
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      ));
    }
    
    // CRITICAL FIX: Check if plan_type is 'starter' but project_limit doesn't match
    // Normalize plan type to lowercase for safer comparison
    const normalizedPlanType = (subscription.plan_type || '').toLowerCase().trim();
    
    // Check for plan type and project limit mismatches, and fix them
    let projectLimitMismatch = false;
    let correctedLimit = subscription.project_limit;
    
    if (normalizedPlanType === 'starter' && subscription.project_limit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
      console.log(`CRITICAL FIX: Correcting project limit for starter plan: ${subscription.project_limit} -> ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
      projectLimitMismatch = true;
      correctedLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
    } else if (normalizedPlanType === 'pro' && subscription.project_limit !== SUBSCRIPTION_PLAN_LIMITS.pro) {
      console.log(`CRITICAL FIX: Correcting project limit for pro plan: ${subscription.project_limit} -> ${SUBSCRIPTION_PLAN_LIMITS.pro}`);
      projectLimitMismatch = true;
      correctedLimit = SUBSCRIPTION_PLAN_LIMITS.pro;
    } else if (normalizedPlanType === 'trial' && subscription.project_limit !== SUBSCRIPTION_PLAN_LIMITS.trial) {
      console.log(`CRITICAL FIX: Correcting project limit for trial plan: ${subscription.project_limit} -> ${SUBSCRIPTION_PLAN_LIMITS.trial}`);
      projectLimitMismatch = true;
      correctedLimit = SUBSCRIPTION_PLAN_LIMITS.trial;
    }
    
    // Update the project limit if it doesn't match the plan type
    if (projectLimitMismatch) {
      // Update the project limit to match the plan
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ project_limit: correctedLimit })
        .eq('subscription_id', subscription.subscription_id);
        
      if (updateError) {
        console.error(`Error updating project limit: ${updateError.message}`);
      } else {
        subscription.project_limit = correctedLimit;
        console.log(`Project limit updated to ${correctedLimit}`);
      }
    }
    
    console.log(`Returning subscription data for user ${user.id}: ${JSON.stringify({
      id: subscription.subscription_id,
      plan: subscription.plan_type,
      status: subscription.status,
      limit: subscription.project_limit
    })}`);

    return addCorsHeaders(new Response(
      JSON.stringify({ 
        subscription,
        roles,
        timestamp: Date.now() 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    ));
  } catch (error) {
    console.error(`Unexpected error: ${error.message || error}`);
    return addCorsHeaders(new Response(
      JSON.stringify({ 
        error: `Server error: ${error.message || 'Unknown error'}`,
        status: 500,
        timestamp: Date.now()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    ));
  }
});

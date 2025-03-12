
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
    
    const start = Date.now();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      throw new Error('Missing Supabase configuration');
    }
    
    // Create client with shorter timeout
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // Set shorter timeout for all requests
            signal: AbortSignal.timeout(5000)
          });
        }
      }
    });

    // Parse body quickly
    let forceRefresh = false;
    let targetUserId = null;
    
    try {
      const body = await req.json();
      forceRefresh = !!body.force_refresh;
      targetUserId = body.user_id || null;
      console.log("Request body:", JSON.stringify(body));
    } catch (e) {
      console.log("No body or invalid JSON, using default parameters");
    }

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Add timeout for auth verification
    const controller = new AbortController();
    const authTimeout = setTimeout(() => controller.abort(), 3000); // Increased from 2000
    
    let user;
    
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      clearTimeout(authTimeout);
      
      if (authError || !userData.user) {
        console.error("Auth error:", authError);
        throw new Error('Unauthorized: Invalid token');
      }
      
      user = userData.user;
      console.log("Authenticated user:", user.id, user.email);
    } catch (authError) {
      clearTimeout(authTimeout);
      console.error("Auth verification failed:", authError);
      throw new Error('Auth verification timeout or error');
    }
    
    // Use target user ID if provided and requester is an admin
    let userId = user.id;
    
    if (targetUserId && targetUserId !== userId) {
      // Quick check if requester is an admin (with timeout)
      const adminCheckController = new AbortController();
      const adminCheckTimeout = setTimeout(() => adminCheckController.abort(), 2000); // Increased from 1000
      
      try {
        const { data: isAdmin } = await supabase.rpc('is_admin', {}, {
          signal: adminCheckController.signal
        });
        
        clearTimeout(adminCheckTimeout);
        
        if (!isAdmin) {
          console.error("Non-admin user tried to access another user's subscription");
          throw new Error('Unauthorized: Only admins can check other users\' subscriptions');
        }
        
        console.log(`Admin ${user.id} is checking subscription for user ${targetUserId}`);
        userId = targetUserId;
      } catch (error) {
        clearTimeout(adminCheckTimeout);
        console.error("Admin check error or timeout:", error);
        
        // Fallback to using the requester's user ID
        console.log("Falling back to user's own subscription");
        userId = user.id;
      }
    }

    // Set cache headers
    const cacheHeaders = forceRefresh ? 
      { 'Cache-Control': 'no-cache, no-store, must-revalidate' } : 
      {};
      
    console.log(`Fetching subscription for user ${userId} with forceRefresh=${forceRefresh}`);
    
    // Set overall query timeout
    const queryController = new AbortController();
    const queryTimeout = setTimeout(() => queryController.abort(), 4000); // Increased from 3000
    
    try {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .abortSignal(queryController.signal);

      clearTimeout(queryTimeout);

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
        console.log(`Function completed in ${Date.now() - start}ms`);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            subscription: newSubscription
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
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
      
      // Ensure project limit is correct based on plan type
      let projectLimit = subscription.project_limit;
      let needsUpdate = false;
      
      // CRITICAL FIX: Force correct limits for each plan type regardless of stored value
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
      // But don't wait for the update to complete before returning the response
      if (normalizedPlanType !== subscription.plan_type || needsUpdate) {
        console.log(`Updating subscription with correct plan type (${normalizedPlanType}) and project limit (${projectLimit})`);
        
        // Use EdgeRuntime.waitUntil to run this in the background
        EdgeRuntime.waitUntil((async () => {
          try {
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
          } catch (err) {
            console.error('Background update error:', err);
          }
        })());
      }
      
      // Return normalized subscription data immediately
      const normalizedSubscription = {
        ...subscription,
        plan_type: normalizedPlanType,
        project_limit: projectLimit
      };
      
      console.log("Returning normalized subscription:", JSON.stringify(normalizedSubscription));
      console.log(`Function completed in ${Date.now() - start}ms`);

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
    } catch (queryError) {
      clearTimeout(queryTimeout);
      console.error('Query error or timeout:', queryError);
      
      if (queryError.name === 'AbortError') {
        console.log('Query aborted due to timeout');
        throw new Error('Subscription query timed out');
      }
      
      throw queryError;
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in check-subscription:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        status: 400 
      }
    );
  }
});

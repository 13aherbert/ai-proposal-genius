import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify CSRF token
    const csrfToken = req.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return new Response(
        JSON.stringify({ error: 'Missing CSRF token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin privileges using parameterized function (service role client has no auth.uid())
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('direct_admin_check', { user_id_param: user.id });

    if (adminError || !adminCheck) {
      console.error('Admin check failed:', adminError, 'result:', adminCheck);
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { operation, data } = await req.json();

    // Rate limiting check
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_admin_rate_limit', {
        admin_id: user.id,
        action_type: operation,
        max_actions: 10,
        window_minutes: 60
      });

    if (rateLimitError || !rateLimitCheck) {
      console.error('Rate limit exceeded or check failed:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (operation) {
      case 'assign_role':
        if (!data.user_id || !data.role) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: user_id, role' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: roleResult, error: roleError } = await supabase
          .rpc('assign_user_role', {
            _user_id: data.user_id,
            _role: data.role,
            _created_by: user.id
          });

        if (roleError) {
          console.error('Role assignment failed:', roleError);
          return new Response(
            JSON.stringify({ error: roleError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { success: true, role_id: roleResult };
        break;

      case 'remove_role':
        if (!data.user_id || !data.role) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: user_id, role' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: removeResult, error: removeError } = await supabase
          .rpc('remove_user_role', {
            _user_id: data.user_id,
            _role: data.role
          });

        if (removeError) {
          console.error('Role removal failed:', removeError);
          return new Response(
            JSON.stringify({ error: removeError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the role removal
        await supabase.rpc('log_admin_action', {
          admin_user_id: user.id,
          action_type: 'remove_role',
          target_user_id: data.user_id,
          details: { role: data.role, timestamp: new Date().toISOString() }
        });

        result = { success: removeResult };
        break;

      case 'delete_user':
        if (!data.user_id) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: user_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: deleteResult, error: deleteError } = await supabase
          .rpc('delete_user_as_admin', {
            target_user_id: data.user_id
          });

        if (deleteError) {
          console.error('User deletion failed:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { success: deleteResult };
        break;

      case 'update_subscription':
        if (!data.user_id || !data.plan || !data.status) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: user_id, plan, status' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            plan_type: data.plan,
            status: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user_id);

        if (subError) {
          console.error('Subscription update failed:', subError);
          return new Response(
            JSON.stringify({ error: subError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the subscription update
        await supabase.rpc('log_admin_action', {
          admin_user_id: user.id,
          action_type: 'update_subscription',
          target_user_id: data.user_id,
          details: { plan: data.plan, status: data.status, timestamp: new Date().toISOString() }
        });

        result = { success: true };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Secure admin operation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
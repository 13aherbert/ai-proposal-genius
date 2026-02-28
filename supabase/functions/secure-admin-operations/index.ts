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

        // Check if role already exists
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', data.user_id)
          .eq('role', data.role)
          .maybeSingle();

        if (existingRole) {
          result = { success: true, message: 'Role already assigned' };
          break;
        }

        // Insert role directly (service role bypasses RLS)
        const { data: newRole, error: roleInsertError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user_id, role: data.role, created_by: user.id })
          .select('id')
          .single();

        if (roleInsertError) {
          console.error('Role assignment failed:', roleInsertError);
          return new Response(
            JSON.stringify({ error: roleInsertError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log action directly into activity_feed
        await supabase.from('activity_feed').insert({
          user_id: user.id,
          action_type: 'assign_role',
          resource_type: 'admin_action',
          resource_id: data.user_id,
          details: { role: data.role, timestamp: new Date().toISOString() }
        });

        result = { success: true, role_id: newRole.id };
        break;

      case 'remove_role':
        if (!data.user_id || !data.role) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: user_id, role' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError, count: deletedCount } = await supabase
          .from('user_roles')
          .delete({ count: 'exact' })
          .eq('user_id', data.user_id)
          .eq('role', data.role);

        if (deleteError) {
          console.error('Role removal failed:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log action directly
        await supabase.from('activity_feed').insert({
          user_id: user.id,
          action_type: 'remove_role',
          resource_type: 'admin_action',
          resource_id: data.user_id,
          details: { role: data.role, timestamp: new Date().toISOString() }
        });

        result = { success: (deletedCount ?? 0) > 0 };
        break;

      case 'delete_user':
        if (!data.user_id) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: user_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use cascade_delete_user_data directly (doesn't depend on auth.uid())
        const { data: deleteResult, error: delError } = await supabase
          .rpc('cascade_delete_user_data', {
            user_id_param: data.user_id
          });

        if (delError) {
          console.error('User deletion failed:', delError);
          return new Response(
            JSON.stringify({ error: delError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log action directly
        await supabase.from('activity_feed').insert({
          user_id: user.id,
          action_type: 'delete_user',
          resource_type: 'admin_action',
          resource_id: data.user_id,
          details: { timestamp: new Date().toISOString() }
        });

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

        // Log action directly
        await supabase.from('activity_feed').insert({
          user_id: user.id,
          action_type: 'update_subscription',
          resource_type: 'admin_action',
          resource_id: data.user_id,
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
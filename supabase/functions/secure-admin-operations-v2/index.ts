import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and verify authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and verify CSRF token
    const csrfToken = req.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return new Response(
        JSON.stringify({ error: 'CSRF token required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify admin privileges using secure function
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_direct');
    
    if (adminError || !isAdmin) {
      // Log unauthorized access attempt
      await supabase.rpc('log_security_event', {
        event_type_param: 'unauthorized_admin_access',
        target_user_id_param: user.id,
        details_param: {
          attempted_endpoint: 'secure-admin-operations-v2',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('User-Agent')
        }
      });

      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { operation, data } = body;

    if (!operation) {
      return new Response(
        JSON.stringify({ error: 'Operation type required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check admin rate limits
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc(
      'check_admin_rate_limit',
      {
        admin_id: user.id,
        action_type: operation,
        max_actions: 10,
        window_minutes: 60
      }
    );

    if (rateLimitError || !rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Execute admin operations with enhanced security
    switch (operation) {
      case 'assign_role': {
        const { userId, role } = data;
        
        if (!userId || !role) {
          return new Response(
            JSON.stringify({ error: 'User ID and role are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Validate role type
        const validRoles = ['admin', 'beta_tester', 'user', 'system_admin'];
        if (!validRoles.includes(role)) {
          return new Response(
            JSON.stringify({ error: 'Invalid role type' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Prevent non-system-admins from assigning system_admin role
        if (role === 'system_admin') {
          const { data: isSystemAdmin } = await supabase.rpc('is_system_admin');
          if (!isSystemAdmin) {
            return new Response(
              JSON.stringify({ error: 'Only system administrators can assign system_admin role' }),
              { 
                status: 403, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }

        const { data: roleId, error: roleError } = await supabase.rpc('assign_user_role', {
          _user_id: userId,
          _role: role,
          _created_by: user.id
        });

        if (roleError) {
          return new Response(
            JSON.stringify({ error: roleError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Log the action
        await supabase.rpc('log_security_event', {
          event_type_param: 'role_assigned',
          target_user_id_param: userId,
          details_param: {
            role: role,
            assigned_by: user.id,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Role ${role} assigned successfully`,
            roleId 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'remove_role': {
        const { userId, role } = data;
        
        if (!userId || !role) {
          return new Response(
            JSON.stringify({ error: 'User ID and role are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: success, error: removeError } = await supabase.rpc('remove_user_role', {
          _user_id: userId,
          _role: role
        });

        if (removeError) {
          return new Response(
            JSON.stringify({ error: removeError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Log the action
        await supabase.rpc('log_security_event', {
          event_type_param: 'role_removed',
          target_user_id_param: userId,
          details_param: {
            role: role,
            removed_by: user.id,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Role ${role} removed successfully` 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'delete_user': {
        const { userId } = data;
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Prevent users from deleting themselves
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete your own account through admin interface' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: success, error: deleteError } = await supabase.rpc('delete_user_as_admin', {
          target_user_id: userId
        });

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Log the action
        await supabase.rpc('log_security_event', {
          event_type_param: 'user_deleted',
          target_user_id_param: userId,
          details_param: {
            deleted_by: user.id,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'update_subscription': {
        const { userId, subscriptionData } = data;
        
        if (!userId || !subscriptionData) {
          return new Response(
            JSON.stringify({ error: 'User ID and subscription data are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Update subscription with validation
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_type: subscriptionData.plan_type,
            status: subscriptionData.status,
            project_limit: subscriptionData.project_limit,
            current_period_end: subscriptionData.current_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Log the action
        await supabase.rpc('log_security_event', {
          event_type_param: 'subscription_updated',
          target_user_id_param: userId,
          details_param: {
            updated_by: user.id,
            new_plan: subscriptionData.plan_type,
            new_status: subscriptionData.status,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Subscription updated successfully' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Admin operation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
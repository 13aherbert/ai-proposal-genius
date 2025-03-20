
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.16'

// Configure CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Admin-delete-user function called");
    
    // Parse the request body
    let userId;
    let requestBody = null;
    
    // First try to get userId from request body
    try {
      requestBody = await req.json();
      console.log("Request body parsed:", requestBody);
      userId = requestBody.userId;
    } catch (parseError) {
      console.error("Error parsing request body or empty body:", parseError);
    }
    
    // If userId not found in body, try URL params
    if (!userId) {
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
      console.log("Falling back to URL parameter, userId:", userId);
    }
    
    if (!userId) {
      console.error("No userId provided in request");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User ID is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Processing delete request for user: ${userId}`);

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Create a client for auth verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the user who made the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: userError } = await authClient.auth.getUser(token)

    if (userError || !user.user) {
      console.error('Auth verification error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid auth credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Request authenticated as user: ${user.user.id}`);

    // Check if the user is an admin using direct_admin_check function to avoid recursion
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin.rpc('direct_admin_check', {
      user_id_param: user.user.id
    })

    if (adminCheckError || !adminCheck) {
      console.error('Admin check error:', adminCheckError || "User is not an admin");
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied - admin role required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prevent admins from deleting their own account through this interface
    if (user.user.id === userId) {
      console.error("User attempted to delete their own account");
      return new Response(
        JSON.stringify({ success: false, error: 'You cannot delete your own account from the admin interface' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Admin ${user.user.email} is attempting to delete user ${userId}`);

    // Perform the manual deletion of all related records before deleting the auth user
    try {
      console.log("Starting manual cascade deletion for user:", userId);
      
      // 1. Delete user roles
      console.log("Deleting user roles...");
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      
      // 2. Delete user status cache
      console.log("Deleting user status cache...");
      await supabaseAdmin.from('user_status_cache').delete().eq('user_id', userId);
      
      // 3. Delete subscriptions
      console.log("Deleting subscriptions...");
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
      
      // 4. Delete admin role checks
      console.log("Deleting admin role checks...");
      await supabaseAdmin.from('admin_role_checks').delete().eq('user_id', userId);
      
      // 5. Delete knowledge entries
      console.log("Deleting knowledge entries...");
      await supabaseAdmin.from('knowledge_entries').delete().eq('user_id', userId);
      
      // 6. Delete project documents (need to delete these before projects)
      console.log("Deleting project documents...");
      await supabaseAdmin.from('project_documents').delete().eq('user_id', userId);
      
      // 7. Delete proposal sections (need to delete these before projects)
      console.log("Deleting proposal sections...");
      await supabaseAdmin.from('proposal_sections').delete().eq('user_id', userId);
      
      // 8. Delete projects
      console.log("Deleting projects...");
      await supabaseAdmin.from('projects').delete().eq('user_id', userId);
      
      // 9. Delete profile
      console.log("Deleting profile...");
      await supabaseAdmin.from('profiles').delete().eq('profile_id', userId);
      
      // 10. Finally, delete the auth user itself
      console.log("Deleting auth user...");
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error deleting auth user:', deleteError);
        return new Response(
          JSON.stringify({ success: false, error: deleteError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      console.log("User and all related data successfully deleted");
    } catch (deleteError) {
      console.error('Error in delete process:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: deleteError instanceof Error ? deleteError.message : 'Unknown error occurred during deletion' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`User ${userId} successfully deleted`);
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in admin-delete-user function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})


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
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    
    // Parse the request - supabase.functions.invoke() sends data differently
    let userId;
    let requestBody = null;
    
    // For Supabase Functions invoke, try to get data from request body
    try {
      const body = await req.text(); // Get as text first
      console.log("Raw request body:", body);
      
      if (body && body.trim() !== '') {
        requestBody = JSON.parse(body);
        console.log("Parsed request body:", requestBody);
        userId = requestBody.userId;
      }
    } catch (parseError) {
      console.log("Could not parse request body as JSON:", parseError);
    }
    
    // If userId not found in body, try URL params
    if (!userId) {
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
      console.log("Trying URL parameter, userId:", userId);
    }
    
    // If still no userId, try different body parsing approaches
    if (!userId) {
      try {
        // Reset request body stream and try different parsing
        const clonedReq = req.clone();
        const formData = await clonedReq.formData();
        userId = formData.get('userId') as string;
        console.log("Found userId in form data:", userId);
      } catch (formError) {
        console.log("Could not parse as form data:", formError);
      }
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
      
      // Delete all references to the user in proper order to avoid foreign key violations
      
      // 1. Delete security audit log entries (this was blocking deletion)
      console.log("Deleting security audit log entries...");
      await supabaseAdmin.from('security_audit_log').delete().eq('user_id', userId);
      await supabaseAdmin.from('security_audit_log').delete().eq('target_user_id', userId);
      
      // 2. Delete activity feed entries
      console.log("Deleting activity feed entries...");
      await supabaseAdmin.from('activity_feed').delete().eq('user_id', userId);
      
      // 3. Delete notifications
      console.log("Deleting notifications...");
      await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
      
      // 4. Delete organization member activity
      console.log("Deleting organization member activity...");
      await supabaseAdmin.from('organization_member_activity').delete().eq('user_id', userId);
      
      // 5. Delete organization members (remove from organizations)
      console.log("Deleting organization memberships...");
      await supabaseAdmin.from('organization_members').delete().eq('user_id', userId);
      
      // 6. Delete user roles
      console.log("Deleting user roles...");
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      
      // 7. Delete user status cache
      console.log("Deleting user status cache...");
      await supabaseAdmin.from('user_status_cache').delete().eq('user_id', userId);
      
      // 8. Delete subscriptions
      console.log("Deleting subscriptions...");
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
      
      // 9. Delete admin role checks
      console.log("Deleting admin role checks...");
      await supabaseAdmin.from('admin_role_checks').delete().eq('user_id', userId);
      
      // 10. Delete knowledge entries
      console.log("Deleting knowledge entries...");
      await supabaseAdmin.from('knowledge_entries').delete().eq('user_id', userId);
      
      // 11. Delete project documents (need to delete these before projects)
      console.log("Deleting project documents...");
      await supabaseAdmin.from('project_documents').delete().eq('user_id', userId);
      
      // 12. Delete proposal sections (need to delete these before projects)
      console.log("Deleting proposal sections...");
      await supabaseAdmin.from('proposal_sections').delete().eq('user_id', userId);
      
      // 13. Delete project collaborators
      console.log("Deleting project collaborators...");
      await supabaseAdmin.from('project_collaborators').delete().eq('user_id', userId);
      await supabaseAdmin.from('project_collaborators').delete().eq('invited_by', userId);
      
      // 14. Delete projects
      console.log("Deleting projects...");
      await supabaseAdmin.from('projects').delete().eq('user_id', userId);
      
      // 15. Delete organization invitations
      console.log("Deleting organization invitations...");
      await supabaseAdmin.from('organization_invitations').delete().eq('invited_by', userId);
      await supabaseAdmin.from('organization_member_invitations').delete().eq('invited_by', userId);
      
      // 16. Delete beta invitations
      console.log("Deleting beta invitations...");
      await supabaseAdmin.from('beta_invitations').delete().eq('invited_by', userId);
      
      // 17. Delete data export requests
      console.log("Deleting data export requests...");
      await supabaseAdmin.from('data_export_requests').delete().eq('user_id', userId);
      await supabaseAdmin.from('data_export_requests').delete().eq('requested_by', userId);
      
      // 18. Delete admin rate limits
      console.log("Deleting admin rate limits...");
      await supabaseAdmin.from('admin_rate_limits').delete().eq('admin_user_id', userId);
      
      // 19. Delete password reset attempts
      console.log("Deleting password reset attempts...");
      const { data: userProfile } = await supabaseAdmin.from('profiles').select('username').eq('profile_id', userId).single();
      if (userProfile?.username) {
        await supabaseAdmin.from('password_reset_attempts').delete().eq('email', userProfile.username);
      }
      
      // 20. Delete profile (last table reference)
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

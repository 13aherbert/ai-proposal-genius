
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define CORS headers for browser compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Auth header present:", !!req.headers.get('Authorization'));
  
  try {
    // Get user ID from auth context
    const authUser = req.headers.get('x-supabase-auth-user');
    let userId = null;
    
    if (authUser) {
      try {
        userId = JSON.parse(authUser).id;
        console.log("Retrieved user ID from auth context:", userId);
      } catch (e) {
        console.error("Failed to parse auth user:", e);
      }
    }
    
    // If no user ID found in auth context, try getting it from Authorization header
    if (!userId) {
      // Get authorization header
      const authHeader = req.headers.get('Authorization');
      let token = null;
      
      // Try header auth first
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
        console.log("Using token from Authorization header");
      } else {
        // Try to get token from JSON body if not in headers
        try {
          const contentLength = req.headers.get('content-length');
          const hasBody = contentLength && parseInt(contentLength) > 0;
          
          if (hasBody) {
            const clonedReq = req.clone();
            try {
              const body = await clonedReq.json();
              if (body?.token) {
                token = body.token;
                console.log("Found token in request body");
              }
            } catch (parseError) {
              console.error("Error parsing request body:", parseError);
            }
          } else {
            console.log("Request has empty body (content-length: 0)");
          }
        } catch (e) {
          console.error("Error accessing request body:", e);
        }
      }
      
      // If we still don't have userId but we have a token, try to validate it
      if (!userId && token) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase environment variables");
          }
          
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);

          if (userError || !user) {
            console.error("Error getting user from token:", userError);
            throw new Error("Invalid token");
          }
          
          userId = user.id;
          console.log("Extracted user ID from token:", userId);
        } catch (tokenError) {
          console.error("Failed to validate token:", tokenError);
        }
      }
    }
    
    // Return error if no userId is provided
    if (!userId) {
      console.error("Unable to determine user ID from request");
      return new Response(
        JSON.stringify({ error: "User ID could not be determined", details: "No valid auth context or token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with admin privileges to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase service role key or URL");
      return new Response(
        JSON.stringify({ error: "Server configuration error", details: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role key to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking user permissions for user ID:", userId);
    
    // First check if the user is a system admin or admin
    const { data: systemAdminStatus, error: systemAdminError } = await adminClient.rpc('check_system_admin_role', { 
      user_id_param: userId 
    });
    
    const { data: adminStatus, error: adminError } = await adminClient.rpc('direct_admin_check', { 
      user_id_param: userId 
    });
    
    if (systemAdminError || adminError) {
      console.error("Error checking admin status:", { systemAdminError, adminError });
    }
    
    const isSystemAdmin = !!systemAdminStatus;
    const isAdmin = !!adminStatus;
    
    console.log("User permissions:", { isSystemAdmin, isAdmin, userId });
    
    // If user is system admin or admin, return ALL user roles
    if (isSystemAdmin || isAdmin) {
      console.log("User has admin privileges, fetching all user roles");
      
      try {
        // First, get all user roles
        const { data: allUserRoles, error: allRolesError } = await adminClient
          .from('user_roles')
          .select('*');

        if (allRolesError) {
          console.error("Error fetching all user roles:", allRolesError);
          throw new Error(`Error fetching all user roles: ${allRolesError.message}`);
        }

        console.log(`Fetched ${allUserRoles?.length || 0} user roles`);

        // Get all unique user IDs from roles
        const userIds = [...new Set(allUserRoles?.map(role => role.user_id) || [])];
        console.log(`Found ${userIds.length} unique users with roles`);

        // Now fetch profile information for all these users including timestamps
        const { data: profiles, error: profilesError } = await adminClient
          .from('profiles')
          .select('profile_id, username, first_name, last_name, business_name, created_at, updated_at')
          .in('profile_id', userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }

        console.log(`Fetched ${profiles?.length || 0} profiles`);

        // Combine the data by adding email and timestamps from profiles to user roles
        const rolesWithEmails = (allUserRoles || []).map(role => {
          const profile = profiles?.find(p => p.profile_id === role.user_id);
          return {
            ...role,
            email: profile?.username || null,
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            business_name: profile?.business_name || null,
            created_at: profile?.created_at || null,
            updated_at: profile?.updated_at || null
          };
        });

        console.log(`Successfully processed ${rolesWithEmails.length} user roles with profile data for admin`);
        return new Response(
          JSON.stringify({ 
            roles: rolesWithEmails,
            adminCheckResult: true,
            isSystemAdmin,
            isAdmin
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error executing admin query:", error);
        throw error;
      }
    } else {
      // For regular users, only return their own roles
      console.log("Regular user, fetching only their roles");
      
      try {
        const { data: userRoles, error: userRolesError } = await adminClient
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);

        if (userRolesError) {
          throw new Error(`Error fetching user roles: ${userRolesError.message}`);
        }

        console.log(`Successfully fetched ${userRoles?.length || 0} user roles`);
        return new Response(
          JSON.stringify({ 
            roles: userRoles || [],
            adminCheckResult: false,
            isSystemAdmin: false,
            isAdmin: false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error executing user query:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Server error:", error);
    
    // Return generic error - detailed info in server logs only
    console.error("Detailed error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch user roles",
        code: "INTERNAL_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

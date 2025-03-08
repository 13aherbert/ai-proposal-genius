
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

type UserRole = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by: string | null;
};

type UserInfo = {
  id: string;
  email: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace('Bearer ', '');
    
    // If auth header is present, verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const userId = user.id;
    console.log("Authenticated user ID:", userId);

    // Check if the user is an admin by accessing user_roles table directly
    console.log("Checking if user is admin");
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');
    
    if (userRolesError) {
      console.error("Error checking admin role:", userRolesError);
      return new Response(
        JSON.stringify({ error: "Error checking admin status", details: userRolesError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = userRoles && userRoles.length > 0;
    console.log("Is user admin:", isAdmin);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all user roles with direct SQL to avoid RLS recursion
    console.log("Fetching user roles");
    const { data: roleRecords, error: getRolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (getRolesError) {
      console.error("Error fetching user roles:", getRolesError);
      return new Response(
        JSON.stringify({ error: "Error fetching user roles", details: getRolesError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email information for all users
    console.log("Fetching user email information");
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching user emails:", usersError);
      return new Response(
        JSON.stringify({ error: "Error fetching user emails", details: usersError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a map of user_id to email for quick lookup
    const userEmailMap = new Map<string, string>();
    usersData.users.forEach(user => {
      if (user.email) {
        userEmailMap.set(user.id, user.email);
      }
    });

    // Add email information to each role record
    const enhancedRoleRecords = roleRecords.map((role: UserRole) => {
      return {
        ...role,
        email: userEmailMap.get(role.user_id) || null
      };
    });

    console.log(`Successfully fetched ${enhancedRoleRecords.length} user roles`);
    return new Response(
      JSON.stringify(enhancedRoleRecords),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

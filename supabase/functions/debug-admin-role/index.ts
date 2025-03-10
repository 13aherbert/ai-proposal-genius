
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { userId } = await req.json();
    
    // Basic validation
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token to verify the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is authenticated and has admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Check if caller is admin
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isCallerAdmin = callerRoles?.some(r => r.role === "admin") || false;
    
    if (!isCallerAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user's current roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: "Error fetching user roles", details: rolesError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has admin role
    const hasAdminRole = userRoles?.some(r => r.role === "admin") || false;
    let adminRoleId = null;
    
    // If user doesn't have admin role, grant it
    if (!hasAdminRole) {
      const { data: newRole, error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "admin",
          created_by: user.id
        })
        .select()
        .single();
        
      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Error granting admin role", details: insertError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      adminRoleId = newRole.id;
    } else {
      // Get the ID of the existing admin role
      adminRoleId = userRoles.find(r => r.role === "admin")?.id;
    }

    // Call direct_admin_check function to verify
    const { data: directCheck, error: directCheckError } = await supabase.rpc(
      "direct_admin_check",
      { user_id_param: userId }
    );
    
    // Call is_admin function to check the standard check
    // Note: This is called with the admin user, not the target user
    const { data: isAdminCheck, error: isAdminCheckError } = await supabase.rpc("is_admin");

    return new Response(
      JSON.stringify({
        userId,
        roles: userRoles,
        hasAdminRole,
        adminRoleId,
        nowHasAdminRole: hasAdminRole || !!adminRoleId,
        directCheck,
        directCheckError,
        isAdminCheck,
        isAdminCheckError
      }),
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

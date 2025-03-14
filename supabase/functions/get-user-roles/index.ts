
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
      // Try to get token from JSON body if not in headers
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.token) {
          console.log("Found token in request body");
          // Create Supabase client with the token from body
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Verify the token and get user
          const { data: { user }, error: userError } = await supabase.auth.getUser(body.token);
          
          if (userError || !user) {
            console.error("Error getting user from token in body:", userError);
            return new Response(
              JSON.stringify({ error: "Invalid token", details: userError }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const userId = user.id;
          console.log("User authenticated via token in body:", userId);
          
          // Get user roles
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId);
          
          if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            return new Response(
              JSON.stringify({ error: "Error fetching roles", details: rolesError }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          console.log(`Successfully fetched ${userRoles?.length || 0} roles via token in body`);
          return new Response(
            JSON.stringify({ roles: userRoles || [] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("Error parsing request body:", e);
      }
      
      console.error("No authorization header or token provided");
      return new Response(
        JSON.stringify({ error: "Authorization header or token required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
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

    // Get all user roles for this user
    console.log("Fetching user roles");
    const { data: roleRecords, error: getRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (getRolesError) {
      console.error("Error fetching user roles:", getRolesError);
      return new Response(
        JSON.stringify({ error: "Error fetching user roles", details: getRolesError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully fetched ${roleRecords?.length || 0} user roles`);
    return new Response(
      JSON.stringify({ roles: roleRecords || [] }),
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

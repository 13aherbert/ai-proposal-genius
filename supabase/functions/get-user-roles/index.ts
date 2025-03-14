
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define CORS headers for browser compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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

  console.log("Auth header present:", !!req.headers.get('Authorization'));
  
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    let token = null;
    let userId = null;
    
    // Try header auth first
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
      console.log("Using token from Authorization header");
    } else {
      // Try to get token from JSON body if not in headers
      try {
        // Check if there's a body first
        const contentLength = req.headers.get('content-length');
        const hasBody = contentLength && parseInt(contentLength) > 0;
        
        if (hasBody) {
          const body = await req.json();
          if (body?.token) {
            token = body.token;
            console.log("Found token in request body");
          }
        } else {
          console.log("Request has no body, cannot retrieve token");
          
          // Try to get user from auth context
          const authUser = req.headers.get('x-supabase-auth-user');
          if (authUser) {
            try {
              userId = JSON.parse(authUser).id;
              console.log("Retrieved user ID from auth context:", userId);
            } catch (e) {
              console.error("Failed to parse auth user:", e);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing request body:", e);
      }
    }
    
    // Return error if no token or userId is provided
    if (!token && !userId) {
      console.error("No authorization header, token, or user ID provided");
      return new Response(
        JSON.stringify({ error: "Authorization header, token, or user ID required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);
    
    // Verify the user if we don't have userId yet
    if (!userId && token) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
          console.error("Error getting user:", userError);
          return new Response(
            JSON.stringify({ error: "Unauthorized", details: userError }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        userId = user.id;
      } catch (err) {
        console.error("Failed to verify user token:", err);
        return new Response(
          JSON.stringify({ error: "Failed to verify user", details: err.message }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    console.log("Authenticated user ID:", userId);

    // Get all user roles for this user using a direct query to bypass RLS
    console.log("Fetching user roles");
    
    // Using direct SQL to avoid RLS recursion issues
    const { data: roleRecords, error: getRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (getRolesError) {
      console.error("Error fetching user roles:", getRolesError);
      
      if (getRolesError.message.includes("infinite recursion")) {
        console.log("Detected recursion issue, trying alternative query approach");
        
        // Alternative approach: use RPC function that's set to SECURITY DEFINER
        const { data: rpcRoleRecords, error: rpcError } = await supabase
          .rpc('get_all_user_roles_by_id', { user_id_param: userId });
          
        if (rpcError) {
          console.error("RPC fallback also failed:", rpcError);
          return new Response(
            JSON.stringify({ error: "Error fetching user roles", details: rpcError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`Successfully fetched ${rpcRoleRecords?.length || 0} user roles via RPC`);
        return new Response(
          JSON.stringify({ roles: rpcRoleRecords || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
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

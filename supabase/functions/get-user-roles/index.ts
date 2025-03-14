
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

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log("Auth header present:", !!authHeader);
    
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
        }
      } catch (e) {
        console.error("Error parsing request body:", e);
      }
    }
    
    // Return error if no token is provided
    if (!token) {
      console.error("No authorization header or token provided");
      return new Response(
        JSON.stringify({ error: "Authorization header or token required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    userId = user.id;
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

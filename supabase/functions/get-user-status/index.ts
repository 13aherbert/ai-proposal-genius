
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

  try {
    // Get the authenticated user ID
    const userId = await extractUserId(req);
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: "Authentication required", 
          details: "User ID could not be determined" 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Fetching user status for user ID: ${userId}`);
    
    // Setup admin client to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get comprehensive user status (roles + subscription) using the new function
    const { data: userStatus, error: statusError } = await adminClient.rpc(
      'get_user_permissions',
      { user_id_param: userId }
    );
    
    if (statusError) {
      console.error("Error fetching user permissions:", statusError);
      throw new Error(`Database error: ${statusError.message}`);
    }
    
    // Get roles for backwards compatibility
    const { data: roleRecords, error: rolesError } = await adminClient.rpc(
      'get_all_user_roles_by_id',
      { user_id_param: userId }
    );
    
    if (rolesError) {
      console.warn("Error fetching roles:", rolesError);
    }
    
    // Get subscription details for complete data
    const { data: subscriptionData, error: subError } = await adminClient.rpc(
      'get_subscription_details',
      { user_id_param: userId }
    );
    
    if (subError) {
      console.warn("Error fetching subscription details:", subError);
    }

    // Return comprehensive user data
    return new Response(
      JSON.stringify({
        status: userStatus,
        roles: roleRecords || [],
        subscription: subscriptionData,
        timestamp: Date.now(),
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch user status", 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper function to extract user ID from request
async function extractUserId(req: Request): Promise<string | null> {
  // Try auth context first (most reliable)
  const authUser = req.headers.get('x-supabase-auth-user');
  if (authUser) {
    try {
      const userId = JSON.parse(authUser).id;
      console.log("Retrieved user ID from auth context:", userId);
      return userId;
    } catch (e) {
      console.error("Failed to parse auth user:", e);
    }
  }
  
  // Try authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    console.log("Using token from Authorization header");
    
    try {
      // Create Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables");
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        console.error("Error getting user from token:", userError);
        return null;
      }
      
      console.log("Extracted user ID from token:", user.id);
      return user.id;
    } catch (tokenError) {
      console.error("Failed to validate token:", tokenError);
    }
  }
  
  // Try request body as last resort
  try {
    // Check if there's a body by checking content-length
    const contentLength = req.headers.get('content-length');
    const hasBody = contentLength && parseInt(contentLength) > 0;
    
    if (hasBody) {
      const clonedReq = req.clone();
      const body = await clonedReq.json();
      if (body?.userId) {
        console.log("Found userId in request body");
        return body.userId;
      } else if (body?.token) {
        // Use token from body to get user ID
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase environment variables");
          }
          
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: { user }, error: userError } = await supabase.auth.getUser(body.token);

          if (userError || !user) {
            console.error("Error getting user from token in body:", userError);
            return null;
          }
          
          console.log("Extracted user ID from token in body:", user.id);
          return user.id;
        } catch (tokenError) {
          console.error("Failed to validate token from body:", tokenError);
        }
      }
    }
  } catch (e) {
    console.error("Error accessing request body:", e);
  }
  
  return null;
}

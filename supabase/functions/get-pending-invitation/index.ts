
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request data
    const requestData = await req.json();
    const { email } = requestData;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Checking pending invitation for email: ${email}`);
    
    // Get pending invitation for the email
    const { data: invitation, error: invitationError } = await supabase.rpc(
      'check_pending_invitation',
      { email_param: email }
    );
    
    if (invitationError) {
      console.error("Error checking pending invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: "Failed to check pending invitation", details: invitationError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Pending invitation check result:", invitation);
    
    // If the invitation exists, return it
    return new Response(
      JSON.stringify(invitation),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

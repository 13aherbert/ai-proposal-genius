
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request data
    const requestData = await req.json();
    
    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if this is a status update request
    if (requestData.action === 'update' && requestData.id) {
      console.log(`Updating invitation ${requestData.id} status to ${requestData.status}`);
      
      if (!requestData.status) {
        return new Response(
          JSON.stringify({ error: "Missing status parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update the invitation status
      const { data: updateResult, error: updateError } = await supabase.rpc(
        'update_beta_invitation_status',
        {
          invitation_id_param: requestData.id,
          status_param: requestData.status,
          accepted_at_param: requestData.acceptedAt || null
        }
      );
      
      console.log("Update result:", updateResult, "Error:", updateError);
      
      if (updateError) {
        console.error("Error updating invitation status:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update invitation", details: updateError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, updated: updateResult }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Otherwise, handle code verification
    const { code } = requestData;
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Invitation code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Verifying invitation code: ${code}`);
    
    // SECURITY: Use the secure verification function that only returns true/false
    // This prevents any data exposure at the database level
    
    // First check if the invitation code is valid using the secure function
    const { data: isValid, error: validationError } = await supabase.rpc(
      'verify_invitation_code_secure',
      { code_param: code }
    );
    
    if (validationError) {
      console.error("Error validating invitation:", validationError);
      return new Response(
        JSON.stringify({ error: "Failed to validate invitation", details: validationError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If valid, get the full invitation details using service role (this is secure since it's server-side)
    const { data: invitations, error: invitationError } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('invite_code', code)
      .eq('status', 'pending');
    
    console.log("Verification result:", invitations, "Error:", invitationError);
    
    if (invitationError) {
      console.error("Error verifying invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: "Failed to verify invitation", details: invitationError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!invitations || invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const invitation = invitations[0];
    
    // Check if the invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      // Mark the invitation as expired
      await supabase.rpc(
        'update_beta_invitation_status',
        {
          invitation_id_param: invitation.id,
          status_param: 'expired',
          accepted_at_param: null
        }
      );
        
      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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

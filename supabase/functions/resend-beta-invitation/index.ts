
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    
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
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is admin
    const { data: adminRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin');
      
    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: "Error checking admin status", details: roleError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const isAdmin = adminRoles && adminRoles.length > 0;
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get invitation ID from request
    const { invitationId } = await req.json();
    
    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: "Invitation ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the invitation details
    const { data: invitation, error: getError } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
      
    if (getError || !invitation) {
      console.error("Error getting invitation:", getError);
      return new Response(
        JSON.stringify({ error: "Failed to get invitation details", details: getError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Cannot resend expired invitation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Prepare the invitation URL
    const baseUrl = Deno.env.get("PUBLIC_URL") || "https://optirfp.ai";
    const inviteUrl = `${baseUrl}/beta?invite=${invitation.invite_code}`;
    
    // Send the email via the send-email edge function
    const emailPayload = {
      to: [invitation.email], // Ensure we're sending to the actual recipient
      subject: "You're Invited to the OptiRFP Beta Program!",
      templateType: "beta_invite",
      templateData: {
        inviteCode: invitation.invite_code,
        inviteUrl: inviteUrl,
        expiresAt: invitation.expires_at
      },
      forceRealRecipient: true // Add a flag to bypass development redirects
    };
    
    console.log("Resending beta invitation email to:", invitation.email);
    console.log("Email payload:", JSON.stringify(emailPayload, null, 2));
    
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      "send-email",
      {
        body: emailPayload
      }
    );
    
    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Email response:", emailResponse);
    
    // Mark the invitation as sent
    const { data: updateData, error: updateError } = await supabase
      .from('beta_invitations')
      .update({ 
        invitation_email_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select()
      .single();
      
    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update invitation", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: updateData, 
        email: emailResponse,
        inviteUrl: inviteUrl
      }),
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

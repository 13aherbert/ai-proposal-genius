
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
    
    // Get request data
    const { email, expiresInDays = 30 } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate invitation code
    const inviteCode = Array(8)
      .fill(0)
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join('');
    
    // Set expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Create invitation in database
    const { data: invitation, error: invitationError } = await supabase
      .from('beta_invitations')
      .insert({
        email: email,
        invite_code: inviteCode,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation", details: invitationError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Prepare the invitation URL
    const baseUrl = Deno.env.get("PUBLIC_URL") || "https://optirfp.ai";
    const inviteUrl = `${baseUrl}/beta?invite=${inviteCode}`;
    
    // Send the email via the send-email edge function
    const emailPayload = {
      to: [email],
      subject: "You're Invited to the OptiRFP Beta Program!",
      templateType: "beta_invite",
      templateData: {
        inviteCode: inviteCode,
        inviteUrl: inviteUrl,
        expiresAt: expiresAt.toISOString()
      }
    };
    
    console.log("Sending beta invitation email:", emailPayload);
    
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      "send-email",
      {
        body: emailPayload
      }
    );
    
    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't return an error, continue to return the invitation
      // Just log it so we can see the issue
    } else {
      console.log("Email response:", emailResponse);
      
      // Mark the invitation as email sent
      await supabase
        .from('beta_invitations')
        .update({ 
          invitation_email_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);
    }
    
    return new Response(
      JSON.stringify({
        ...invitation,
        email_sent: emailError ? false : true,
        email_error: emailError ? emailError.message : null,
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

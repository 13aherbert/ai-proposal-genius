import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", code: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", code: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invitationToken } = await req.json();
    if (!invitationToken) {
      return new Response(JSON.stringify({ error: "Missing invitation token", code: "invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invitation, error: invErr } = await supabaseAdmin
      .from("organization_member_invitations")
      .select("id, organization_id, email, role, department, status, expires_at")
      .eq("invitation_token", invitationToken)
      .maybeSingle();

    if (invErr || !invitation) {
      return new Response(JSON.stringify({ error: "Invitation not found", code: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invitation.status === "accepted") {
      return new Response(JSON.stringify({ error: "Invitation already accepted", code: "already_accepted", organizationId: invitation.organization_id }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invitation.status !== "pending") {
      return new Response(JSON.stringify({ error: "Invitation is no longer valid", code: "invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation has expired", code: "expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = (user.email ?? "").toLowerCase();
    if (userEmail !== invitation.email.toLowerCase()) {
      return new Response(JSON.stringify({
        error: "This invitation was sent to a different email address",
        code: "wrong_email",
        invitedEmail: invitation.email,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already a member?
    const { data: existingMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingMember) {
      const { error: insertErr } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role,
          department: invitation.department,
          status: "active",
          invited_at: new Date().toISOString(),
        });

      if (insertErr) {
        console.error("Member insert error:", insertErr);
        return new Response(JSON.stringify({ error: "Failed to add member", code: "insert_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    await supabaseAdmin
      .from("organization_member_invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", invitation.id);

    // Set as current organization for the user
    await supabaseAdmin
      .from("profiles")
      .update({ current_organization_id: invitation.organization_id })
      .eq("profile_id", user.id);

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", invitation.organization_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      success: true,
      organizationId: invitation.organization_id,
      organizationName: org?.name ?? null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("accept-invitation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", code: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

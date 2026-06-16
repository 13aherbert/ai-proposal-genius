import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organizationId, email, role, department, message, origin } = await req.json();

    if (!organizationId || !email || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields: organizationId, email, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a member of the organization
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: "Only organization owners or admins can invite members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prevent privilege escalation: admins cannot create owner-level invitations
    const allowedRoles = membership.role === "owner"
      ? ["owner", "admin", "manager", "editor", "reviewer", "viewer", "member", "billing_admin"]
      : ["admin", "manager", "editor", "reviewer", "viewer", "member", "billing_admin"];
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "You cannot assign a role equal to or higher than your own" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    // Count current team size (active members + pending invitations)
    const [membersResult, invitationsResult] = await Promise.all([
      supabaseAdmin
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "active"),
      supabaseAdmin
        .from("organization_member_invitations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
    ]);

    const teamSize = (membersResult.count ?? 0) + (invitationsResult.count ?? 0);

    // Get subscription and pricing tier
    const { data: subscription } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("plan_type")
      .eq("organization_id", organizationId)
      .single();

    const planType = subscription?.plan_type || "starter";

    // Map plan to pricing tier slug
    const slugMap: Record<string, string> = {
      starter: "starter",
      basic: "growth",
      pro: "business",
      enterprise: "enterprise",
      growth: "growth",
      business: "business",
      trial: "starter",
    };
    const tierSlug = slugMap[planType.toLowerCase()] || "starter";

    const { data: tier } = await supabaseAdmin
      .from("pricing_tiers")
      .select("name, users_limit, slug")
      .eq("slug", tierSlug)
      .eq("is_active", true)
      .single();

    const usersLimit = tier?.users_limit ?? 1;

    // Enforce user limit (only Starter has a limit; paid tiers have -1 = unlimited)
    if (usersLimit !== -1 && teamSize >= usersLimit) {
      return new Response(JSON.stringify({
        error: "User limit reached",
        message: "Free plan allows 1 user. Upgrade for unlimited team members.",
        upgradeUrl: "/pricing",
        tier: tier?.name || "Starter",
        currentUsers: teamSize,
        limit: usersLimit,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing pending invitation for same email
    const { data: existingInvite } = await supabaseAdmin
      .from("organization_member_invitations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return new Response(JSON.stringify({ error: "An invitation is already pending for this email" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: insertError } = await supabaseAdmin
      .from("organization_member_invitations")
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        department: department || null,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isUnlimited = usersLimit === -1;

    // Send invitation email via Resend (best-effort).
    let emailStatus: "sent" | "failed" = "failed";
    try {
      const [{ data: inviterProfile }, { data: org }] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("first_name, last_name, username")
          .eq("profile_id", user.id)
          .maybeSingle(),
        supabaseAdmin
          .from("organizations")
          .select("name")
          .eq("id", organizationId)
          .maybeSingle(),
      ]);

      const inviterName = [inviterProfile?.first_name, inviterProfile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
        || inviterProfile?.username
        || user.email
        || "A teammate";

      const baseUrl = (typeof origin === "string" && origin.startsWith("http"))
        ? origin.replace(/\/$/, "")
        : "https://optirfp.ai";
      const acceptUrl = `${baseUrl}/accept-invitation?token=${encodeURIComponent(invitationToken)}`;

      const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke(
        "send-team-invite-email",
        {
          body: {
            recipientEmail: email,
            inviterName,
            inviterEmail: user.email,
            organizationName: org?.name ?? "your team",
            role,
            personalMessage: message ?? null,
            acceptUrl,
            expiresAt: expiresAt.toISOString(),
          },
        },
      );

      if (!emailError && emailResult?.success) {
        emailStatus = "sent";
      } else {
        console.error("Email send failed:", emailError, emailResult);
      }
    } catch (e) {
      console.error("Email dispatch threw:", e);
    }

    return new Response(JSON.stringify({
      success: true,
      invitation,
      email_status: emailStatus,
      message: emailStatus === "sent"
        ? `Invitation email sent to ${email}.`
        : `Invitation created. We couldn't send the email — copy the invite link to share manually.`,
      ...(isUnlimited ? { note: "You can invite unlimited users on your plan." } : {}),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("team-invite error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

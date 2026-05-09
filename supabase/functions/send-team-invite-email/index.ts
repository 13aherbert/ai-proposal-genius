import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface InvitePayload {
  recipientEmail: string;
  inviterName: string;
  inviterEmail?: string;
  organizationName: string;
  role: string;
  personalMessage?: string | null;
  acceptUrl: string;
  expiresAt: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderText(p: InvitePayload): string {
  const expires = new Date(p.expiresAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const lines = [
    `${p.inviterName} invited you to join ${p.organizationName} on OptiRFP as a ${p.role}.`,
    "",
    p.personalMessage ? `Personal message: ${p.personalMessage}` : "",
    p.personalMessage ? "" : "",
    `Accept your invitation: ${p.acceptUrl}`,
    "",
    `This invitation expires on ${expires}.`,
    "",
    "If you weren't expecting this email, you can safely ignore it.",
    "",
    "OptiRFP — https://optirfp.ai",
    "To stop receiving these emails, reply with the word UNSUBSCRIBE.",
  ];
  return lines.filter((l) => l !== "" || true).join("\n");
}

function renderHtml(p: InvitePayload): string {
  const expires = new Date(p.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const personal = p.personalMessage
    ? `<div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:14px 18px;border-radius:6px;margin:24px 0;color:#3f3f46;font-style:italic;">${escapeHtml(p.personalMessage)}</div>`
    : "";
  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>You're invited to ${escapeHtml(p.organizationName)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:28px 32px;color:#ffffff;">
          <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;">OptiRFP</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">You're invited to join ${escapeHtml(p.organizationName)}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
            <strong>${escapeHtml(p.inviterName)}</strong> has invited you to join <strong>${escapeHtml(p.organizationName)}</strong> on OptiRFP as a <strong>${escapeHtml(p.role)}</strong>.
          </p>
          ${personal}
          <div style="text-align:center;margin:32px 0;">
            <a href="${p.acceptUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;">Accept invitation</a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">This invitation expires on <strong>${expires}</strong>.</p>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">If the button doesn't work, copy and paste this URL into your browser:<br/><a href="${p.acceptUrl}" style="color:#7c3aed;word-break:break-all;">${p.acceptUrl}</a></p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
          You received this email because ${escapeHtml(p.inviterName)} invited you to join ${escapeHtml(p.organizationName)} on OptiRFP. If you weren't expecting this, you can safely ignore it.<br/>
          OptiRFP · <a href="https://optirfp.ai" style="color:#9ca3af;text-decoration:underline;">optirfp.ai</a> · <a href="mailto:unsubscribe@optirfp.ai?subject=Unsubscribe" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Allow service-role (internal call from team-invite) OR a signed-in user.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (token !== serviceKey) {
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = await req.json() as InvitePayload;
    if (!payload.recipientEmail || !payload.acceptUrl || !payload.organizationName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Suppression check: skip sending if recipient previously unsubscribed.
    const supabaseAdmin2 = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    const { data: suppressed } = await supabaseAdmin2.rpc("has_unsubscribed", {
      _email: payload.recipientEmail,
    });
    if (suppressed === true) {
      return new Response(JSON.stringify({ success: false, suppressed: true, error: "Recipient unsubscribed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromAddress = Deno.env.get("INVITE_FROM_ADDRESS") || "OptiRFP Team <team@updates.optirfp.ai>";
    const replyTo = payload.inviterEmail || Deno.env.get("INVITE_REPLY_TO") || "support@optirfp.ai";

    // Build signed unsubscribe URLs (HMAC-SHA256 of lowercased email).
    const UNSUB_SECRET = Deno.env.get("UNSUBSCRIBE_SECRET") || "";
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(UNSUB_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload.recipientEmail.toLowerCase()));
    const unsubToken = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const qs = `email=${encodeURIComponent(payload.recipientEmail)}&token=${unsubToken}`;
    const unsubscribeUrl = `https://optirfp.ai/unsubscribe?${qs}`;
    const oneClickUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-unsubscribe?${qs}`;

    const body: Record<string, unknown> = {
      from: fromAddress,
      to: [payload.recipientEmail],
      reply_to: replyTo,
      subject: `${payload.inviterName} invited you to join ${payload.organizationName} on OptiRFP`,
      html: renderHtml(payload),
      text: renderText(payload),
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@optirfp.ai?subject=Unsubscribe>, <${oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };

    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error("Resend error:", resp.status, data);
      return new Response(JSON.stringify({ success: false, error: `Resend ${resp.status}`, details: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-team-invite-email error:", err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

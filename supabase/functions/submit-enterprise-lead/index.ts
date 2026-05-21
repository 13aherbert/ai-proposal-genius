import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  company_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  team_size: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  source: z.enum(["pricing", "contact", "csm", "white_label", "other"]).optional(),
  requested_tier: z.enum(["enterprise", "white_label"]).optional(),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const lead = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("enterprise_leads")
      .insert({
        company_name: lead.company_name,
        email: lead.email,
        team_size: lead.team_size ?? null,
        message: lead.message ?? null,
        source: lead.source ?? "pricing",
        requested_tier: lead.requested_tier ?? "enterprise",
      })
      .select()
      .single();

    if (error) throw error;

    // Best-effort notification email via Resend connector (optional)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (RESEND_API_KEY && LOVABLE_API_KEY) {
      try {
        await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "OptiRFP <onboarding@resend.dev>",
            to: ["sales@optirfp.ai"],
            subject: `New ${lead.requested_tier ?? "enterprise"} lead: ${escapeHtml(lead.company_name)}`,
            html: `<p><b>Company:</b> ${escapeHtml(lead.company_name)}</p>
<p><b>Email:</b> ${escapeHtml(lead.email)}</p>
<p><b>Team:</b> ${escapeHtml(lead.team_size ?? "—")}</p>
<p><b>Source:</b> ${escapeHtml(lead.source ?? "pricing")}</p>
<p><b>Tier:</b> ${escapeHtml(lead.requested_tier ?? "enterprise")}</p>
<p><b>Message:</b><br/>${escapeHtml(lead.message ?? "").replace(/\n/g, "<br/>")}</p>`,
          }),
        });
      } catch (e) {
        console.error("Resend notify failed", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-enterprise-lead error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

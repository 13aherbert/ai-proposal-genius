import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  organization_id: z.string().uuid().optional().nullable(),
  new_org_name: z.string().trim().min(2).max(120).optional().nullable(),
  tier: z.enum(["enterprise", "white_label"]),
  seat_limit: z.number().int().min(1).max(100000).default(25),
  project_limit: z.number().int().min(-1).max(100000).default(-1),
  billing_model: z.enum(["flat_rate", "per_user", "usage_based"]).default("flat_rate"),
  custom_price: z.number().min(0).optional().nullable(),
  trial_ends_at: z.string().datetime().optional().nullable(),
  csm_name: z.string().trim().max(120).optional().nullable(),
  csm_email: z.string().trim().email().optional().nullable(),
  csm_calendly_url: z.string().trim().url().optional().nullable(),
  csm_phone: z.string().trim().max(40).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Missing authorization", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) return jsonError("Invalid token", 401);

    // Verify system_admin
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "system_admin")
      .maybeSingle();
    if (!roleRow) return jsonError("Forbidden", 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const p = parsed.data;

    // 1. Resolve org
    let orgId = p.organization_id ?? null;
    if (!orgId) {
      if (!p.new_org_name) return jsonError("Provide organization_id or new_org_name", 400);
      const { data: slugRpc } = await supabase.rpc("generate_organization_slug", {
        org_name: p.new_org_name,
      });
      const { data: newOrg, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          name: p.new_org_name,
          slug: slugRpc ?? p.new_org_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          subscription_tier: p.tier,
          is_white_label: p.tier === "white_label",
          custom_domain_enabled: p.tier === "white_label",
          sso_enabled: true,
          csm_name: p.csm_name,
          csm_email: p.csm_email,
          csm_calendly_url: p.csm_calendly_url,
          csm_phone: p.csm_phone,
        })
        .select()
        .single();
      if (orgErr) throw orgErr;
      orgId = newOrg.id;
    } else {
      // Update existing org tier + CSM
      await supabase
        .from("organizations")
        .update({
          subscription_tier: p.tier,
          is_white_label: p.tier === "white_label",
          custom_domain_enabled: p.tier === "white_label" ? true : undefined,
          sso_enabled: true,
          csm_name: p.csm_name,
          csm_email: p.csm_email,
          csm_calendly_url: p.csm_calendly_url,
          csm_phone: p.csm_phone,
        })
        .eq("id", orgId);
    }

    // 2. Upsert organization_subscriptions
    const subPayload: Record<string, unknown> = {
      organization_id: orgId,
      status: "active",
      plan_type: p.tier,
      billing_model: p.billing_model,
      seat_limit: p.seat_limit,
      project_limit: p.project_limit,
      cancel_at_period_end: false,
    };
    if (p.custom_price != null) {
      subPayload.custom_pricing = { amount: p.custom_price, currency: "usd" };
    }
    if (p.trial_ends_at) subPayload.trial_ends_at = p.trial_ends_at;

    const { data: existingSub } = await supabase
      .from("organization_subscriptions")
      .select("id")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (existingSub) {
      await supabase
        .from("organization_subscriptions")
        .update(subPayload)
        .eq("id", existingSub.id);
    } else {
      subPayload.subscription_id = crypto.randomUUID();
      await supabase.from("organization_subscriptions").insert(subPayload);
    }

    // 3. White-label seed: branding + features
    if (p.tier === "white_label") {
      const { data: brand } = await supabase
        .from("organization_branding")
        .select("id")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!brand) {
        await supabase.from("organization_branding").insert({
          organization_id: orgId,
          brand_name: p.new_org_name ?? null,
        });
      }
      const features = ["white_label", "custom_domain", "sso", "api_access"];
      for (const f of features) {
        await supabase
          .from("organization_features")
          .upsert(
            { organization_id: orgId, feature_name: f, is_enabled: true },
            { onConflict: "organization_id,feature_name" },
          );
      }
    }

    // 4. Mark lead as converted
    await supabase
      .from("enterprise_leads")
      .update({ status: "converted", converted_org_id: orgId })
      .eq("id", p.lead_id);

    return new Response(JSON.stringify({ ok: true, organization_id: orgId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-provision-enterprise error", e);
    return jsonError((e as Error).message, 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

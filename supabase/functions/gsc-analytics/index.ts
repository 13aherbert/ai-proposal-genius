import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE = "https://optirfp.ai/";
const SITE_ENC = encodeURIComponent(SITE);

async function gscFetch(path: string, init: RequestInit = {}) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  if (!GSC_KEY) throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY not configured");

  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: any;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) {
    throw new Error(`GSC ${res.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }
  return body;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("is_system_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action = "overview", days = 28 } = await req.json().catch(() => ({}));

    if (action === "verify") {
      // Verify the meta tag, then add as a property
      try {
        await gscFetch(`/siteVerification/v1/webResource?verificationMethod=META`, {
          method: "POST",
          body: JSON.stringify({ site: { identifier: SITE, type: "SITE" } }),
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ ok: false, step: "verify", error: e.message }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        await gscFetch(`/webmasters/v3/sites/${SITE_ENC}`, { method: "PUT" });
      } catch (e: any) {
        return new Response(JSON.stringify({ ok: false, step: "register", error: e.message }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sites") {
      const sites = await gscFetch(`/webmasters/v3/sites`);
      return new Response(JSON.stringify(sites), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // overview: totals, top queries, top pages over last N days (default 28)
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2); // GSC data lags ~2 days
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);

    const queryAnalytics = (dimensions: string[], rowLimit = 25) =>
      gscFetch(`/webmasters/v3/sites/${SITE_ENC}/searchAnalytics/query`, {
        method: "POST",
        body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
      });

    const [totals, queries, pages, byDate] = await Promise.all([
      queryAnalytics([], 1).catch((e) => ({ error: e.message })),
      queryAnalytics(["query"], 25).catch((e) => ({ error: e.message })),
      queryAnalytics(["page"], 25).catch((e) => ({ error: e.message })),
      queryAnalytics(["date"], 1000).catch((e) => ({ error: e.message })),
    ]);

    return new Response(JSON.stringify({
      startDate, endDate,
      totals, queries, pages, byDate,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("gsc-analytics error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

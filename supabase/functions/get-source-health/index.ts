import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SourceConfig {
  key: string;
  name: string;
  secretName: string;
  avgTimeoutMs: number;
}

const SOURCES: SourceConfig[] = [
  { key: "sam_gov", name: "SAM.gov", secretName: "SAM_GOV_API_KEY", avgTimeoutMs: 15000 },
  { key: "grants_gov", name: "Grants.gov", secretName: "", avgTimeoutMs: 15000 },
  { key: "california", name: "California eProcure", secretName: "APIFY_API_TOKEN", avgTimeoutMs: 45000 },
  { key: "texas", name: "Texas SmartBuy", secretName: "", avgTimeoutMs: 25000 },
  { key: "new_york", name: "New York Contract Reporter", secretName: "", avgTimeoutMs: 20000 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "system_admin"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which API keys are configured
    const apiKeyStatus: Record<string, boolean> = {};
    for (const source of SOURCES) {
      if (source.secretName) {
        const val = Deno.env.get(source.secretName);
        apiKeyStatus[source.key] = !!val && val.length > 0;
      } else {
        apiKeyStatus[source.key] = true; // No key needed
      }
    }

    // Ping each source to get live health
    const healthChecks = await Promise.allSettled(
      SOURCES.map(async (source) => {
        const startTime = Date.now();
        let status: "healthy" | "degraded" | "down" = "healthy";
        let responseTimeMs = 0;
        let errorMessage: string | null = null;
        let lastSuccess: string | null = null;

        try {
          if (source.key === "sam_gov") {
            const samKey = Deno.env.get("SAM_GOV_API_KEY");
            if (!samKey) { status = "down"; errorMessage = "API key not configured"; }
            else {
              const res = await fetch(
                `https://api.sam.gov/opportunities/v2/search?api_key=${samKey}&limit=1&postedFrom=01/01/2025&postedTo=12/31/2025`,
                { signal: AbortSignal.timeout(10000) }
              );
              responseTimeMs = Date.now() - startTime;
              if (res.ok) { lastSuccess = new Date().toISOString(); }
              else if (res.status === 429) { status = "degraded"; errorMessage = "Rate limited"; }
              else { status = "down"; errorMessage = `HTTP ${res.status}`; }
              await res.text();
            }
          } else if (source.key === "grants_gov") {
            const res = await fetch(
              "https://api.grants.gov/v1/api/search2?keyword=test&rows=1&sortBy=openDate&sortOrder=desc",
              { signal: AbortSignal.timeout(10000) }
            );
            responseTimeMs = Date.now() - startTime;
            if (res.ok) { lastSuccess = new Date().toISOString(); }
            else { status = "down"; errorMessage = `HTTP ${res.status}`; }
            await res.text();
          } else if (source.key === "california") {
            const apifyToken = Deno.env.get("APIFY_API_TOKEN");
            if (!apifyToken) { status = "down"; errorMessage = "Apify token not configured"; }
            else {
              // Just check Apify actor availability
              const res = await fetch(
                `https://api.apify.com/v2/acts/fortuitous_pirate~caleprocure-scraper?token=${apifyToken}`,
                { signal: AbortSignal.timeout(10000) }
              );
              responseTimeMs = Date.now() - startTime;
              if (res.ok) { lastSuccess = new Date().toISOString(); }
              else if (res.status === 402) { status = "down"; errorMessage = "Apify credits exhausted"; }
              else { status = "degraded"; errorMessage = `HTTP ${res.status}`; }
              await res.text();
            }
          } else if (source.key === "texas") {
            const res = await fetch(
              "https://data.texas.gov/resource/svjm-sdfz.json?$limit=1",
              { signal: AbortSignal.timeout(10000) }
            );
            responseTimeMs = Date.now() - startTime;
            if (res.ok) { lastSuccess = new Date().toISOString(); }
            else { status = "down"; errorMessage = `HTTP ${res.status}`; }
            await res.text();
          } else if (source.key === "new_york") {
            const res = await fetch(
              "https://data.ny.gov/resource/h9e8-fn4e.json?$limit=1",
              { signal: AbortSignal.timeout(10000) }
            );
            responseTimeMs = Date.now() - startTime;
            if (res.ok) { lastSuccess = new Date().toISOString(); }
            else { status = "down"; errorMessage = `HTTP ${res.status}`; }
            await res.text();
          }
        } catch (err) {
          responseTimeMs = Date.now() - startTime;
          status = "down";
          errorMessage = err instanceof Error ? err.message : "Unknown error";
          if (errorMessage.includes("abort") || errorMessage.includes("timeout")) {
            status = "degraded";
            errorMessage = "Timeout (>10s)";
          }
        }

        return {
          key: source.key,
          name: source.name,
          status,
          responseTimeMs,
          errorMessage,
          lastSuccess,
          apiKeyConfigured: apiKeyStatus[source.key],
          expectedTimeoutMs: source.avgTimeoutMs,
        };
      })
    );

    const sources = healthChecks.map((result, i) => {
      if (result.status === "fulfilled") return result.value;
      return {
        key: SOURCES[i].key,
        name: SOURCES[i].name,
        status: "down" as const,
        responseTimeMs: 0,
        errorMessage: "Health check failed",
        lastSuccess: null,
        apiKeyConfigured: apiKeyStatus[SOURCES[i].key],
        expectedTimeoutMs: SOURCES[i].avgTimeoutMs,
      };
    });

    return new Response(
      JSON.stringify({
        sources,
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Source health check error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

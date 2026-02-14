import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_organization_id")
      .eq("profile_id", userId)
      .single();

    if (!profile?.current_organization_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.current_organization_id;

    // Verify org membership
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not an active organization member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription tier (pro or enterprise required)
    const { data: subscription } = await supabase
      .from("organization_subscriptions")
      .select("plan_type")
      .eq("organization_id", orgId)
      .single();

    const planType = subscription?.plan_type?.toLowerCase() || "trial";
    if (!["pro", "enterprise", "white_label"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Pro or Enterprise subscription required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting: 50 searches per org per day
    const today = new Date().toISOString().split("T")[0];
    const { data: usageData } = await supabase
      .from("organization_usage_metrics")
      .select("metric_value")
      .eq("organization_id", orgId)
      .eq("metric_type", "opportunity_searches")
      .eq("metric_date", today)
      .single();

    if (usageData && usageData.metric_value >= 50) {
      return new Response(
        JSON.stringify({ error: "Daily search limit reached (50/day)" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse search params
    const body = await req.json();
    const {
      keyword = "",
      postedFrom,
      postedTo,
      naicsCode,
      setAside,
      ptype,
      limit = 25,
      offset = 0,
    } = body;

    // Validate inputs
    const safeKeyword = String(keyword).slice(0, 200).trim();
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    // Build SAM.gov API URL
    const samApiKey = Deno.env.get("SAM_GOV_API_KEY");
    if (!samApiKey) {
      return new Response(
        JSON.stringify({ error: "SAM.gov API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const params = new URLSearchParams();
    params.set("api_key", samApiKey);
    if (safeKeyword) params.set("keyword", safeKeyword);
    if (postedFrom) params.set("postedFrom", String(postedFrom).slice(0, 10));
    if (postedTo) params.set("postedTo", String(postedTo).slice(0, 10));
    if (naicsCode) params.set("naicsCode", String(naicsCode).slice(0, 10));
    if (setAside) params.set("setAside", String(setAside).slice(0, 50));
    if (ptype) params.set("ptype", String(ptype).slice(0, 5));
    params.set("limit", String(safeLimit));
    params.set("offset", String(safeOffset));

    const samUrl = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
    console.log(`Fetching SAM.gov: keyword="${safeKeyword}", limit=${safeLimit}, offset=${safeOffset}`);

    const samResponse = await fetch(samUrl, {
      headers: { Accept: "application/json" },
    });

    if (!samResponse.ok) {
      const errorText = await samResponse.text();
      console.error(`SAM.gov API error [${samResponse.status}]: ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to search opportunities", details: `SAM.gov returned ${samResponse.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const samData = await samResponse.json();

    // Transform results
    const opportunities = (samData.opportunitiesData || []).map((opp: any) => ({
      external_id: opp.noticeId || opp.opportunityId || "",
      source: "sam_gov",
      title: opp.title || "",
      solicitation_number: opp.solicitationNumber || "",
      department: opp.fullParentPathName || opp.department || "",
      naics_code: opp.naicsCode || "",
      posted_date: opp.postedDate || null,
      response_deadline: opp.responseDeadLine || opp.archiveDate || null,
      set_aside: opp.typeOfSetAside || opp.typeOfSetAsideDescription || "",
      description_url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId || ""}`,
      type: opp.type || opp.baseType || "",
      raw_data: opp,
    }));

    // Record usage
    await supabase.rpc("update_organization_usage_metric", {
      org_id: orgId,
      metric_type_param: "opportunity_searches",
      increment_value: 1,
    });

    return new Response(
      JSON.stringify({
        opportunities,
        totalRecords: samData.totalRecords || opportunities.length,
        limit: safeLimit,
        offset: safeOffset,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in search-opportunities:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

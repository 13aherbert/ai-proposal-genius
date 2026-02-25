import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ───────────────────────────────────────────────────────────
interface NormalizedOpportunity {
  external_id: string;
  source: string;
  title: string;
  solicitation_number: string;
  department: string;
  naics_code: string;
  posted_date: string | null;
  response_deadline: string | null;
  set_aside: string;
  description_url: string;
  type: string;
  raw_data: Record<string, unknown>;
}

interface SearchBody {
  keyword?: string;
  postedFrom?: string;
  postedTo?: string;
  naicsCode?: string;
  setAside?: string;
  ptype?: string;
  source?: string;
  opportunityType?: string;
  agency?: string;
  limit?: number;
  offset?: number;
}

// ─── SAM.gov Provider ────────────────────────────────────────────────
const toSamDate = (dateStr: string): string => {
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return dateStr;
};

async function fetchSamGov(params: SearchBody, samApiKey: string): Promise<NormalizedOpportunity[]> {
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const safeLimit = Math.min(Math.max(Number(params.limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(params.offset) || 0, 0);

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 90);
  const defaultFromStr = `${String(defaultFrom.getMonth() + 1).padStart(2, "0")}/${String(defaultFrom.getDate()).padStart(2, "0")}/${defaultFrom.getFullYear()}`;

  const qp = new URLSearchParams();
  qp.set("api_key", samApiKey);
  if (safeKeyword) qp.set("keyword", safeKeyword);
  qp.set("postedFrom", params.postedFrom ? toSamDate(String(params.postedFrom).slice(0, 10)) : defaultFromStr);
  const defaultTo = new Date();
  const defaultToStr = `${String(defaultTo.getMonth() + 1).padStart(2, "0")}/${String(defaultTo.getDate()).padStart(2, "0")}/${defaultTo.getFullYear()}`;
  qp.set("postedTo", params.postedTo ? toSamDate(String(params.postedTo).slice(0, 10)) : defaultToStr);
  if (params.naicsCode) qp.set("ncode", String(params.naicsCode).slice(0, 10));
  if (params.setAside) qp.set("typeOfSetAside", String(params.setAside).slice(0, 50));
  if (params.ptype) qp.set("ptype", String(params.ptype).slice(0, 5));
  qp.set("limit", String(safeLimit));
  qp.set("offset", String(safeOffset));

  const url = `https://api.sam.gov/prod/opportunities/v2/search?${qp.toString()}`;
  console.log(`[SAM.gov] Fetching: keyword="${safeKeyword}", limit=${safeLimit}, offset=${safeOffset}, ptype=${params.ptype || "any"}`);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[SAM.gov] API error [${res.status}]: ${errText}`);
    return [];
  }

  const data = await res.json();
  return (data.opportunitiesData || []).map((opp: any) => ({
    external_id: opp.noticeId || opp.opportunityId || "",
    source: "sam_gov",
    title: opp.title || "",
    solicitation_number: opp.solicitationNumber || "",
    department: opp.fullParentPathName || opp.department || "",
    naics_code: opp.naicsCode || "",
    posted_date: opp.postedDate || null,
    response_deadline: opp.responseDeadLine || opp.archiveDate || null,
    set_aside: opp.typeOfSetAside || opp.typeOfSetAsideDescription || "",
    description_url: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}` : (opp.solicitationNumber ? `https://sam.gov/search?keywords=${encodeURIComponent(opp.solicitationNumber)}` : "https://sam.gov")),
    type: opp.type || opp.baseType || "contract",
    raw_data: opp,
  }));
}

// ─── Grants.gov Provider ─────────────────────────────────────────────
async function fetchGrantsGov(params: SearchBody): Promise<NormalizedOpportunity[]> {
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const rows = Math.min(Math.max(Number(params.limit) || 25, 1), 100);

  const body: Record<string, unknown> = {
    keyword: safeKeyword || "",
    rows,
    oppStatuses: "forecasted|posted",
    sortBy: "relevance",
  };

  if (params.agency) body.agencies = String(params.agency).slice(0, 100);

  console.log(`[Grants.gov] Fetching: keyword="${safeKeyword}", rows=${rows}`);

  try {
    const res = await fetch("https://api.grants.gov/v1/api/search2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Grants.gov] API error [${res.status}]: ${errText}`);
      return [];
    }

    const json = await res.json();
    const hits = json?.data?.oppHits || [];

    return hits.map((opp: any) => ({
      external_id: String(opp.id || opp.oppNumber || ""),
      source: "grants_gov",
      title: opp.title || "",
      solicitation_number: opp.oppNumber || "",
      department: opp.agencyName || opp.agency || "",
      naics_code: "",
      posted_date: opp.openDate || null,
      response_deadline: opp.closeDate || null,
      set_aside: opp.fundingCategory || "",
      description_url: opp.oppNumber
        ? `https://www.grants.gov/search-results-detail/${opp.oppNumber}`
        : (opp.id ? `https://www.grants.gov/search-results-detail/${opp.id}` : "https://www.grants.gov"),
      type: "grant",
      raw_data: opp,
    }));
  } catch (err) {
    console.error("[Grants.gov] Fetch error:", err);
    return [];
  }
}

// ─── Relevance Scoring ──────────────────────────────────────────────
function scoreRelevance(opp: NormalizedOpportunity, keyword: string): number {
  if (!keyword || !keyword.trim()) return 0;

  const phrase = keyword.toLowerCase().trim();
  const words = phrase.split(/\s+/).filter(Boolean);
  const titleLower = (opp.title || "").toLowerCase();
  const deptLower = (opp.department || "").toLowerCase();

  let score = 0;

  // Exact phrase in title → highest signal
  if (titleLower.includes(phrase)) {
    score += 100;
  }

  // All words present in title
  const allInTitle = words.every(w => titleLower.includes(w));
  if (allInTitle && !titleLower.includes(phrase)) {
    score += 50;
  }

  // Per-word matches in title
  if (!allInTitle) {
    for (const w of words) {
      if (titleLower.includes(w)) score += 10;
    }
  }

  // Department matches
  for (const w of words) {
    if (deptLower.includes(w)) score += 5;
  }

  return score;
}

function rankByRelevance(opps: NormalizedOpportunity[], keyword: string): NormalizedOpportunity[] {
  if (!keyword || !keyword.trim()) return opps;

  return opps
    .map(opp => ({ opp, score: scoreRelevance(opp, keyword) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak by posted date descending
      const dateA = a.opp.posted_date || "";
      const dateB = b.opp.posted_date || "";
      return dateB.localeCompare(dateA);
    })
    .map(({ opp }) => opp);
}

// ─── Deduplication ───────────────────────────────────────────────────
function deduplicateOpportunities(opps: NormalizedOpportunity[]): NormalizedOpportunity[] {
  const seen = new Set<string>();
  return opps.filter((opp) => {
    const key = `${opp.source}:${opp.external_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Main Handler ────────────────────────────────────────────────────
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

    // Check subscription tier
    const { data: subscription } = await supabase
      .from("organization_subscriptions")
      .select("plan_type")
      .eq("organization_id", orgId)
      .single();

    const planType = subscription?.plan_type?.toLowerCase() || "trial";
    if (!["pro", "enterprise", "white_label"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Pro or Enterprise subscription required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse search params
    const body: SearchBody = await req.json();
    const sourceFilter = body.source || "all";
    const opportunityType = body.opportunityType || "";
    const searchKeyword = body.keyword || "";

    // Fetch from providers in parallel
    const samApiKey = Deno.env.get("SAM_GOV_API_KEY");
    const fetchPromises: Promise<NormalizedOpportunity[]>[] = [];

    if (sourceFilter === "all" || sourceFilter === "sam_gov") {
      if (samApiKey) {
        fetchPromises.push(fetchSamGov(body, samApiKey));
      } else {
        console.warn("SAM_GOV_API_KEY not configured, skipping SAM.gov");
      }
    }

    if (sourceFilter === "all" || sourceFilter === "grants_gov") {
      fetchPromises.push(fetchGrantsGov(body));
    }

    const results = await Promise.all(fetchPromises);
    let allOpportunities = deduplicateOpportunities(results.flat());

    // Apply opportunityType filter client-side (for generic types like "contract"/"grant")
    if (opportunityType) {
      allOpportunities = allOpportunities.filter(
        (opp) => opp.type.toLowerCase() === opportunityType.toLowerCase()
      );
    }

    // Apply agency filter client-side for SAM.gov results (Grants.gov handles it in API)
    if (body.agency && sourceFilter !== "grants_gov") {
      const agencyLower = body.agency.toLowerCase();
      allOpportunities = allOpportunities.filter(
        (opp) =>
          opp.source === "grants_gov" ||
          opp.department.toLowerCase().includes(agencyLower)
      );
    }

    // Rank by relevance to keyword
    allOpportunities = rankByRelevance(allOpportunities, searchKeyword);

    // Record usage
    await supabase.rpc("update_organization_usage_metric", {
      org_id: orgId,
      metric_type_param: "opportunity_searches",
      increment_value: 1,
    });

    return new Response(
      JSON.stringify({
        opportunities: allOpportunities,
        totalRecords: allOpportunities.length,
        limit: body.limit || 25,
        offset: body.offset || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-opportunities:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

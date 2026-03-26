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
  resource_links: string[];
  description_text_url: string | null;
}

interface ProviderStatus {
  provider: string;
  status: "success" | "timeout" | "api_error" | "no_results" | "skipped";
  count: number;
  message?: string;
  responseTimeMs?: number;
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

// ─── Timeout Utility ─────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Helper: detect if search uses only SAM-specific filters ─────────
function isSamOnlySearch(params: SearchBody): boolean {
  const hasSamFilters = !!(params.naicsCode || params.setAside || params.ptype);
  const hasKeyword = !!(params.keyword && params.keyword.trim());
  // If user has SAM-specific filters and no keyword, default to SAM-only
  return hasSamFilters && !hasKeyword;
}

// ─── SAM.gov Provider ────────────────────────────────────────────────
const toSamDate = (dateStr: string): string => {
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return dateStr;
};

async function fetchSamGov(params: SearchBody, samApiKey: string): Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus }> {
  const startTime = Date.now();
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const safeLimit = Math.min(Math.max(Number(params.limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(params.offset) || 0, 0);

  // Widen default date window: 365 days for NAICS/filter-only, 90 days for keyword searches
  const hasKeyword = safeKeyword.length > 0;
  const defaultDaysBack = hasKeyword ? 90 : 365;
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - defaultDaysBack);
  const defaultFromStr = `${String(defaultFrom.getMonth() + 1).padStart(2, "0")}/${String(defaultFrom.getDate()).padStart(2, "0")}/${defaultFrom.getFullYear()}`;

  const qp = new URLSearchParams();
  qp.set("api_key", samApiKey);
  
  if (safeKeyword) qp.set("keyword", safeKeyword);
  
  // Date range
  qp.set("postedFrom", params.postedFrom ? toSamDate(String(params.postedFrom).slice(0, 10)) : defaultFromStr);
  const defaultTo = new Date();
  const defaultToStr = `${String(defaultTo.getMonth() + 1).padStart(2, "0")}/${String(defaultTo.getDate()).padStart(2, "0")}/${defaultTo.getFullYear()}`;
  qp.set("postedTo", params.postedTo ? toSamDate(String(params.postedTo).slice(0, 10)) : defaultToStr);
  
  if (params.naicsCode) qp.set("ncode", String(params.naicsCode).replace(/[^0-9]/g, "").slice(0, 6));
  if (params.setAside) qp.set("typeOfSetAside", String(params.setAside).slice(0, 50));
  if (params.ptype) qp.set("ptype", String(params.ptype).slice(0, 5));
  if (params.agency) qp.set("deptname", String(params.agency).slice(0, 100));
  
  qp.set("limit", String(safeLimit));
  qp.set("offset", String(safeOffset));

  // Log request shape (without API key)
  const logParams = new URLSearchParams(qp);
  logParams.delete("api_key");
  console.log(`[SAM.gov] Request: ${logParams.toString()}`);

  try {
    const res = await fetchWithTimeout(
      `https://api.sam.gov/opportunities/v2/search?${qp.toString()}`,
      { headers: { Accept: "application/json" } },
      20000
    );
    
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SAM.gov] HTTP ${res.status} in ${elapsed}ms: ${errText.slice(0, 500)}`);
      return {
        opportunities: [],
        status: { provider: "SAM.gov", status: "api_error", count: 0, message: `HTTP ${res.status}`, responseTimeMs: elapsed },
      };
    }

    const data = await res.json();
    const rawOpps = data.opportunitiesData || [];
    const totalRecords = data.totalRecords || rawOpps.length;
    console.log(`[SAM.gov] Got ${rawOpps.length} results (totalRecords: ${totalRecords}) in ${elapsed}ms`);

    const opportunities: NormalizedOpportunity[] = rawOpps.map((opp: any) => ({
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
      resource_links: Array.isArray(opp.resourceLinks) ? opp.resourceLinks.map((rl: any) => typeof rl === "string" ? rl : rl?.url || "").filter(Boolean) : [],
      description_text_url: opp.description || (opp.noticeId ? `https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid=${opp.noticeId}` : null),
    }));

    return {
      opportunities,
      status: {
        provider: "SAM.gov",
        status: opportunities.length > 0 ? "success" : "no_results",
        count: opportunities.length,
        responseTimeMs: elapsed,
      },
    };
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[SAM.gov] Request timed out after ${elapsed}ms`);
      return { opportunities: [], status: { provider: "SAM.gov", status: "timeout", count: 0, message: "Request timed out", responseTimeMs: elapsed } };
    }
    console.error(`[SAM.gov] Fetch error after ${elapsed}ms:`, err);
    return { opportunities: [], status: { provider: "SAM.gov", status: "api_error", count: 0, message: String(err), responseTimeMs: elapsed } };
  }
}

// ─── Grants.gov Provider ─────────────────────────────────────────────
async function fetchGrantsGov(params: SearchBody): Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus }> {
  const startTime = Date.now();
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const rows = Math.min(Math.max(Number(params.limit) || 25, 1), 100);

  const body: Record<string, unknown> = {
    keyword: safeKeyword || "",
    rows,
    oppStatuses: "forecasted|posted",
    sortBy: "relevance",
  };

  if (params.agency) body.agencies = String(params.agency).slice(0, 100);

  console.log(`[Grants.gov] Request: keyword="${safeKeyword}", rows=${rows}, agency="${params.agency || ""}"`);

  try {
    const res = await fetchWithTimeout("https://api.grants.gov/v1/api/search2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 15000);

    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Grants.gov] HTTP ${res.status} in ${elapsed}ms: ${errText.slice(0, 500)}`);
      return {
        opportunities: [],
        status: { provider: "Grants.gov", status: "api_error", count: 0, message: `HTTP ${res.status}`, responseTimeMs: elapsed },
      };
    }

    const json = await res.json();
    const hits = json?.data?.oppHits || [];
    console.log(`[Grants.gov] Got ${hits.length} results in ${elapsed}ms`);

    const opportunities: NormalizedOpportunity[] = hits.map((opp: any) => ({
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
      resource_links: [],
      description_text_url: null,
    }));

    return {
      opportunities,
      status: {
        provider: "Grants.gov",
        status: opportunities.length > 0 ? "success" : "no_results",
        count: opportunities.length,
        responseTimeMs: elapsed,
      },
    };
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[Grants.gov] Request timed out after ${elapsed}ms`);
      return { opportunities: [], status: { provider: "Grants.gov", status: "timeout", count: 0, message: "Request timed out", responseTimeMs: elapsed } };
    }
    console.error(`[Grants.gov] Fetch error after ${elapsed}ms:`, err);
    return { opportunities: [], status: { provider: "Grants.gov", status: "api_error", count: 0, message: String(err), responseTimeMs: elapsed } };
  }
}

// ─── Relevance Scoring ──────────────────────────────────────────────
function scoreRelevance(opp: NormalizedOpportunity, keyword: string): number {
  if (!keyword || !keyword.trim()) return 1;

  const phrase = keyword.toLowerCase().trim();
  const words = phrase.split(/\s+/).filter(Boolean);
  const titleLower = (opp.title || "").toLowerCase();
  const deptLower = (opp.department || "").toLowerCase();
  const solNumLower = (opp.solicitation_number || "").toLowerCase();
  const descLower = (typeof (opp.raw_data as any)?.description === "string" ? (opp.raw_data as any).description : "").toLowerCase();

  let score = 0;
  if (titleLower.includes(phrase)) score += 100;
  const allInTitle = words.every(w => titleLower.includes(w));
  if (allInTitle && !titleLower.includes(phrase)) score += 50;
  if (!allInTitle) {
    for (const w of words) {
      if (titleLower.includes(w)) score += 10;
    }
  }
  for (const w of words) {
    if (deptLower.includes(w)) score += 5;
  }
  for (const w of words) {
    if (solNumLower.includes(w)) score += 15;
  }
  if (descLower) {
    for (const w of words) {
      if (descLower.includes(w)) score += 3;
    }
  }
  return score;
}

function rankByRelevance(opps: NormalizedOpportunity[], keyword: string): NormalizedOpportunity[] {
  if (!keyword || !keyword.trim()) return opps;
  return opps
    .map(opp => ({ opp, score: scoreRelevance(opp, keyword) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

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
    if (!["growth", "business", "enterprise", "white_label", "pro"].includes(planType)) {
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

    // Auto-detect optimal source: skip Grants.gov for SAM-specific filter searches
    const effectiveSource = (sourceFilter === "all" && isSamOnlySearch(body)) ? "sam_gov" : sourceFilter;

    console.log(`[Search] Params: source=${sourceFilter} (effective=${effectiveSource}), keyword="${searchKeyword}", naics=${body.naicsCode || ""}, agency="${body.agency || ""}", setAside=${body.setAside || ""}, ptype=${body.ptype || ""}, type=${opportunityType}`);

    // Fetch from providers in parallel
    const samApiKey = Deno.env.get("SAM_GOV_API_KEY");
    const providerStatuses: ProviderStatus[] = [];
    const fetchPromises: Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus }>[] = [];

    if (effectiveSource === "all" || effectiveSource === "sam_gov") {
      if (samApiKey) {
        fetchPromises.push(fetchSamGov(body, samApiKey));
      } else {
        console.warn("SAM_GOV_API_KEY not configured, skipping SAM.gov");
        providerStatuses.push({ provider: "SAM.gov", status: "skipped", count: 0, message: "API key not configured" });
      }
    }

    if (effectiveSource === "all" || effectiveSource === "grants_gov") {
      fetchPromises.push(fetchGrantsGov(body));
    } else if (sourceFilter === "all" && effectiveSource === "sam_gov") {
      // Note: Grants.gov was auto-skipped for SAM-specific search
      providerStatuses.push({ provider: "Grants.gov", status: "skipped", count: 0, message: "Skipped for NAICS/set-aside search" });
    }

    const results = await Promise.all(fetchPromises);
    
    const allProviderOpps: NormalizedOpportunity[] = [];
    for (const result of results) {
      providerStatuses.push(result.status);
      allProviderOpps.push(...result.opportunities);
    }

    let allOpportunities = deduplicateOpportunities(allProviderOpps);

    if (opportunityType) {
      allOpportunities = allOpportunities.filter(
        (opp) => opp.type.toLowerCase() === opportunityType.toLowerCase()
      );
    }

    allOpportunities = rankByRelevance(allOpportunities, searchKeyword);

    console.log(`[Search] Final results: ${allOpportunities.length} after dedup/filter/rank. Provider statuses: ${JSON.stringify(providerStatuses.map(s => ({ p: s.provider, s: s.status, c: s.count, ms: s.responseTimeMs })))}`);

    // Record usage (single source of truth for usage tracking)
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
        providerStatuses,
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

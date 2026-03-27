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
  status: "success" | "timeout" | "api_error" | "no_results" | "skipped" | "invalid_api_key" | "billing_error";
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
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 25000): Promise<Response> {
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
  return hasSamFilters && !hasKeyword;
}

// ─── SAM.gov Provider ────────────────────────────────────────────────
const SAM_BASE_URL = "https://api.sam.gov/opportunities/v2/search";

const toSamDate = (dateStr: string): string => {
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return dateStr;
};

const formatDateMMDDYYYY = (d: Date): string => {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

async function fetchSamGov(params: SearchBody, samApiKey: string, daysBack = 90): Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus; totalRecords: number }> {
  const startTime = Date.now();
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const safeLimit = Math.min(Math.max(Number(params.limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(params.offset) || 0, 0);

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - daysBack);

  const qp = new URLSearchParams();
  qp.set("api_key", samApiKey);
  
  if (safeKeyword) qp.set("keyword", safeKeyword);
  
  qp.set("postedFrom", params.postedFrom ? toSamDate(String(params.postedFrom).slice(0, 10)) : formatDateMMDDYYYY(defaultFrom));
  qp.set("postedTo", params.postedTo ? toSamDate(String(params.postedTo).slice(0, 10)) : formatDateMMDDYYYY(new Date()));
  
  if (params.naicsCode) qp.set("ncode", String(params.naicsCode).replace(/[^0-9]/g, "").slice(0, 6));
  if (params.setAside) qp.set("typeOfSetAside", String(params.setAside).slice(0, 50));
  if (params.ptype) qp.set("ptype", String(params.ptype).slice(0, 5));
  if (params.agency) qp.set("deptname", String(params.agency).slice(0, 100));
  
  qp.set("limit", String(safeLimit));
  qp.set("offset", String(safeOffset));

  // Log request shape (without API key)
  const logParams = new URLSearchParams(qp);
  logParams.delete("api_key");
  console.log(`[SAM.gov] Endpoint: ${SAM_BASE_URL}`);
  console.log(`[SAM.gov] Params: ${logParams.toString()}`);
  console.log(`[SAM.gov] API key present: ${samApiKey.length > 0}, length: ${samApiKey.length}`);

  const requestUrl = `${SAM_BASE_URL}?${qp.toString()}`;

  try {
    const res = await fetchWithTimeout(requestUrl, { headers: { Accept: "application/json" } }, 15000);
    
    const elapsed = Date.now() - startTime;
    console.log(`[SAM.gov] HTTP ${res.status} in ${elapsed}ms`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SAM.gov] Error body: ${errText.slice(0, 500)}`);
      
      // Detect specific error types
      const isAuthError = res.status === 401 || res.status === 403 || errText.toLowerCase().includes("api key");
      const statusType = isAuthError ? "invalid_api_key" as const : "api_error" as const;
      
      return {
        opportunities: [],
        totalRecords: 0,
        status: { 
          provider: "SAM.gov", 
          status: statusType, 
          count: 0, 
          message: isAuthError ? "API key rejected" : `HTTP ${res.status}`, 
          responseTimeMs: elapsed 
        },
      };
    }

    const data = await res.json();
    const rawOpps = data.opportunitiesData || [];
    const totalRecords = data.totalRecords || rawOpps.length;
    console.log(`[SAM.gov] Results: ${rawOpps.length}, totalRecords: ${totalRecords}, elapsed: ${elapsed}ms`);

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
      description_text_url: opp.description || (opp.noticeId ? `https://api.sam.gov/opportunities/v1/noticedesc?noticeid=${opp.noticeId}` : null),
    }));

    return {
      opportunities,
      totalRecords,
      status: {
        provider: "SAM.gov",
        status: opportunities.length > 0 ? "success" : "no_results",
        count: opportunities.length,
        message: `${totalRecords} total records (${daysBack}-day window)`,
        responseTimeMs: elapsed,
      },
    };
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[SAM.gov] Request timed out after ${elapsed}ms`);
      return { opportunities: [], totalRecords: 0, status: { provider: "SAM.gov", status: "timeout", count: 0, message: "Request timed out", responseTimeMs: elapsed } };
    }
    console.error(`[SAM.gov] Fetch error after ${elapsed}ms:`, err);
    return { opportunities: [], totalRecords: 0, status: { provider: "SAM.gov", status: "api_error", count: 0, message: String(err), responseTimeMs: elapsed } };
  }
}

// ─── Grants.gov Provider ─────────────────────────────────────────────
async function fetchGrantsGov(params: SearchBody): Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus; totalRecords: number }> {
  const startTime = Date.now();
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const rows = Math.min(Math.max(Number(params.limit) || 25, 1), 100);

  const body: Record<string, unknown> = {
    rows,
    oppStatuses: "forecasted|posted",
  };

  // Only include keyword if non-empty; Grants.gov treats "*" as literal and returns 0
  if (safeKeyword) {
    body.keyword = safeKeyword;
    body.sortBy = "relevance";
  } else {
    body.sortBy = "openDate|desc";
  }

  if (params.agency) body.agencies = String(params.agency).slice(0, 100);

  console.log(`[Grants.gov] Request: keyword="${safeKeyword || "(browse all)"}", rows=${rows}, agency="${params.agency || ""}"`);

  try {
    const res = await fetchWithTimeout("https://api.grants.gov/v1/api/search2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 15000);

    const elapsed = Date.now() - startTime;
    console.log(`[Grants.gov] HTTP ${res.status} in ${elapsed}ms`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Grants.gov] Error body: ${errText.slice(0, 500)}`);
      return {
        opportunities: [],
        status: { provider: "Grants.gov", status: "api_error", count: 0, message: `HTTP ${res.status}`, responseTimeMs: elapsed },
      };
    }

    const json = await res.json();
    const hits = json?.data?.oppHits || [];
    const grantsTotal = json?.data?.hitCount || json?.data?.totalCount || json?.data?.numberOfRecords || hits.length;
    console.log(`[Grants.gov] Results: ${hits.length}, total: ${grantsTotal} in ${elapsed}ms`);

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
      totalRecords: grantsTotal,
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
      return { opportunities: [], totalRecords: 0, status: { provider: "Grants.gov", status: "timeout", count: 0, message: "Request timed out", responseTimeMs: elapsed } };
    }
    console.error(`[Grants.gov] Fetch error after ${elapsed}ms:`, err);
    return { opportunities: [], totalRecords: 0, status: { provider: "Grants.gov", status: "api_error", count: 0, message: String(err), responseTimeMs: elapsed } };
  }
}

// ─── California eProcure via Apify Scraper ──────────────────────────
async function fetchCalifornia(params: SearchBody, apifyToken: string): Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus; totalRecords: number }> {
  const startTime = Date.now();
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  // When keyword is provided, fetch more results to have a larger pool for local filtering
  const rows = safeKeyword ? 100 : Math.min(Math.max(Number(params.limit) || 25, 1), 100);

  // Build Apify actor input — do NOT pass keyword (scraper's keyword param is unreliable)
  const actorInput: Record<string, unknown> = {
    dataType: "bids",
    status: "Open",
    limit: rows,
  };
  if (params.agency) actorInput.departments = [String(params.agency).slice(0, 100)];

  // Map set-aside to certificationTypes
  if (params.setAside) {
    const setAsideMap: Record<string, string> = {
      "SBA": "Small Business",
      "SBP": "Small Business",
      "SDVOSBC": "DVBE",
      "WOSB": "Small Business",
    };
    const certType = setAsideMap[params.setAside];
    if (certType) actorInput.certificationTypes = [certType];
  }
  
  // Convert date filters to mm/dd/yyyy format expected by the scraper
  if (params.postedFrom) {
    const parts = String(params.postedFrom).slice(0, 10).split("-");
    if (parts.length === 3) actorInput.startDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  if (params.postedTo) {
    const parts = String(params.postedTo).slice(0, 10).split("-");
    if (parts.length === 3) actorInput.endDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
  }

  const apifyUrl = `https://api.apify.com/v2/acts/fortuitous_pirate~caleprocure-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
  console.log(`[California] Apify request: keyword="${safeKeyword || "(browse all)"}", limit=${rows}, input=`, JSON.stringify(actorInput));

  try {
    const res = await fetchWithTimeout(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput),
    }, 45000);

    const elapsed = Date.now() - startTime;
    console.log(`[California] Apify HTTP ${res.status} in ${elapsed}ms`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[California] Apify error: ${errText.slice(0, 500)}`);
      const isAuthError = res.status === 401 || res.status === 403;
      const isBillingError = res.status === 402;
      const statusType = isBillingError ? "billing_error" as const : isAuthError ? "invalid_api_key" as const : "api_error" as const;
      const message = isBillingError ? "Scraper quota exceeded — upgrade Apify plan" : isAuthError ? "Apify token rejected" : `HTTP ${res.status}`;
      return {
        opportunities: [],
        totalRecords: 0,
        status: {
          provider: "California eProcure",
          status: statusType,
          count: 0,
          message,
          responseTimeMs: elapsed,
        },
      };
    }

    const items: any[] = await res.json();
    console.log(`[California] Apify returned ${items.length} raw items in ${elapsed}ms`);

    let opportunities: NormalizedOpportunity[] = items.map((opp: any) => ({
      external_id: String(opp.eventId || opp.solicitationNumber || opp.id || ""),
      source: "california_eprocure",
      title: opp.eventName || opp.title || "",
      solicitation_number: String(opp.eventId || opp.solicitationNumber || ""),
      department: opp.department || opp.agency || "",
      naics_code: opp.naicsCode || "",
      posted_date: opp.startDate || opp.publishDate || null,
      response_deadline: opp.endDate || opp.closeDate || null,
      set_aside: opp.type || opp.setAside || "",
      description_url: opp.url || (opp.eventId ? `https://caleprocure.ca.gov/event/${opp.eventId}/0` : "https://caleprocure.ca.gov"),
      type: opp.type || "contract",
      raw_data: opp,
      resource_links: [],
      description_text_url: null,
    }));

    // Apply local keyword filtering since the scraper's native keyword param is unreliable
    if (safeKeyword) {
      const keywords = safeKeyword.toLowerCase().split(/\s+/).filter(Boolean);
      const rawCount = opportunities.length;
      opportunities = opportunities.filter(opp => {
        const searchText = [
          opp.title, opp.department, opp.solicitation_number,
          ...extractStringValues(opp.raw_data),
        ].join(" ").toLowerCase();
        return keywords.some(w => searchText.includes(w));
      });
      console.log(`[California] Local keyword filter: ${rawCount} → ${opportunities.length} (keyword="${safeKeyword}")`);
    }

    return {
      opportunities,
      totalRecords: opportunities.length,
      status: {
        provider: "California eProcure",
        status: opportunities.length > 0 ? "success" : "no_results",
        count: opportunities.length,
        message: `${items.length} scraped, ${opportunities.length} matched${safeKeyword ? ` for "${safeKeyword}"` : ""}`,
        responseTimeMs: elapsed,
      },
    };
  } catch (err: unknown) {
    const elapsed = Date.now() - startTime;
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[California] Apify request timed out after ${elapsed}ms`);
      return { opportunities: [], totalRecords: 0, status: { provider: "California eProcure", status: "timeout", count: 0, message: "Apify actor timed out", responseTimeMs: elapsed } };
    }
    console.error(`[California] Apify fetch error after ${elapsed}ms:`, err);
    return { opportunities: [], totalRecords: 0, status: { provider: "California eProcure", status: "api_error", count: 0, message: String(err), responseTimeMs: elapsed } };
  }
}

// ─── Texas SmartBuy via Socrata Open Data (free, no API key needed) ──
const TX_SOCRATA_DATASETS = [
  { id: "vipt-h4ye", name: "DIR Active Contracts", base: "https://data.texas.gov" },
  { id: "svjm-sdfz", name: "TCEQ Contracts", base: "https://data.texas.gov" },
];

async function fetchTexas(params: SearchBody): Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus; totalRecords: number }> {
  const startTime = Date.now();
  const safeKeyword = String(params.keyword || "").slice(0, 200).trim();
  const limit = Math.min(Math.max(Number(params.limit) || 25, 1), 100);

  const allItems: any[] = [];
  const errors: string[] = [];

  // Query each Socrata dataset in parallel
  const datasetPromises = TX_SOCRATA_DATASETS.map(async (ds) => {
    try {
      // Build SoQL query
      const qp = new URLSearchParams();
      qp.set("$limit", String(limit));
      qp.set("$order", ":updated_at DESC");

      // Keyword search using Socrata full-text search ($q parameter)
      if (safeKeyword) {
        qp.set("$q", safeKeyword);
      }

      const url = `${ds.base}/resource/${ds.id}.json?${qp.toString()}`;
      console.log(`[Texas/${ds.name}] Fetching: ${url}`);

      const res = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
      }, 15000);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Texas/${ds.name}] HTTP ${res.status}: ${errText.slice(0, 200)}`);
        errors.push(`${ds.name}: HTTP ${res.status}`);
        return [];
      }

      const items = await res.json();
      console.log(`[Texas/${ds.name}] Returned ${items.length} items`);
      // Tag each item with its dataset source
      return items.map((item: any) => ({ ...item, _tx_dataset: ds.name }));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.warn(`[Texas/${ds.name}] Timed out`);
        errors.push(`${ds.name}: timeout`);
      } else {
        console.error(`[Texas/${ds.name}] Error:`, err);
        errors.push(`${ds.name}: ${String(err)}`);
      }
      return [];
    }
  });

  const datasetResults = await Promise.all(datasetPromises);
  for (const items of datasetResults) {
    allItems.push(...items);
  }

  const elapsed = Date.now() - startTime;
  console.log(`[Texas] Socrata total: ${allItems.length} items from ${TX_SOCRATA_DATASETS.length} datasets in ${elapsed}ms`);

  let opportunities: NormalizedOpportunity[] = allItems.map((opp: any) => ({
    external_id: String(opp.po_contract_number || opp.contract_number || opp.id || Math.random().toString(36).slice(2)),
    source: "texas_smartbuy",
    title: opp.description || opp.vendor_name || opp.contract_description || opp.project_description || "",
    solicitation_number: String(opp.po_contract_number || opp.contract_number || ""),
    department: opp.agency_name || opp.agency || opp._tx_dataset || "",
    naics_code: opp.nigp_code || opp.commodity_code || opp.pcc || "",
    posted_date: opp.start_date || opp.effective_date || opp.award_date || null,
    response_deadline: opp.end_date || opp.expiration_date || null,
    set_aside: opp.hub_status || opp.set_aside || "",
    description_url: opp.url || "https://www.txsmartbuy.com/esbd",
    type: opp.contract_type || opp.type || "contract",
    raw_data: opp,
    resource_links: [],
    description_text_url: null,
  }));

  // Apply local keyword filtering as safety net (Socrata $q is fuzzy)
  if (safeKeyword) {
    const keywords = safeKeyword.toLowerCase().split(/\s+/).filter(Boolean);
    const rawCount = opportunities.length;
    opportunities = opportunities.filter(opp => {
      const searchText = [
        opp.title, opp.department, opp.solicitation_number,
        ...extractStringValues(opp.raw_data),
      ].join(" ").toLowerCase();
      return keywords.some(w => searchText.includes(w));
    });
    console.log(`[Texas] Local keyword filter: ${rawCount} → ${opportunities.length} (keyword="${safeKeyword}")`);
  }

  // Determine status
  const allFailed = errors.length === TX_SOCRATA_DATASETS.length;
  const status: ProviderStatus = {
    provider: "Texas SmartBuy",
    status: allFailed ? "api_error" : opportunities.length > 0 ? "success" : "no_results",
    count: opportunities.length,
    message: allFailed ? errors.join("; ") : `${allItems.length} fetched, ${opportunities.length} matched${safeKeyword ? ` for "${safeKeyword}"` : ""}`,
    responseTimeMs: elapsed,
  };

  return { opportunities, totalRecords: opportunities.length, status };
}

// ─── Helper: extract all string values from a nested object ─────────
function extractStringValues(obj: unknown): string[] {
  const strings: string[] = [];
  if (obj && typeof obj === "object") {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      if (typeof val === "string") strings.push(val);
      else if (val && typeof val === "object") strings.push(...extractStringValues(val));
    }
  }
  return strings;
}

// ─── Relevance Scoring ──────────────────────────────────────────────
function scoreRelevance(opp: NormalizedOpportunity, keyword: string): number {
  if (!keyword || !keyword.trim()) return 1;

  const phrase = keyword.toLowerCase().trim();
  const words = phrase.split(/\s+/).filter(Boolean);
  const titleLower = (opp.title || "").toLowerCase();
  const deptLower = (opp.department || "").toLowerCase();
  const solNumLower = (opp.solicitation_number || "").toLowerCase();
  // Gather all useful text from raw_data for broader matching
  const rawDataStr = Object.values(opp.raw_data || {})
    .filter(v => typeof v === "string")
    .join(" ")
    .toLowerCase();
  const descLower = rawDataStr;

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

  const scored = opps.map(opp => ({ opp, score: scoreRelevance(opp, keyword) }));

  // When a keyword is active, filter out zero-relevance results.
  // SAM.gov does server-side matching but can still return loosely related items;
  // Grants.gov and California results need strict local gating.
  const filtered = scored.filter(({ score }) => score > 0);

  console.log(`[Relevance] keyword="${keyword}": ${opps.length} in → ${filtered.length} after relevance gate (removed ${opps.length - filtered.length} zero-score)`);

  return filtered
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

  console.log("[search-opportunities] Request received");

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[search-opportunities] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fnStart = Date.now();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    // Use service role client + explicit token validation (reliable in edge functions)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log("[search-opportunities] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    const authMs = Date.now() - fnStart;
    console.log(`[search-opportunities] Auth OK: ${userId.slice(0, 8)}... (${authMs}ms)`);

    // Get user's organization + membership + subscription in parallel
    const orgCheckStart = Date.now();
    const [profileRes, membershipRes, subscriptionRes] = await Promise.all([
      supabase.from("profiles").select("current_organization_id").eq("profile_id", userId).single(),
      // We'll need orgId for membership, but we can fetch all memberships for this user
      supabase.from("organization_members").select("id, organization_id").eq("user_id", userId).eq("status", "active"),
      // We'll check subscription after we know the org
      Promise.resolve(null),
    ]);

    if (!profileRes.data?.current_organization_id) {
      console.log("[search-opportunities] No organization found for user");
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profileRes.data.current_organization_id;

    // Verify membership from already-fetched data
    const isMember = membershipRes.data?.some((m: any) => m.organization_id === orgId);
    if (!isMember) {
      console.log("[search-opportunities] Not an active org member");
      return new Response(JSON.stringify({ error: "Not an active organization member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now fetch subscription + usage in parallel
    const today = new Date().toISOString().split("T")[0];
    const [subRes, usageRes] = await Promise.all([
      supabase.from("organization_subscriptions").select("plan_type").eq("organization_id", orgId).single(),
      supabase.from("organization_usage_metrics").select("metric_value").eq("organization_id", orgId).eq("metric_type", "opportunity_searches").eq("metric_date", today).single(),
    ]);

    const planType = subRes.data?.plan_type?.toLowerCase() || "trial";
    const orgCheckMs = Date.now() - orgCheckStart;
    console.log(`[search-opportunities] Org checks: plan=${planType}, orgId=${orgId.slice(0,8)}... (${orgCheckMs}ms)`);
    
    if (!["growth", "business", "enterprise", "white_label", "pro", "starter", "trial"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Subscription required for opportunity search" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usageData = usageRes.data;

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

    console.log(`[Search] source=${sourceFilter} (effective=${effectiveSource}), keyword="${searchKeyword}", naics=${body.naicsCode || ""}, agency="${body.agency || ""}", setAside=${body.setAside || ""}, ptype=${body.ptype || ""}, type=${opportunityType}`);

    // Fetch from providers in parallel
    const rawSamKey = Deno.env.get("SAM_GOV_API_KEY") || "";
    const samApiKey = rawSamKey.trim(); // Trim whitespace that could break auth
    const providerStatuses: ProviderStatus[] = [];
    const fetchPromises: Promise<{ opportunities: NormalizedOpportunity[]; status: ProviderStatus }>[] = [];

    console.log(`[Search] SAM key configured: ${samApiKey.length > 0}, length: ${samApiKey.length}`);

    if (effectiveSource === "all" || effectiveSource === "sam_gov") {
      if (samApiKey) {
        // SAM.gov rejects date ranges > ~90 days; use 90 for all searches
        const daysBack = 90;
        fetchPromises.push(fetchSamGov(body, samApiKey, daysBack));
      } else {
        console.warn("[Search] SAM_GOV_API_KEY not configured or empty, skipping SAM.gov");
        providerStatuses.push({ provider: "SAM.gov", status: "skipped", count: 0, message: "API key not configured" });
      }
    }

    if (effectiveSource === "all" || effectiveSource === "grants_gov") {
      fetchPromises.push(fetchGrantsGov(body));
    } else if (sourceFilter === "all" && effectiveSource === "sam_gov") {
      providerStatuses.push({ provider: "Grants.gov", status: "skipped", count: 0, message: "Skipped for NAICS/set-aside search" });
    }

    // Apify-based providers (California eProcure + Texas SmartBuy)
    const apifyToken = (Deno.env.get("APIFY_API_TOKEN") || "").trim();
    console.log(`[Search] Apify token configured: ${apifyToken.length > 0}`);

    if (effectiveSource === "all" || effectiveSource === "california_eprocure") {
      if (apifyToken) {
        fetchPromises.push(fetchCalifornia(body, apifyToken));
      } else {
        console.warn("[Search] APIFY_API_TOKEN not configured, skipping California eProcure");
        providerStatuses.push({ provider: "California eProcure", status: "skipped", count: 0, message: "Apify token not configured" });
      }
    }

    if (effectiveSource === "all" || effectiveSource === "texas_smartbuy") {
      if (apifyToken) {
        fetchPromises.push(fetchTexas(body, apifyToken));
      } else {
        console.warn("[Search] APIFY_API_TOKEN not configured, skipping Texas SmartBuy");
        providerStatuses.push({ provider: "Texas SmartBuy", status: "skipped", count: 0, message: "Apify token not configured" });
      }
    }

    const results = await Promise.all(fetchPromises);
    
    const allProviderOpps: NormalizedOpportunity[] = [];
    let combinedTotalRecords = 0;
    for (const result of results) {
      providerStatuses.push(result.status);
      allProviderOpps.push(...result.opportunities);
      combinedTotalRecords += result.totalRecords || 0;
    }

    let allOpportunities = deduplicateOpportunities(allProviderOpps);

    if (opportunityType) {
      allOpportunities = allOpportunities.filter(
        (opp) => opp.type.toLowerCase() === opportunityType.toLowerCase()
      );
    }

    allOpportunities = rankByRelevance(allOpportunities, searchKeyword);

    // If NAICS-only search returned 0 from SAM, retry with prior 90-day segment
    const samStatus = providerStatuses.find(s => s.provider === "SAM.gov");
    if (
      allOpportunities.length === 0 &&
      samApiKey &&
      isSamOnlySearch(body) &&
      samStatus &&
      samStatus.status === "no_results"
    ) {
      console.log("[Search] NAICS-only returned 0, retrying SAM with prior 90-day segment (days 91-180)");
      // Search the prior 90-day window (91 to 180 days ago)
      const retryBody = { ...body };
      const segEnd = new Date();
      segEnd.setDate(segEnd.getDate() - 91);
      const segStart = new Date();
      segStart.setDate(segStart.getDate() - 180);
      retryBody.postedFrom = `${segStart.getFullYear()}-${String(segStart.getMonth()+1).padStart(2,"0")}-${String(segStart.getDate()).padStart(2,"0")}`;
      retryBody.postedTo = `${segEnd.getFullYear()}-${String(segEnd.getMonth()+1).padStart(2,"0")}-${String(segEnd.getDate()).padStart(2,"0")}`;
      const retryResult = await fetchSamGov(retryBody, samApiKey, 90);
      const samIdx = providerStatuses.findIndex(s => s.provider === "SAM.gov");
      if (samIdx >= 0) {
        providerStatuses[samIdx] = { ...retryResult.status, message: `Retry (91-180 days ago): ${retryResult.status.message || ""}` };
      }
      if (retryResult.opportunities.length > 0) {
        allOpportunities = deduplicateOpportunities(retryResult.opportunities);
        combinedTotalRecords = retryResult.totalRecords || retryResult.opportunities.length;
        if (opportunityType) {
          allOpportunities = allOpportunities.filter(
            (opp) => opp.type.toLowerCase() === opportunityType.toLowerCase()
          );
        }
      }
    }

    const totalMs = Date.now() - fnStart;
    console.log(`[Search] Final: ${allOpportunities.length} results in ${totalMs}ms. Providers: ${JSON.stringify(providerStatuses.map(s => ({ p: s.provider, s: s.status, c: s.count, ms: s.responseTimeMs, m: s.message })))}`);

    // Record usage (fire and forget)
    supabase.rpc("update_organization_usage_metric", {
      org_id: orgId,
      metric_type_param: "opportunity_searches",
      increment_value: 1,
    }).then(() => {}).catch(() => {});

    return new Response(
      JSON.stringify({
        opportunities: allOpportunities,
        totalRecords: combinedTotalRecords || allOpportunities.length,
        limit: body.limit || 25,
        offset: body.offset || 0,
        providerStatuses,
        diagnostics: { authMs, orgCheckMs, totalMs },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[search-opportunities] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

## v2 Free Tools — Plan

Picked by Semrush keyword opportunity vs. effort. All three slot into the existing `/tools` framework (`ToolPageLayout`, `tools-registry.ts`, lazy routes, sitemap).

### 1. NAICS Code Lookup — `/tools/naics-code-lookup`
**Why:** 33,100 searches/mo. KDI 65 is tough, but our domain (federal contracting) is highly relevant — Google rewards topical authority. Ranking even page 2 here is a big win.

- Static dataset: 2022 NAICS codes (~1,000 entries) bundled as `src/data/naics-2022.json` (sourced from census.gov, public domain).
- UI: search box (code or keyword), filtered list, click → detail card with code, title, description, parent sector, related codes.
- Bonus: small "NIGP equivalent" callout (480/mo, KDI 19) linking out — captures that secondary keyword without a second page.
- Conversion CTA: "Find federal opportunities for NAICS XXXXX in OptiRFP".

### 2. PSC Code Lookup — `/tools/psc-code-lookup`
**Why:** 480/mo, KDI 29. Easy ranking win. Same audience as NAICS — cross-link both pages so one ranks the other.

- Static dataset: GSA Product Service Codes (~5,000 entries) as `src/data/psc-codes.json`.
- Same UX as NAICS: search → filter → detail. Cross-links to NAICS in the related-tools rail.

### 3. Executive Summary Generator — `/tools/executive-summary-generator`
**Why:** 170/mo, KDI 24, $2.70 CPC. Low volume but highest commercial intent — these searchers are mid-proposal and convert. Showcases our AI directly.

- New edge function `tools-generate-executive-summary` (no JWT, but IP-rate-limited 5/hour, 8k char input cap). Uses Lovable AI Gateway (Gemini Flash — cheap, fast).
- UI: textarea (paste RFP or proposal context), tone select (Formal/Confident/Concise), word target slider (150–400). Output renders inline + Copy button.
- "Save & refine in OptiRFP" CTA after generation.

### Shared work
- Add 3 entries to `src/data/tools-registry.ts` (titles, meta, FAQs).
- Add 3 lazy routes in `src/App.tsx`.
- Add 3 URLs to `public/sitemap.xml`.
- Update `public/llms.txt` with new tools.
- ToolsHub already auto-renders from registry — no edit needed.

### Technical notes
- NAICS/PSC datasets shipped as JSON in `src/data/` (no DB, no edge function — pure client-side, instant search).
- Exec Summary edge function deployed with `verify_jwt = false`, validates input with Zod, IP rate-limit via in-memory sliding window (acceptable for v2; upgrade to a `tool_usage` table if abuse appears).
- All three pages: full SEO recipe (canonical, JSON-LD `SoftwareApplication` + `FAQPage` + `BreadcrumbList`, FAQs, related-tools rail, soft CTA).

### Files
**Create:** `src/data/naics-2022.json`, `src/data/psc-codes.json`, `src/pages/tools/NaicsLookup.tsx`, `src/pages/tools/PscLookup.tsx`, `src/pages/tools/ExecutiveSummaryGenerator.tsx`, `supabase/functions/tools-generate-executive-summary/index.ts`.
**Edit:** `src/data/tools-registry.ts`, `src/App.tsx`, `public/sitemap.xml`, `public/llms.txt`.

### Out of scope (deferred)
- RFP Readiness Score (no real keyword volume) and RFP Jargon Glossary (zero recorded volume) — skip until/unless competitors validate the demand.

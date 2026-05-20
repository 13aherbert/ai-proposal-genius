## 5 New Free Tools for /tools

Picked for keyword opportunity in the federal/SLED contracting niche where OptiRFP already ranks, plus reuse of the existing `/tools` framework (registry + page + edge function pattern from `ExecutiveSummaryGenerator`).

### 1. Capability Statement Generator — `/tools/capability-statement-generator`
**Keyword angle:** "capability statement template", "capability statement generator", "federal capability statement" — high commercial intent from new GovCon entrants registering on SAM.gov.

Form-based: company info, core competencies, differentiators, past performance, NAICS/PSC, UEI/CAGE, contact. Live preview of a 1-page printable layout. **Export to PDF** (browser print) and PNG (html2canvas). Pure client-side, no AI cost.

### 2. Bid / No-Bid Scorecard — `/tools/bid-no-bid-scorecard`
**Keyword angle:** "bid no bid template", "bid no bid checklist", "go no go decision proposal" — pulls in proposal managers evaluating individual opportunities.

12-question weighted scorecard across 4 categories (fit, win probability, capacity, strategic value). Slider inputs, auto-computed weighted score, red/yellow/green verdict, exportable PDF summary. Pure client-side.

### 3. AI Proposal Outline Generator — `/tools/proposal-outline-generator`
**Keyword angle:** "proposal outline template", "rfp outline generator", "ai proposal outline" — funnel candidate: anyone searching this is mid-buying-cycle for OptiRFP.

Paste RFP excerpt + proposal type → AI returns structured outline (sections, page allocations, key questions to answer per section). Same pattern as `tools-generate-executive-summary`: new edge function `tools-generate-proposal-outline` calling Gemini via Lovable Gateway, with abuse-rate-limiting (existing pattern).

### 4. Government Contracting Acronym Decoder — `/tools/govcon-acronym-decoder`
**Keyword angle:** "government contracting acronyms", "federal acquisition acronyms", "rfp acronym list", "FAR acronyms" — long-tail with low competition and strong evergreen traffic.

Two modes: (a) browse/search a built-in dictionary of ~500 GovCon acronyms (FAR, DFARS, SAM, NAICS, IDIQ, BPA, RFI, CDRL, etc.) bundled as JSON; (b) paste RFP text → tool highlights every acronym and shows definitions inline. Pure client-side.

### 5. Plain Language Readability Scorer — `/tools/plain-language-scorer`
**Keyword angle:** "plain language checker", "flesch kincaid score", "readability score for proposals", "plain writing act" — federal proposals must comply with the Plain Writing Act; nothing in our current tools covers this.

Paste text → returns Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, sentence/word length stats, passive voice count, jargon count (banned-word list shared with `proposal-quality-standards`), and a target-audience verdict ("reads at 14th grade — federal evaluators expect ≤10th"). Pure client-side, complements existing word counter.

---

### Implementation pattern (each tool)
Files added per tool, following the existing `ExecutiveSummaryGenerator` / `NaicsLookup` pattern:
- `src/pages/tools/<Name>.tsx` with `useSEO`, structured data, FAQ section, internal links back to `/tools` and `/auth`.
- Entry appended to `src/data/tools-registry.ts` (slug, SEO title, meta, keywords, FAQs, lucide icon).
- Lazy route added in `src/App.tsx`.
- URL added to `public/sitemap.xml` and `public/llms.txt`.

AI tools (#3) also get:
- `supabase/functions/tools-generate-proposal-outline/index.ts` (Gemini, public, rate-limited by IP hash, same shape as `tools-generate-executive-summary`).
- Registered in `supabase/config.toml` with `verify_jwt = false`.

Static-data tools (#4) ship a JSON file under `src/data/` (e.g. `govcon-acronyms.json`).

### Out of scope (deferred)
- Tracking each tool's GSC performance in `/admin/seo` — already covered by the GSC integration.
- A `/tools` filter/category UI — only 12 tools total after this, hub list is still scannable.
- Tools requiring API quotas/keys (e.g. live SAM.gov entity lookup) — would gate on user signup and break the "no-signup" promise.

Confirm and I'll build all 5 in one pass, or tell me to swap any (e.g. drop Readability Scorer for a Cost-Plus Pricing Calculator).
# Free Tools Hub — Plan

Goal: drive organic search traffic with a suite of free, no-login tools tightly themed to RFPs, proposals, and government contracting. Each tool is its own indexable page with strong on-page SEO and clear conversion paths into OptiRFP signup.

## Information architecture

New public routes (added to `PublicLayout` in `src/App.tsx`, included in `public/sitemap.xml` at priority 0.9 for the hub and 0.8 for each tool):

```
/tools                          Hub / index page
/tools/rfp-readiness-score      Paste an RFP → AI-style scored checklist
/tools/proposal-word-counter    Word/char/page/reading-time counter
/tools/rfp-deadline-calculator  Business-day deadline + reminder schedule
/tools/win-rate-calculator      Submitted vs won → win rate + benchmarks
/tools/proposal-pricing-estimator  Hours × rate + margin → bid price
/tools/compliance-matrix-generator Paste shall/must list → downloadable CSV matrix
/tools/executive-summary-generator Short form → templated exec summary (no AI calls in v1, template-based)
/tools/naics-psc-lookup         Search NAICS / PSC codes (static dataset)
/tools/rfp-jargon-glossary      Searchable glossary (FAR, IDIQ, BAA, etc.)
```

v1 ships the hub + 4 tools (Word Counter, Deadline Calculator, Win Rate Calculator, Compliance Matrix Generator). Remaining tools land in follow-up batches.

## Page structure (per tool)

Every tool page follows the same SEO-first template so they rank individually:

1. H1 with primary keyword (e.g. "Free RFP Deadline Calculator")
2. 1–2 sentence value prop + "no signup required" trust line
3. The interactive tool, above the fold on desktop and mobile
4. "How it works" (3 steps)
5. "Why it matters" / use cases (300–500 words, keyword-rich)
6. FAQ (4–6 Q&As, rendered with FAQPage JSON-LD)
7. Related tools (internal linking)
8. Soft CTA to OptiRFP ("Want this automated across every RFP? Try OptiRFP free")

## SEO implementation

- `useSEO` on every tool page: unique title (<60 chars), description (<160 chars), canonical to `https://optirfp.ai/tools/<slug>`, OG tags
- JSON-LD per page: `SoftwareApplication` + `FAQPage` (and `BreadcrumbList` Home → Tools → Tool)
- Add all tool URLs to `public/sitemap.xml` (priority 0.9 hub, 0.8 tools)
- Keep `public/robots.txt` permissive for `/tools/*`
- Internal linking: hub links to all tools; each tool links to 3 related tools and to `/blog`, `/pricing`
- Lazy-load tool routes via existing `React.lazy` pattern in `App.tsx`
- All tools fully client-side (no Supabase calls) so they're fast, cacheable, and render instantly for crawlers

## Conversion / analytics

- Each tool fires `tool_used` analytics event (via existing `src/services/analytics.ts`) with `tool_name` and outcome
- Persistent but dismissible "Save results to your OptiRFP account" banner after the user completes a calculation
- Exit intent already exists site-wide via `useExitIntent`

## Design

- Reuse `PublicLayout` (PublicNavbar + Footer)
- Add "Free Tools" link to PublicNavbar
- Tool cards on `/tools` use existing dark theme + brand-green accent; semantic tokens only
- Each tool sits in a single focused card; results panel reveals inline (no modal)

## v1 tool specs (build first)

1. **Proposal Word Counter** — textarea → live word/char/sentence/paragraph/reading-time/page-count (250 wpm, 500 wpp). Strips HTML. Keywords: "proposal word counter", "rfp word count tool".
2. **RFP Deadline Calculator** — date picker + "submit X business days before" → milestone schedule (kickoff, draft, internal review, final, submit). Downloadable .ics. Keywords: "rfp deadline calculator", "proposal timeline calculator".
3. **Win Rate Calculator** — inputs: submitted, won, avg contract value → win rate %, est. revenue, vs industry benchmark (static table). Keywords: "proposal win rate calculator", "rfp win rate".
4. **Compliance Matrix Generator** — paste RFP text → regex-extract "shall/must/will" sentences → editable table with section #, requirement, response owner, status → export CSV. Keywords: "compliance matrix generator", "rfp compliance matrix template".

## Files to add (v1)

- `src/pages/tools/ToolsHub.tsx`
- `src/pages/tools/WordCounter.tsx`
- `src/pages/tools/DeadlineCalculator.tsx`
- `src/pages/tools/WinRateCalculator.tsx`
- `src/pages/tools/ComplianceMatrixGenerator.tsx`
- `src/components/tools/ToolPageLayout.tsx` (shared H1/FAQ/CTA wrapper)
- `src/components/tools/ToolCard.tsx`
- `src/data/tools-registry.ts` (single source of truth: slug, title, desc, keywords, icon, FAQs)

## Files to edit (v1)

- `src/App.tsx` — add 5 lazy routes inside `<PublicLayout />` block
- `public/sitemap.xml` — add 5 entries
- `src/components/navigation/PublicNavbar.tsx` — add "Free Tools" link

## Open questions before building

1. Confirm v1 set: Word Counter, Deadline Calculator, Win Rate Calculator, Compliance Matrix Generator — or swap any?
2. OK to add "Free Tools" to the main public navbar (vs. footer-only)?
3. Should results be shareable via URL (encoded query params) for extra organic/social reach?

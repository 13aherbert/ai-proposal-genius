## SEO hardening — Free Tools

Tools already have the basics: per-route `useSEO` hook (title / description / canonical / OG / JSON-LD), `ToolPageLayout` injecting `SoftwareApplication + FAQPage + BreadcrumbList`, every tool listed in `public/sitemap.xml`. This plan fixes the remaining gaps that hold back organic ranking.

### 1. Audit every tool page for SEO basics

Spot-check the 5 non-standard tool pages (built outside `ToolPageLayout`) to confirm they each render: one H1, semantic `<main>`, canonical URL, OG tags, and `SoftwareApplication + FAQPage + BreadcrumbList` JSON-LD via `useSEO`.

- `RfpResponseTemplateGenerator.tsx`
- `RfpTemplateLibrary.tsx` + `RfpTemplateDetail.tsx`
- `HowToRespondToRfpGuide.tsx` (already has HowTo + Article — verify)
- `RfpResponseGenerator.tsx`

Patch any that are missing pieces.

### 2. Enrich tool metadata in `src/data/tools-registry.ts`

For all 20 tools:

- Expand `keywords` from 3 → 6–10 per tool with realistic long-tail variants ("free", "online", "2026", "template", "for proposals", "for government contracts").
- Tighten any `seoTitle` over 60 chars; tighten any `metaDescription` over 160 chars.
- Add a 4th FAQ where currently 3 (more FAQ surface = more rich-result chances).
- Add an optional `lastUpdated: "2026-05-30"` field, surfaced in body copy as "Updated May 2026" (freshness signal) and used for sitemap `<lastmod>`.

### 3. Add richer structured data

Extend `ToolPageLayout` to optionally emit:

- `HowTo` schema, built from the existing `howItWorks` steps (cheap win — every tool already passes this prop).
- `WebPage` wrapper with `inLanguage: "en-US"` and `isPartOf` linking back to the site `WebSite` schema.

`ToolsHub.tsx`: add `ItemList` schema alongside the existing `CollectionPage` so Google can surface the full tool list as a sitelinks-style result.

### 4. Fix the OG image fallback

`useSEO` defaults to `/og-image.png` but the file isn't in `public/`. Point the default at the existing hosted banner from `index.html` (the GCS `OptiRFP_Social_Banner.webp` URL). This unblocks social-preview cards across every tool page without per-tool image work.

### 5. Strengthen ToolsHub for topical authority

- Group tools into clusters (Calculators, Generators, Lookups, Templates, Guides, AI Tools) with a short keyword-rich intro per cluster. Cluster pages aren't being added — just visual grouping inside `/tools` to deepen body copy and increase internal anchor variety.
- Add a paragraph of intro copy under the H1 with secondary keywords ("RFP tools", "proposal software alternatives", "free for proposal managers").
- Add a footer block of text links to every tool (anchor text = tool title) to spread internal PageRank.

### 6. Internal linking across the site

- `ToolPageLayout`: append a "More free tools" text-link section (anchor cloud of 6–8 sibling tools) below the existing 3-card Related block — text anchors carry more SEO weight than card titles.
- Add cross-links inside `whyItMatters` copy where it makes sense (e.g. Go/No-Go scorecard ↔ Win Rate Calculator ↔ How to Respond Guide).
- Add a `/tools` link to the public footer if not present.

### 7. Sitemap freshness

`public/sitemap.xml` is hand-maintained (per project memory: don't migrate without asking). Edit in place to:

- Add `<lastmod>2026-05-30</lastmod>` to every tool URL.
- Add `<changefreq>monthly</changefreq>` to tool URLs and `weekly` to the hub.
- Confirm every tool route from `App.tsx` is present (Go/No-Go is — double-check after registry changes).

### 8. Out of scope (call out, don't do)

- **Google Search Console connector** — there's a failing GSC finding ("isn't fully set up"). That requires the user to authorize the connector; I'll mention it but not start the flow unless asked.
- **Lighthouse perf/a11y findings** — separate concern from SEO discoverability.
- **Switching to `react-helmet-async`** — current `useSEO` hook handles per-route head correctly for JS-executing crawlers (Googlebot). No migration needed.
- **Per-tool OG images** — using the shared banner is sufficient; bespoke OG images would be a follow-up if the user wants stronger social CTR.

### Files touched

- `src/data/tools-registry.ts` — keywords, FAQs, `lastUpdated`, title/description tightening
- `src/components/tools/ToolPageLayout.tsx` — HowTo + WebPage schema, text-link block
- `src/pages/tools/ToolsHub.tsx` — clusters, ItemList schema, intro + footer link cloud
- `src/hooks/use-seo.ts` — OG image default fallback URL
- `src/pages/tools/RfpResponseTemplateGenerator.tsx`, `RfpTemplateLibrary.tsx`, `RfpTemplateDetail.tsx`, `HowToRespondToRfpGuide.tsx`, `RfpResponseGenerator.tsx` — patch any missing SEO bits
- `public/sitemap.xml` — lastmod / changefreq on tool URLs

### Expected impact

- More long-tail keyword matches per tool page (richer keyword + FAQ surface).
- More rich-result eligibility (HowTo + ItemList on top of existing SoftwareApplication + FAQPage).
- Better internal PageRank distribution across the tool cluster.
- Working OG previews when tool URLs are shared on LinkedIn / Slack.
- Cleaner crawl signals via `lastmod`.

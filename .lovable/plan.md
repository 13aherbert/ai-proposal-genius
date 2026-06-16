## SEO content build — capture demand competitors are winning

Semrush data (US, organic) on the head terms behind Loopio, Responsive, and Proposify's top pages shows three clear, low-difficulty wins for optirfp.ai:

| Target keyword | Volume / mo | Difficulty | Why it's winnable |
|---|---|---|---|
| **what is an RFP** / *rfp meaning* | 27,100 + 6,600 | very low | Pure definition intent; Responsive's *rfp meaning* post ranks #1 with one page |
| **rfp examples** | 1,600 | 19 (easy) | Responsive's #2 traffic page; clear template/example intent |
| **rfp response template** | 590 (+ *rfp template* 2,900) | 8 (very easy) | Loopio's #5 traffic page; commercially valuable ($5.64 CPC) |

### What to build

**1. `/resources/what-is-an-rfp`** — cornerstone glossary post
- H1: "What Is an RFP? Request for Proposal Meaning, Process & Examples"
- Covers definition, RFP vs RFI vs RFQ, who issues them, sample timeline
- Internal links to the two pages below + Tools Hub + Sign-up CTA

**2. `/resources/rfp-examples`** — examples gallery
- 6–10 real-world RFP examples by industry (IT, construction, marketing, gov)
- Each with a short breakdown ("what this RFP does well")
- CTA: "Upload your RFP to OptiRFP to auto-extract requirements"

**3. `/resources/rfp-response-template`** — free downloadable template
- Embedded template preview + downloadable .docx
- Section-by-section guidance (exec summary, approach, pricing, team)
- CTA: "Generate a tailored response with OptiRFP in minutes"

### Page structure (all three)

```text
PublicLayout
  ├── SEO component (title, meta, canonical, og:*, Article JSON-LD)
  ├── <h1> with target keyword
  ├── Table of contents (anchor links)
  ├── Long-form body (~1,500–2,500 words, semantic HTML, alt text)
  ├── Related-resources cross-links
  └── Sign-up CTA card
```

### Technical details

- New route group: `src/pages/resources/` with `WhatIsAnRFP.tsx`, `RfpExamples.tsx`, `RfpResponseTemplate.tsx`
- Register routes in `src/App.tsx` under `PublicLayout`
- Reuse the existing `SEO` component (`src/components/SEO.tsx`) — per-route title/description/canonical, matching the pattern set in the recent SSO pages work
- Add the three URLs to `public/sitemap.xml`
- Add a "Resources" link to `PublicNavbar` and `Footer`
- Downloadable template: ship a static `.docx` in `public/downloads/` (file you provide, or I scaffold a basic one)

### Out of scope (separate follow-ups if you want them)

- Loopio-style "best AI RFP software" listicle (would compete with our own product page)
- Per-industry RFP template gallery (multi-page build, tackle after the cornerstone ranks)
- Blog CMS — these are static MDX-style React pages; if you want them editable from the admin panel that's a bigger change

### After deploy

Trigger an SEO scan from the SEO & AI search tab to confirm titles, metas, and sitemap entries register cleanly.

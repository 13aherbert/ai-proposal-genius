

## Plan: SEO Comparison Pages

### Files to Create

**1. `src/pages/CompareLoopio.tsx`** — `/compare/loopio`
- SEO title: "OptiRFP vs Loopio 2026 | Comparison"
- Hero with logos ("OptiRFP" text + "VS" + "Loopio" text), gradient background
- 3-bullet quick verdict (free vs $20K, 3 free projects vs none, AI-native vs legacy)
- Comparison table using existing `Table` components — rows: Pricing, Free Tier, AI Capabilities, Ease of Use, Setup Time, Support — with winner badges (green checkmark) on OptiRFP advantages
- Sections: Pricing, Ease of Use, AI Features, Why Switch — each with heading + short paragraph
- Sticky bottom CTA bar: "Start Free — No Credit Card Required"
- Footer included

**2. `src/pages/CompareAutoRFP.tsx`** — `/compare/autorfp`
- SEO title: "OptiRFP vs AutoRFP 2026 | Comparison"
- Same layout pattern as Loopio page
- Focus on: free tier advantage, transparent pricing ($49/mo vs custom quotes), AI-native approach
- Same comparison table structure, sticky CTA, footer

### Files to Modify

**3. `src/App.tsx`** — Add routes
- `/compare/loopio` and `/compare/autorfp` as public routes next to `/blog`

**4. `src/components/navigation/Footer.tsx`** — Add "Compare" links or a "Compare" section

### Technical Notes
- Both pages are static/public, no auth required
- SEO meta set via `useEffect` (same pattern as Blog)
- Sticky CTA: `fixed bottom-0` bar with `z-50`, semi-transparent background
- Winner badges: green `Badge` variant on OptiRFP column cells
- Reuse existing `Table`, `Badge`, `Button`, `Card` components
- Each page ~200-250 lines


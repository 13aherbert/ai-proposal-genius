

## Plan: Create 4 Missing Competitor Comparison Pages

Create 4 new comparison pages following the exact template from `CompareLoopio.tsx`, then register routes in `App.tsx`.

### New Files

**1. `src/pages/CompareResponsive.tsx`** — OptiRFP vs Responsive (formerly RFPIO)
- Competitor positioning: Enterprise RFP platform, $15K+/year, per-seat pricing, complex setup
- Quick verdict: "Free vs $15K+/year", "Flat rate vs per-seat", "AI-native vs content library"
- Comparison rows: pricing ($20K+/year), per-seat pricing (Yes vs No), setup (6-8 weeks), AI (content library search vs full AI pipeline)
- Detail sections: per-seat cost trap, enterprise complexity vs simplicity, unlimited users advantage

**2. `src/pages/CompareProposify.tsx`** — OptiRFP vs Proposify
- Competitor positioning: Proposal design tool, $49/user/mo, focused on templates/design not RFP response
- Quick verdict: "$199/mo flat vs $49/user/mo", "AI-powered vs template-based", "RFP-focused vs general proposals"
- Comparison rows: pricing (per-seat), RFP analysis (none vs AI), proposal drafting (manual templates vs AI), setup time
- Detail sections: RFP-specific vs general proposal tool, per-seat costs at scale, AI drafting vs templates

**3. `src/pages/CompareQvidian.tsx`** — OptiRFP vs Qvidian (now Upland Qvidian)
- Competitor positioning: Legacy enterprise RFP tool, $30K+/year, long implementation cycles
- Quick verdict: "Free vs $30K+", "5 min setup vs 8-12 weeks", "Modern AI vs legacy software"
- Comparison rows: pricing, implementation time (8-12 weeks), technology (legacy on-prem vs cloud-native), AI capabilities
- Detail sections: legacy technology debt, implementation burden, modern cloud alternative

**4. `src/pages/ComparePandaDoc.tsx`** — OptiRFP vs PandaDoc
- Competitor positioning: Document automation platform, $35/user/mo, broad focus (contracts, proposals, quotes)
- Quick verdict: "$199/mo flat vs $35/user/mo", "RFP specialist vs generalist", "6 free projects vs 14-day trial"
- Comparison rows: pricing (per-seat), RFP-specific AI (none vs full), free tier (14-day trial vs 6 projects/year), focus (general docs vs RFP)
- Detail sections: specialist vs generalist, per-seat scaling costs, free tier advantage

### Route Registration — `src/App.tsx`
Add 4 new imports and 4 new Route entries alongside existing `/compare/loopio` and `/compare/autorfp` routes.

### All pages share
- Same imports, layout structure, sticky CTA with signup dialog, Footer, `useSEO` hook, `variant="dialog"` on AuthForm
- Correct OptiRFP pricing: Free / $199/mo, 6 projects free per year, unlimited users on paid plans

### Files Created (4) + Modified (1)
- `src/pages/CompareResponsive.tsx`
- `src/pages/CompareProposify.tsx`
- `src/pages/CompareQvidian.tsx`
- `src/pages/ComparePandaDoc.tsx`
- `src/App.tsx` (add imports + routes)


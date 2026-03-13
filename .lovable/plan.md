

## Plan: Redesign Pricing Page with New 4-Tier Structure

### Overview
Redesign the `PricingDemo` component and its children to match the new 4-tier pricing spec with updated features, microcopy, comparison table, and FAQ section. The `/pricing` route already redirects to `/#pricing`, so the homepage `PricingDemo` is the pricing page.

### Changes

**1. Update `src/components/blocks/pricing-demo.tsx`**
- Update the `plans` array with new feature lists per spec:
  - Starter: 6 projects, 1 user, basic AI (watermarked), community support
  - Growth: 36 projects, unlimited team, enhanced AI, Opportunity Search (10/mo), no watermarks, email support, integrations
  - Business: 120 projects, unlimited team, advanced AI, unlimited Opportunity Search, AI Evaluation, API (5K/mo), priority support, integrations, 1 custom AI training/yr
  - Enterprise: unlimited everything, SOC 2/FedRAMP, SSO/SAML, dedicated CSM, on-premise, custom integrations, custom SLAs
- Add new fields to plan objects: `subtitle`, `microcopy`, `comparison`, `annualPrice` (for strikethrough display)
- Update button text: Starter="Get Started Free", Growth/Business="Start 14-Day Trial", Enterprise="Contact Sales"
- Add FAQ section after CompetitorComparison

**2. Update `src/components/blocks/pricing/PricingCard.tsx`**
- Add subtitle display (e.g., "Free forever", "Starting at $1,499/month")
- Add microcopy below CTA (e.g., "No credit card required")
- Add comparison line (e.g., "4x cheaper than AutoRFP.ai", "10x cheaper than Loopio")
- Show strikethrough monthly price with annual savings badge when annual billing is selected
- Business card: subtle blue gradient border/background highlight
- Enterprise card: show "Custom" as price instead of $1,499
- Ensure equal card heights with `flex` layout (already using flex-col)
- Add hover effect: `hover:shadow-lg hover:scale-[1.02] transition-all`
- Extend the plan interface with new optional fields

**3. Update `src/components/blocks/pricing/BillingToggle.tsx`**
- Change "(Save up to 20%)" to "(Save 10%)"

**4. Update `src/components/blocks/CompetitorComparison.tsx`**
- Replace comparison data to match spec: OptiRFP vs AutoRFP.ai vs Loopio vs Responsive
- Add "Only OptiRFP offers a free tier" highlight row
- Add cost savings callout: "Save $8,400/year vs AutoRFP.ai"
- Update column headers to match requested competitors

**5. Create `src/components/blocks/PricingFAQ.tsx`**
- 4 FAQ items using existing Accordion component:
  - "Can I upgrade or downgrade anytime?" → Yes, prorated
  - "What happens when I hit my project limit?" → Upgrade prompt
  - "Is there a free trial for paid plans?" → 14-day free trial
  - "Do you offer annual discounts?" → Yes, 10% off

**6. Update SEO in `src/pages/Index.tsx`**
- Update the pricing-related meta or add specific pricing structured data
- The meta title for the pricing section anchor: "Pricing | OptiRFP - Free Tier + Unlimited Users" — since this is on Index, update the page title when `#pricing` is in view (or update the Subscription page SEO instead)
- Actually, update `src/pages/Pricing.tsx` redirect page to set document title before redirecting

**7. Update `src/pages/Subscription.tsx` SEO**
- Update the stale useSEO call (currently says "Free to $449/mo" and "Basic ($49), Pro ($99)") to reflect new tiers

### Files touched
- **Modified**: `src/components/blocks/pricing-demo.tsx`, `src/components/blocks/pricing/PricingCard.tsx`, `src/components/blocks/pricing/BillingToggle.tsx`, `src/components/blocks/CompetitorComparison.tsx`, `src/pages/Subscription.tsx`
- **New**: `src/components/blocks/PricingFAQ.tsx`


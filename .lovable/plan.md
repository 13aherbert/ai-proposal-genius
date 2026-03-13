

## Plan: Update Pricing Page to Highlight Unlimited Users

### What changes

**1. Update `src/components/blocks/pricing-demo.tsx` — Revise plan data + add comparison section**
- Replace old plan data (Starter/Basic/Pro/Enterprise) with new tiers:
  - **Starter**: $0, 12 projects, 1 user, CTA "Start Free"
  - **Growth**: $199/$179 annual, 36 projects, "Unlimited team members" in features, badge "Best for small teams", CTA "Start Free Trial"
  - **Business**: $499/$449 annual, 120 projects, "Unlimited team members", badge "Most Popular" (isPopular: true), CTA "Start Free Trial"
  - **Enterprise**: $1499, unlimited projects, "Unlimited team members", CTA "Contact Sales"
- Add a new `CompetitorComparison` component below the `<Pricing>` block — a table comparing OptiRFP vs Loopio, Responsive, PandaDoc on price, per-seat pricing, user limits, and 10-user cost
- Add headline banner: "Unlimited Team Members on All Paid Plans" / "Pay for RFPs, not seats."

**2. Update `src/components/blocks/pricing/PricingCard.tsx` — Add badge support + unlimited highlight**
- Add optional `badge` field to `PricingPlan` interface
- Render badge (e.g., "Best for small teams") in top-left corner similar to existing Popular/Enterprise badges
- When a feature contains "Unlimited team members", render it with a highlighted style (bold text, Users icon, green accent) to make it visually prominent
- Update name checks: replace `"Free Trial"` references with `"Starter"`, add `"Growth"` handling

**3. Update `src/components/blocks/pricing/PricingHeader.tsx` — New default copy**
- Default title: "Unlimited Team Members on All Paid Plans"
- Default description: "Pay for RFPs, not seats. Add your entire team for one flat price."

**4. Update `src/components/blocks/pricing/index.tsx` + `PricingGrid.tsx` — Pass badge through**
- Add `badge` to the `PricingPlan` interface so it flows from plans data → grid → card

**5. New component: `src/components/blocks/CompetitorComparison.tsx`**
- Comparison table with 5 columns (Feature, Loopio, Responsive, PandaDoc, OptiRFP)
- Rows: Starting Price, Per-Seat Pricing (Yes/No), User Limit, Cost for 10 users
- OptiRFP column highlighted with green accent
- Bottom tagline: "OptiRFP: Same features, 75% less cost, unlimited team."

### Files touched
- **Modified**: `pricing-demo.tsx`, `PricingCard.tsx`, `PricingHeader.tsx`, `index.tsx`, `PricingGrid.tsx`
- **New**: `src/components/blocks/CompetitorComparison.tsx`


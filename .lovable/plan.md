

## Plan: Fix Critical OptiRFP Issues

### 1. Rebrand "ProposalPro" to "OptiRFP"

**Files to change:**
- `src/components/navigation/Footer.tsx`: Change copyright to "OptiRFP" and email to `support@optirfp.ai`
- `src/components/branding/BrandedFooter.tsx`: Update copyright year to 2026

### 2. Fix "Trial Plan" label to "Starter"

**File:** `src/components/account/SubscriptionCard.tsx`
- Line 362: Change `'trial': return 'Trial Plan'` to `'trial': return 'Starter Plan'`
- Line 496: Change `'Trial plan'` text to `'Starter plan'`

### 3. Fix Billing History Error

The `get-billing-history` edge function calls Stripe, which will fail if no Stripe customer exists or the key isn't set. Rather than fixing Stripe integration, we gracefully handle the error in `BillingHistory.tsx`:
- Show "No billing history yet" instead of an error when the function fails (treat function errors for free-tier users as "no invoices")
- Only show the error state for unexpected failures

### 4. Add Enterprise Tier ($299/month)

**File:** `src/components/blocks/pricing-demo.tsx`
- Add a 4th plan: Enterprise at $299/month ($2,870/year)
- Features: Unlimited projects, Unlimited users, API access, SSO integration, Dedicated account manager, Custom branding, Priority onboarding
- Button: "Contact Sales" linking to `mailto:sales@optirfp.ai`

**File:** `src/components/blocks/pricing/PricingCard.tsx`
- Handle "Contact Sales" plans: open mailto link instead of checkout
- Adjust card layout indices for 4-card grid

**File:** `src/components/blocks/pricing/PricingGrid.tsx`
- Verify grid handles 4 cards properly

### 5. Knowledge Base Starter Templates

**File:** New hook `src/components/knowledge-base/hooks/useStarterTemplates.ts`
- On first load for a user/org, check if knowledge base is empty
- If empty, insert 6 starter template entries with placeholder content marked "Replace with your content"
- Categories: Company Overview, Team Bios, Past Performance, Technical Capabilities, Pricing & Rates, Differentiators
- Show a progress indicator during seeding

**File:** `src/pages/KnowledgeBase.tsx`
- Integrate the starter template hook
- Show progress bar when templates are being created

### Technical Details

| Change | Files |
|--------|-------|
| Rebrand to OptiRFP | Footer.tsx, BrandedFooter.tsx |
| Trial → Starter label | SubscriptionCard.tsx |
| Graceful billing error | BillingHistory.tsx |
| Enterprise tier | pricing-demo.tsx, PricingCard.tsx |
| Starter templates | New hook + KnowledgeBase.tsx |


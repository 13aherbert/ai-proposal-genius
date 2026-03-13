

## Plan: Add Annual Billing with 10% Discount

### What's Already Done
Most of the annual billing UI is already implemented: BillingToggle with "Save 10%", strikethrough pricing on cards, `yearlyPrice` in plan data, annual Stripe price IDs in `UpgradeButton`, and `annual_price` column in `pricing_tiers`. The checkout flow already passes different `priceId` based on monthly/annual toggle.

### Remaining Changes

**1. Show dollar savings on pricing cards — `PricingCard.tsx`**
- Add "Save $240/year" for Growth and "Save $600/year" for Business below the annual savings badge when annual billing is selected
- Calculate dynamically: `(monthlyPrice * 12) - yearlyPrice`

**2. Add 14-day free trial to checkout — `create-checkout-session/index.ts`**
- Add `subscription_data.trial_period_days: 14` to the Stripe checkout session for Growth and Business plans
- Keep existing flow otherwise unchanged

**3. Pre-select Annual in pricing toggle — `PricingProvider.tsx`**
- Default `isMonthly` to `false` so Annual is pre-selected (higher LTV)

**4. Add `billing_interval` to subscriptions — new migration**
- `ALTER TABLE subscriptions ADD COLUMN billing_interval text DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual'));`
- Update stripe-webhook to store `billing_interval` based on Stripe subscription's `items.data[0].plan.interval` ('month' → 'monthly', 'year' → 'annual')

**5. Store billing_interval in webhook — `stripe-webhook/index.ts`**
- In `checkout.session.completed` and `customer.subscription.updated` handlers, read the plan interval from the Stripe subscription and write `billing_interval` to the subscriptions table

**6. Annual renewal email reminders — new edge function `annual-renewal-reminder/index.ts`**
- Scheduled function (cron) that queries subscriptions where `billing_interval = 'annual'` and `current_period_end` is 30 or 7 days away
- Sends reminder email showing savings: "You're saving $600/year on Business"
- Add cron schedule in `config.toml`

**7. Handle Monthly↔Annual switches — `create-checkout-session/index.ts`**
- When user already has an active subscription and switches billing interval, the existing Stripe checkout handles proration automatically via subscription updates
- No code change needed since Stripe handles proration by default on subscription updates

### Files Touched
- **Modified**: `src/components/blocks/pricing/PricingCard.tsx`, `src/components/blocks/pricing/PricingProvider.tsx`, `supabase/functions/create-checkout-session/index.ts`, `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/config.toml`
- **New**: `supabase/migrations/[timestamp]_add_billing_interval.sql`, `supabase/functions/annual-renewal-reminder/index.ts`


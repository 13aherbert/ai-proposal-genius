

## Plan: Add Annual Billing with 10% Discount — COMPLETED

### What Was Done

1. **Dollar savings on pricing cards** — `PricingCard.tsx` now shows "Save $240/year" for Growth and "Save $600/year" for Business when annual billing is selected, calculated dynamically.

2. **14-day free trial** — `create-checkout-session` now includes `trial_period_days: 14` for all paid plans.

3. **Annual pre-selected** — `PricingProvider.tsx` defaults `isMonthly` to `false` so annual billing is pre-selected.

4. **`billing_interval` column** — Migration added `billing_interval` ('monthly' | 'annual') to subscriptions table.

5. **Webhook stores billing_interval** — `stripe-webhook` now reads the Stripe plan interval and writes `billing_interval` on checkout and subscription updates.

6. **Annual renewal reminders** — New `annual-renewal-reminder` edge function queries annual subscriptions renewing in 30 or 7 days and sends reminder emails with savings info.

7. **Monthly↔Annual switches** — Handled by Stripe's default proration; no additional code needed.

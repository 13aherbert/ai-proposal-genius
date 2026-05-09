## Onboarding ↔ Stripe Checkout: Audit & Fix Plan

### What I found

End-to-end trace of signup → upgrade → webhook → subscription state surfaced three real blockers and a few cleanup items. Onboarding itself (3-step `EnhancedSignupForm`, `handle_new_user` trigger creating profile + default org + `user` role, redirect to `/dashboard` with progressive wizard via `useOnboardingFlow`) is working. The break is in the marketing pricing → Stripe handoff.

### Blockers

1. **Wrong ID type on the marketing pricing page.** `src/components/blocks/pricing-demo.tsx` uses Stripe **Product** IDs (`prod_Rn5Qc3JRlG2dP5`, `prod_Rn5STkpd7teaIR`) for both monthly and annual. `create-checkout-session/index.ts` calls `stripe.prices.retrieve(priceId)`, which only accepts `price_...` IDs — every checkout from the public pricing page throws "Invalid price ID" before opening Stripe. The monthly/annual toggle is also a no-op because both slots hold the same value.

2. **Webhook can't link the paying user to a subscription row.** `create-checkout-session/index.ts` sets only `subscription_data.metadata.user_id`. `stripe-webhook` reads `session.client_reference_id` on `checkout.session.completed` and writes that into `subscriptions.user_id`. Result: every successful checkout upserts a row with `user_id = null`, so `check-subscription`, `SubscriptionProvider`, and project-limit gating never see the upgrade and the user stays on Starter despite paying.

3. **Two divergent sources of truth for price IDs.** `src/components/subscription/UpgradeButton.tsx` (used in the in-app `/subscription` page) hardcodes its own `price_1Qlh...` IDs that are different from the marketing page's `prod_...` IDs. Even once the marketing page is fixed, drift between the two will cause inconsistent behavior.

### Other issues worth cleaning up in the same pass

- **`OnboardingRouter` welcome card is unreachable** — its `useEffect` always navigates to `/dashboard` before the card can render. Delete the dead UI.
- **`createTrialSubscription` writes a client-side row** with a random UUID and `status: 'trialing'`. Stripe webhook is the source of truth; this drifts. Remove the call site.
- **CTA routing inconsistencies** in `pricing-demo.tsx`: Starter `href: "/#signup"` (no anchor exists), Enterprise `href: "#"`, paid plans `href: "/subscription"` instead of triggering checkout directly.

### Plan

**1. Centralize Stripe price IDs**
Create `src/config/stripe-prices.ts` exporting one map used by both the marketing pricing page and `UpgradeButton`:
```ts
export const STRIPE_PRICE_IDS = {
  growth:   { monthly: "<paste>", annual: "<paste>" },
  business: { monthly: "<paste>", annual: "<paste>" },
};
```
Update `UpgradeButton.tsx` and `pricing-demo.tsx` to import from this single source. **You'll paste the four `price_...` IDs after approval.**

**2. Wire the public pricing card to checkout**
In `src/components/blocks/pricing/PricingCard.tsx`, route by plan name:
- Starter → `navigate('/auth?mode=signup')`
- Growth / Business → `createCheckoutSession(priceId)` then `window.location.href = url`
- Enterprise → open the existing `EnterpriseLeadForm` modal (the one wired to `submit-enterprise-lead`)

Remove the `/subscription` redirect for paid tiers so the public pricing page actually closes the deal.

**3. Fix the user → subscription link in checkout**
In `supabase/functions/create-checkout-session/index.ts`, add `client_reference_id: user.id` to `stripe.checkout.sessions.create(...)` (keep `subscription_data.metadata.user_id` for redundancy). In `supabase/functions/stripe-webhook/index.ts`, add a fallback inside `checkout.session.completed`: if `session.client_reference_id` is null, read `subscription.metadata.user_id` instead before upserting.

**4. Trim dead onboarding UI**
- `OnboardingRouter.tsx`: keep the loading state + redirect, delete the unreachable welcome card and "profile not found" branch (kept simple — the dashboard already runs the progressive wizard).
- Remove the `createTrialSubscription` invocation; let the DB / Starter default handle it.

**5. Smoke test in Stripe test mode**
- Sign up → land on dashboard with Starter
- Click Upgrade to Growth (annual) on the public `/pricing` → Stripe Checkout opens with the right price → complete with test card `4242…`
- Confirm webhook fires (`stripe-webhook` logs show `Subscription stored successfully`)
- Confirm `subscriptions` row has correct `user_id`, `plan_type='growth'`, `billing_interval='year'`, `project_limit=36`
- Confirm `useSubscription` reflects Growth in the dashboard immediately (or after one refresh)
- Repeat the monthly/annual toggle to verify the two distinct price IDs are sent

### Technical details

- Files touched: `src/config/stripe-prices.ts` (new), `src/components/blocks/pricing-demo.tsx`, `src/components/blocks/pricing/PricingCard.tsx`, `src/components/subscription/UpgradeButton.tsx`, `src/components/auth/onboarding/OnboardingRouter.tsx`, `src/components/subscription/SubscriptionPlans.tsx` (remove `createDefaultSubscription` call site), `supabase/functions/create-checkout-session/index.ts`, `supabase/functions/stripe-webhook/index.ts`.
- No DB migration required — `subscriptions` schema already has every column the webhook writes.
- No new secrets required — `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are already configured.

### What I need from you to start

The four real `price_...` IDs from your Stripe dashboard:
- Growth — monthly
- Growth — annual
- Business — monthly
- Business — annual

(They'll be listed under each product in Stripe → Products → click product → "Pricing" section. Each starts with `price_`.)
## Lifetime Deal — verification report

### What works ✅

The full plumbing is in place and consistent end-to-end:

- **Schema**: `lifetime_deal_codes` + `lifetime_deal_redemptions` tables with RLS, `is_lifetime` / `lifetime_redemption_id` columns on `subscriptions`.
- **Validation RPC**: `public.validate_lifetime_code(text)` is `SECURITY DEFINER`, granted to `anon`+`authenticated`, returns `{valid, code_id, plan_slug, price_id}` and correctly handles not_found / inactive / expired / sold_out.
- **Atomic claim RPC**: `claim_lifetime_code_slot(uuid)` increments redemption_count in a single guarded UPDATE — no oversell race.
- **Edge functions**: `validate-lifetime-code` (public, sanitizes) and `create-lifetime-checkout` (auth-gated, re-validates server-side, blocks paying users + existing lifetime, creates Stripe one-time `mode: payment` session with metadata).
- **Webhook**: `stripe-webhook` `checkout.session.completed` branch detects lifetime mode, atomically claims a slot (refunds Stripe charge if claim fails), upserts redemption, upserts subscription with `is_lifetime=true`, syncs org tier, sends welcome email. Skips overwriting lifetime entitlements on later subscription events. Refund branch reverses entitlement.
- **Frontend**: `/lifetime?code=…` validates → CTA either claims (if signed in) or stashes code in `localStorage` and routes to `/auth?mode=signup`. `AuthProvider`'s `SIGNED_IN` handler picks up the code and triggers checkout.
- **Success page**: `/subscription/success?lifetime=1` switches copy to "for life", suppresses next-billing date, shows "One-time — no renewals".
- **Admin UI**: `/admin/lifetime` lists codes + redemptions, lets system admins create codes and toggle `is_active`.

### What blocks an actual test ❌

1. **No codes exist in the database.** `lifetime_deal_codes` is empty. Visiting `/lifetime?code=ANYTHING` returns `not_found`. You need to first create one via `/admin/lifetime` — and that requires a Stripe **one-time** Price ID.

2. **No matching Stripe Price.** The admin form expects `price_id` for a one-time payment Price object in your Stripe dashboard (e.g. `price_…`). Lifetime works in `mode: 'payment'`, so it must be a one-time price, not a recurring one. Confirm one exists for the lifetime amount.

3. **`STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY` must be set** for the webhook to verify and the checkout function to talk to Stripe. (Both are referenced; can't confirm secrets are populated without a fetch.)

4. **No public discoverability.** `/lifetime` is not linked from the navbar, pricing page, or footer. By design (invitation-only via `?code=`), but if you want to drive traffic you need an entry point.

### Fixable rough edges

| # | Issue | Fix |
|---|---|---|
| A | `/lifetime` with no code shows "missing_code" with only "View regular pricing" — no input to paste a code | Add a code input + "Apply code" button on the missing/invalid state |
| B | Lifetime email-confirm flow: if user signs up and email confirmation is required, `SIGNED_IN` doesn't fire until confirmation → `localStorage` code is preserved, but if they confirm in a different browser the code is lost | Persist code on the `auth.users.user_metadata` during signup as backup, or surface explicit "Continue to checkout" button on `/subscription/success?pending_lifetime=1` |
| C | `AuthProvider` SIGNED_IN handler also fires on token refresh / tab restore for an already-signed-in user. Today the `localStorage.removeItem('lifetime_deal_code')` runs before the checkout call, so a transient failure (network blip) loses the code | Only remove the code after `data?.url` is received, otherwise leave it for retry |
| D | Admin `CreateCodeForm` accepts free-text `plan_slug` — typos silently break entitlement mapping | Replace with `<Select>` of valid slugs (`growth`, `business`) sourced from `pricing_tiers` |
| E | Admin form lets you create duplicate Stripe price → multiple codes pointing at the same Price (intentional?) and doesn't validate that the price is one-time | Optional: validate via a `stripe.prices.retrieve` call in a new edge function, reject `recurring` |
| F | Lifetime FEATURES list on `/lifetime` is hardcoded ("36 RFP projects per year", "10 monthly opportunity searches") and may drift from the actual Growth tier in `pricing_tiers` | Pull feature bullets from `pricing_tiers` for the validated `plan_slug` |
| G | `claim_lifetime_code_slot` updates `redemption_count`, but the table column is named `redemption_count` while a few code paths reference `redeemed_count` in earlier discussion. Confirmed schema uses `redemption_count` ✓ — no action needed, just calling it out |
| H | `/lifetime` is rendered outside `PublicLayout`, so it has no public navbar/footer — fine for a focused conversion page, but inconsistent with `/pricing`, `/blog`, etc. | Optional: wrap in `PublicLayout` if you want shared chrome |
| I | If a logged-in user with an active paid subscription opens `/lifetime?code=…` and clicks Claim, they get a generic toast "Lifetime deal is for new accounts only" with no path forward | Show that ineligibility state on the page itself (before checkout) by checking subscription state in the validate step |

### Recommended testing checklist

1. In Stripe Dashboard, create a one-time Price (e.g. `$497`) on your existing OptiRFP product.
2. Open `/admin/lifetime`, click **New code**, paste the `price_…`, set `plan_slug=growth`, `max_redemptions=5`, leave `expires_at` blank.
3. Sign out, open `/lifetime?code=YOURCODE` in an incognito window — confirm the validated state renders.
4. Click **Sign up & Claim**, complete signup, verify you are redirected to Stripe Checkout (`payment` mode, not subscription).
5. Pay with Stripe test card `4242 4242 4242 4242`.
6. Confirm:
   - `/subscription/success?lifetime=1` shows the "for life" copy.
   - `lifetime_deal_redemptions` has a row with your `stripe_checkout_session_id`.
   - `subscriptions.is_lifetime=true`, `billing_interval='lifetime'`, `plan_type='growth'`.
   - `lifetime_deal_codes.redemption_count` incremented by 1.
7. In Stripe, refund the payment. Confirm the webhook flips `refunded_at` and demotes the user back to starter.
8. Try claiming the same code again with a different account — should work until cap hit, then return `sold_out`.

### Suggested next move

Tell me which to do:
- **Just fix the rough edges** (A–F above) so the system is production-ready.
- **Walk me through end-to-end testing** — I can help draft the Stripe Price + a seed code via `/admin/lifetime`.
- **Add a public marketing page** at `/lifetime-deal` (no code required) that captures email and emails out codes, so you can run an actual LTD campaign.

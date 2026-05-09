
## Lifetime Deal — Growth Plan Forever

A shared link like `https://optirfp.ai/lifetime?code=LTD2026` lets new users sign up and pay once in Stripe. After payment, their account is permanently entitled to the Growth plan with no recurring billing.

### 1. Database

New table `lifetime_deal_codes`:
- `code` (text, unique) — e.g. `LTD2026`
- `stripe_price_id` (text) — one-time price you'll provide
- `plan_slug` (text, default `'growth'`)
- `max_redemptions` (int, nullable = unlimited)
- `redemption_count` (int, default 0)
- `expires_at` (timestamptz, nullable)
- `is_active` (bool, default true)
- timestamps

New table `lifetime_deal_redemptions`:
- `code_id` → `lifetime_deal_codes.id`
- `user_id`, `email`, `stripe_customer_id`, `stripe_payment_intent_id`, `stripe_checkout_session_id`
- `amount_paid_cents`, `redeemed_at`

`subscriptions` table additions:
- `is_lifetime` (bool, default false)
- `lifetime_redemption_id` (uuid, nullable)
- (reuse existing `plan_type='growth'`, `status='active'`, `billing_interval='lifetime'`, `current_period_end=null`, `stripe_subscription_id=null`)

RLS: codes are read-only via a SECURITY DEFINER RPC `validate_lifetime_code(code text)` returning `{valid, reason, plan_slug, price_id}` so the public landing page can check without exposing the table. Redemptions: insert via service role only (webhook); user can select their own.

### 2. Stripe

- One-time **Price** (mode=`payment`, not subscription). User provides the `price_id`.
- Stored in `lifetime_deal_codes.stripe_price_id` (not in `stripe-prices.ts`) so we can run multiple campaigns later.

### 3. Edge functions

**New: `validate-lifetime-code`** (public, no auth)
- Input: `{ code }`
- Calls RPC, returns whether code is valid + active + not expired + under cap.

**New: `create-lifetime-checkout`** (auth required — user must have just signed up)
- Input: `{ code }`
- Re-validates code server-side (defense in depth).
- Creates Stripe Checkout Session with `mode: 'payment'`, the code's `price_id`, `client_reference_id: user.id`, and `metadata: { lifetime_code: code, lifetime_code_id, user_id }`.
- Success URL: `/subscription/success?session_id=...&lifetime=1`.

**Modify: `stripe-webhook`** — handle `checkout.session.completed` when `mode === 'payment'` AND metadata has `lifetime_code_id`:
1. Re-check code is still valid and under cap (transactional `UPDATE … WHERE redemption_count < max_redemptions RETURNING *` to atomically claim a slot). If full → refund the charge via Stripe API and log.
2. Insert `lifetime_deal_redemptions` row.
3. Upsert `subscriptions` row: `plan_type='growth'`, `status='active'`, `is_lifetime=true`, `billing_interval='lifetime'`, `project_limit` from `pricing_tiers`, `stripe_subscription_id=null`, `current_period_end=null`.
4. `syncOrganizationTier(userId, 'growth')`.
5. Send confirmation email.

Also guard the existing subscription branches so they never overwrite a row where `is_lifetime=true` (e.g. if user later clicks something) — `customer.subscription.deleted` and `.updated` should skip rows where `is_lifetime=true`.

### 4. Frontend

**New page `/lifetime`** (public, in `PublicLayout`):
- Reads `?code=` from URL.
- On mount, calls `validate-lifetime-code`.
- If invalid/expired/used-up → friendly "This offer isn't available" state with CTA to regular `/pricing`.
- If valid → marketing page describing the Growth lifetime deal (price, what's included, "one-time payment, yours forever") with primary CTA **"Claim Lifetime Deal"**.
- CTA flow:
  - If logged out → opens signup form (reuse `AuthForm` in dialog or redirect to `/auth?mode=signup&ltd=CODE`). Persist `lifetime_code` in `localStorage` (key `lifetime_deal_code`) so it survives email confirmation.
  - On `SIGNED_IN` (in `AuthProvider`), if `lifetime_deal_code` is present AND user has no existing paid subscription → call `create-lifetime-checkout` and redirect to Stripe. Clear the key.
  - If logged in already (existing user) → show "Lifetime deal is for new accounts only" message with link to `/subscription` for normal upgrades.

**`SubscriptionSuccess.tsx`**: when `?lifetime=1`, render lifetime-specific copy ("You're a Growth member forever 🎉") and skip the "next billing date" line.

**Subscription/billing UI** (`/subscription`): when `is_lifetime=true`, replace "Manage billing" / "Cancel" controls with a "Lifetime member" badge and hide upgrade-to-Growth options. Hide Stripe customer-portal CTA since there's no recurring sub.

**Marketing pricing page**: no change. The lifetime deal is invite-only via direct link.

### 5. Admin (lightweight, optional in this pass)

Add a small section in `/admin` to:
- Create/disable lifetime codes
- View redemptions per code
This can be a follow-up if you'd rather ship the buyer flow first. Plan includes the schema so admin UI is purely additive later.

### 6. Edge cases handled

- **Race on last redemption** — atomic `UPDATE … RETURNING` claims the slot in the webhook; if it fails, we refund via Stripe.
- **Existing user tries to redeem** — checkout function rejects if user already has a non-starter `subscriptions` row; landing page also blocks.
- **Refunds** — if a Stripe refund event arrives for a lifetime payment, downgrade the user to starter and mark `lifetime_deal_redemptions.refunded_at`. (`charge.refunded` handler added.)
- **Lifetime user adds team / hits Growth limits** — works automatically since `subscriptions.plan_type='growth'`.
- **Email confirmation delay** — `localStorage.lifetime_deal_code` survives the round-trip; `AuthProvider` triggers checkout on first `SIGNED_IN` post-signup.

### 7. Files to create / edit

Create:
- `supabase/migrations/<ts>_lifetime_deals.sql` (tables + RPC + RLS)
- `supabase/functions/validate-lifetime-code/index.ts`
- `supabase/functions/create-lifetime-checkout/index.ts`
- `src/pages/LifetimeDeal.tsx`
- `src/hooks/useLifetimeCode.ts`

Edit:
- `supabase/functions/stripe-webhook/index.ts` (payment-mode branch + guards on existing branches + `charge.refunded`)
- `src/App.tsx` (add `/lifetime` route)
- `src/components/AuthProvider.tsx` (consume `lifetime_deal_code` like `selected_plan`)
- `src/pages/SubscriptionSuccess.tsx` (lifetime variant)
- `src/pages/Subscription.tsx` / billing UI (lifetime badge, hide cancel)

### Open items you'll provide

- Stripe one-time **Price ID** for the Lifetime Growth product
- Initial code string + cap (e.g. `LTD2026`, max 100 redemptions, expires when?)
- Final marketing copy / price displayed on `/lifetime`

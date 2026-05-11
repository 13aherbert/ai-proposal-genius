# Standardize plan tiers — remove "Pro"

Canonical plans going forward: **Starter** (free), **Growth**, **Business**, **Enterprise**. Everywhere `pro` appears in UI copy, types, or comparisons it must be replaced or normalized to `business` (its closest equivalent — both `GatedFeature` and `use-pricing-tier` already map `pro → business`).

## 1. Type definitions & shared constants

- `src/types/subscription.ts` — drop the `pro: 120` entry from `SUBSCRIPTION_PLAN_LIMITS`. Confirm `business: 120` exists; if not, add it.
- `src/components/subscription/TierBadge.tsx` — remove `'pro'` from `TierType`, `TIER_STYLES`, and `TIER_LABELS`. Keep the silent `pro → business` normalization for any legacy data still flowing in.
- `src/components/subscription/GatedFeature.tsx` and `GatedFeatureModal.tsx` — remove `'pro'` from `RequiredTier` union, `TIER_LEVELS`, `TIER_PRICES`, and `TIER_LABELS`. Business covers what Pro used to.
- `src/components/subscription/UsageProgressBanner.tsx` — drop the `pro: "Pro Plan"` label and the `plan === "pro"` early-return (let `business` flow through the existing branch).
- `src/hooks/subscription/feature-access.ts` — keep `normalizePlanType` mapping legacy `pro` → `business` (defensive for old DB rows) but remove any UI surface that still calls it `Pro`.

## 2. UI copy

- `src/components/account/SubscriptionCard.tsx` — replace the `'pro' → 'Pro Plan'` switch case, the `Upgrade to Pro` button copy, and the Pro-only downgrade branch with Business equivalents.
- `src/pages/SubscriptionSuccess.tsx` — replace `'pro' → 'Pro Plan'` label and the `|| 'pro'` fallback (default to `'starter'`).
- `src/components/organization/SubscriptionManager.tsx` — rename the `pro` tier card to `business` ($499) and remove the duplicate `business` card if both exist (verify when editing).
- `src/components/organization/ApiDocumentation.tsx` — change "Pro Plan" rate-limit row label and the `subscription_tier: 'pro'` example payload to `business`.
- `src/components/blocks/faq.tsx` — rewrite the two FAQ entries that mention "Pro" to reference Growth/Business.
- `src/docs/KnownLimitations.md`, `src/docs/TroubleshootingGuide.md`, `src/docs/UserOnboardingGuide.md`, `src/docs/EnvironmentVariables.md` — replace "Pro plan / Pro" mentions with the correct tier (Growth for evaluation, Business for higher limits). Update the `VITE_MOCK_SUBSCRIPTION=pro` example to `business`.

## 3. Project-limit hooks

- `src/hooks/use-projects.ts` and `src/hooks/use-project-limits.ts` — remove the `planType === 'pro'` branches that read `SUBSCRIPTION_PLAN_LIMITS.pro`. Falling through to the existing `business` branch covers users that get migrated. (Defensive normalization in `feature-access.ts` already maps `pro → business`.)

## 4. Routing / gating

- `src/components/ProtectedRoute.tsx` — update the two checks that allow access only when `plan_type === 'pro'` to use `business` (and `enterprise`).

## 5. Admin & dev tools

- `src/pages/admin/components/UserSubscriptionManager.tsx` — change the `plans` array from `['trial','starter','pro']` to `['starter','growth','business','enterprise']` and update the badge label logic accordingly.
- `src/components/development/TestingPanel.tsx` — extend `SubscriptionPlan` to the four canonical tiers and update the limit map (`growth: 30`, `business: 120`, `enterprise: -1`).
- `src/scripts/fix-user-subscription.ts` — retarget the script copy/log strings to "Business" (or parameterize the tier).

## 6. Edge functions

- `supabase/functions/fetch-opportunity-documents/index.ts` — replace the `["pro","enterprise","white_label"]` allowlist with `["business","enterprise"]` (and keep `growth` if currently allowed elsewhere — verify against `_shared/subscription-limits.ts`). Update the error message to "Business or Enterprise subscription required".
- `supabase/functions/public-api/index.ts` — same allowlist swap for API access; update the 403 message to "Business or Enterprise subscription required".
- `supabase/functions/search-opportunities/index.ts` — drop `"pro"` from the allowlist (keep the others).
- `supabase/functions/admin-update-subscription/index.ts` — keep the `'pro' → 'business'` migration mapping for incoming legacy values, but ensure the function does not re-emit `'pro'`.
- `supabase/functions/_shared/subscription-limits.ts` — remove the `pro: { projects: 120 }` row; keep `business`.

## 7. Database migrations

Old migrations contain `'pro'` literals — those are historical and stay as-is. **No new migration is part of this UI/copy pass.** If the user wants the database normalized too, that becomes a separate follow-up that updates `subscription` rows where `plan_type = 'pro'` to `'business'` and adds a CHECK constraint limiting `plan_type` to the four canonical values.

## Out of scope

- DB data migration of any existing `plan_type = 'pro'` rows (call out separately if desired).
- Stripe price IDs in `src/config/stripe-prices.ts` (verify it has no `pro` entry; if it does, flag it).
- Marketing/legal pages outside the files listed above — none currently reference Pro per the search.

## Verification

- `rg -ni "\bpro plan\b|'pro'|\"pro\"" src/ supabase/functions/` should return only (a) the legacy normalization in `feature-access.ts` / `admin-update-subscription` and (b) historical SQL migration files.
- Spot-check Pricing page, Subscription page, GatedFeature modal, and Account → Subscription card render with Starter/Growth/Business/Enterprise only.

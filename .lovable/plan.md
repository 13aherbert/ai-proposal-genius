

## Plan: Fix Subscription Tier System for Enterprise Accounts

### Root Causes

1. **No org-level tier sync**: The `stripe-webhook` and `check-subscription` edge functions update the `subscriptions` table but **never update `organizations.subscription_tier`**. So even after a Stripe upgrade to enterprise, the org stays at `'starter'`.

2. **`UsageProgressWidget` doesn't handle enterprise**: Its `currentPlan` prop type is `"starter" | "growth" | "business"` — no enterprise option. Dashboard line 162 explicitly maps enterprise to `'starter'`: `(['starter', 'growth', 'business'].includes(planType) ? planType : 'starter')`. This causes "0 of 6 projects" display.

3. **No unlimited display**: The widget always shows `X of Y used` with a progress bar. For enterprise (-1 limit), it should show "Unlimited" instead.

### Changes

#### 1. Stripe Webhook — Sync `organizations.subscription_tier`
**File**: `supabase/functions/stripe-webhook/index.ts`

After each subscription upsert/update (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted), look up the user's `current_organization_id` from `profiles` and update `organizations.subscription_tier` to match `planSlug`. For enterprise, also set `sso_enabled = true`, `api_enabled = true`, `max_users = -1`, `max_projects = -1`.

#### 2. `check-subscription` — Sync org tier on read
**File**: `supabase/functions/check-subscription/index.ts`

After fetching the subscription, check if `organizations.subscription_tier` matches. If not, update it. This catches any existing mismatches on next login.

#### 3. Fix `UsageProgressWidget` for enterprise
**File**: `src/components/subscription/UsageProgressWidget.tsx`

- Add `"enterprise"` to the `currentPlan` type
- When plan is enterprise or `projectLimit === -1`: show "Enterprise Plan — Unlimited Projects" instead of a progress bar, no upgrade CTA

#### 4. Fix Dashboard enterprise plan mapping
**File**: `src/pages/Dashboard.tsx`

- Remove the filter that maps enterprise to `'starter'` on line 162
- Pass `planType` directly including `'enterprise'`
- Hide `UsageProgressWidget` entirely for enterprise, OR let the widget handle it (option above)

#### 5. Data migration — Fix existing mismatched accounts
**File**: New Supabase migration

SQL to find all users whose `subscriptions.plan_type` is enterprise/business/growth but whose org's `subscription_tier` is wrong, and update the org to match. Specifically for enterprise: set `subscription_tier = 'enterprise'`, `max_users = -1`, `max_projects = -1`, `sso_enabled = true`, `api_enabled = true`.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook/index.ts` | Add org tier sync after subscription changes |
| `supabase/functions/check-subscription/index.ts` | Add org tier sync on read |
| `src/components/subscription/UsageProgressWidget.tsx` | Handle enterprise plan (unlimited display, no upgrade CTA) |
| `src/pages/Dashboard.tsx` | Remove enterprise→starter fallback on line 162 |
| New Supabase migration | Fix existing mismatched org tiers |


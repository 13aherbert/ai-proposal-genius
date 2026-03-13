

## Plan: Update Pricing Tiers Schema and Align All Limit Constants

### 1. Database Migration — Update `pricing_tiers` table and seed data

Create a new migration that:
- Adds `is_popular BOOLEAN NOT NULL DEFAULT false` and `display_order INTEGER NOT NULL DEFAULT 0` columns to `pricing_tiers`
- Updates existing tier rows with new values (projects_limit: starter 12→6, features updated per spec)
- Sets `is_popular = true` for Business, `display_order` = 1/2/3/4
- Updates the `get_plan_limits` DB function to return correct values: starter→6, growth→36, business→120, enterprise→-1
- Updates the `check_project_limit` DB function to use new plan names (growth/business/enterprise) and correct limits instead of old basic/pro/trial references
- Migrates existing subscriptions: `UPDATE subscriptions SET project_limit = 6 WHERE plan_type = 'starter'` and `UPDATE subscriptions SET plan_type = 'growth', project_limit = 36 WHERE plan_type IN ('basic', 'pro')`

### 2. Frontend constants — `src/types/subscription.ts`

- Update `SUBSCRIPTION_PLAN_LIMITS` to the new 4-tier structure: `{ starter: 6, growth: 36, business: 120, enterprise: -1 }`
- Update `DEFAULT_STARTER_SUBSCRIPTION.project_limit` from 3 to 6
- Update `toSubscriptionPlan` default project_limit fallback from 3 to 6

### 3. Edge function shared limits — `supabase/functions/_shared/subscription-limits.ts`

- Update starter projects from 12 to 6

### 4. Feature access helpers — `src/hooks/subscription/feature-access.ts`

- Update `normalizePlanType` to recognize `growth`, `business`, `enterprise` (not just starter/pro)
- Update `getProjectLimitForPlan` and `getSafeProjectLimit` to handle all 4 tiers with correct limits

### 5. Test mode — `src/hooks/subscription/test-mode.ts`

- Update plan type union to `'starter' | 'growth' | 'business'` (replacing basic/pro)
- Update limit lookups to use new tier names

### 6. Check-subscription edge function — `supabase/functions/check-subscription/index.ts`

- Update plan limit correction logic to use new tier names (growth/business/enterprise instead of pro/trial)
- Remove the `trial` plan type references; default new users to `starter`
- Update `SUBSCRIPTION_PLAN_LIMITS` usage (it's imported from shared, so mostly just fix the plan name references like `.pro` → use `getProjectLimit('growth')`)

### 7. Admin update subscription — `supabase/functions/admin-update-subscription/index.ts`

- Update the switch/case to handle `growth`, `business`, `enterprise` instead of `pro`/`trial`
- Use `getProjectLimit()` helper from shared limits instead of direct property access

### 8. Pricing tier hook — `src/hooks/use-pricing-tier.ts`

- Update slugMap: remove `basic→growth` and `pro→business` aliases (keep for backward compat), add `trial→starter`
- Keep existing logic intact

### 9. UI components referencing old limits

- `src/components/subscription/SubscriptionPlans.tsx` — update feature lists and price displays to match new tiers (starter=6 projects, plan names)
- `src/components/subscription/PlanComparisonModal.tsx` — update PLANS array prices and FEATURES rows (starter projects "6" not "12")
- `src/components/subscription/LoadingState.tsx` — update fallback project_limit from 3 to 6

### 10. Subscription features hook — `src/hooks/use-subscription-features.ts`

- Update the starter project_limit mismatch check (line 82: `!== 10` → `!== 6`)

### Files touched
- **New migration**: `supabase/migrations/[timestamp]_update_pricing_tiers_structure.sql`
- **Modified**: `src/types/subscription.ts`, `supabase/functions/_shared/subscription-limits.ts`, `src/hooks/subscription/feature-access.ts`, `src/hooks/subscription/test-mode.ts`, `supabase/functions/check-subscription/index.ts`, `supabase/functions/admin-update-subscription/index.ts`, `src/hooks/use-pricing-tier.ts`, `src/components/subscription/SubscriptionPlans.tsx`, `src/components/subscription/PlanComparisonModal.tsx`, `src/components/subscription/LoadingState.tsx`, `src/hooks/use-subscription-features.ts`


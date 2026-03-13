

## Plan: Extend useSubscription with Unlimited User Support

### Overview
Add tier-aware user limit functions to the existing subscription system by creating a new composable hook that fetches from the `pricing_tiers` table and exposes `canAddUser`, `getUserLimitDisplay`, and `getUpgradeValueProp`.

### Approach
Rather than replacing the existing `useSubscription` hook (used in 35+ files), create a new **`usePricingTier`** hook that:
1. Fetches the current user's tier from `pricing_tiers` based on the subscription's `plan_type`
2. Accepts a `teamSize` count (from org members)
3. Exposes the requested helper functions

Then extend the existing `useSubscriptionFeatures` hook to re-export these helpers so consuming components have a single import point.

### Changes

**1. New file: `src/hooks/use-pricing-tier.ts`**
- Define `Tier` and `PricingTierResult` interfaces
- Fetch matching row from `pricing_tiers` table using the subscription's `plan_type` as slug
- Cache result in state, refetch when subscription changes
- Implement `canAddUser(teamSize)`, `getUserLimitDisplay()`, `getUpgradeValueProp()`
- All functions treat `users_limit === -1` as unlimited

**2. Update: `src/hooks/use-subscription-features.ts`**
- Import and compose `usePricingTier` internally
- Re-export `canAddUser`, `getUserLimitDisplay`, `getUpgradeValueProp` from the features result
- Update `SubscriptionFeaturesResult` type accordingly

**3. Update: `src/hooks/subscription/subscription-features-types.ts`**
- Add `canAddUser`, `getUserLimitDisplay`, `getUpgradeValueProp` to `SubscriptionFeaturesResult`
- Add `Tier` type export

### Key logic

```text
canAddUser(teamSize):
  tier.users_limit === -1 → true (unlimited)
  teamSize < tier.users_limit → true
  else → false

getUserLimitDisplay():
  users_limit === -1 → "Unlimited team members"
  else → "{n} user(s)"

getUpgradeValueProp():
  slug === 'starter' → "Add unlimited team members"
  else → "Get more projects and features"
```

### Files touched
- **New**: `src/hooks/use-pricing-tier.ts`
- **Modified**: `src/hooks/subscription/subscription-features-types.ts`, `src/hooks/use-subscription-features.ts`


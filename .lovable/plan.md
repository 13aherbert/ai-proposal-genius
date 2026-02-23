

## Fix: Pro User Blocked from Opportunities Page

### Root Cause

The `SubscriptionProvider` has a race condition identical to the Knowledge Base wizard issue. In `fetchSubscriptionData()` (lines 148-163):

```
if (!organization?.id) {
  if (!orgLoading) {
    // Creates a STARTER subscription, overwriting the real pro plan
    const defaultSub = await createDefaultSubscription(...);
    return defaultSub;
  }
  setIsLoading(false);
  return;
}
```

When `useCurrentOrganization` briefly reports `loading: false` with `organization: null` (before the async chain resolves), the provider assumes there is no organization and creates a fake **starter** subscription. This starter subscription gets stored in both state and localStorage, so the Opportunities page sees `plan_type: 'starter'` instead of `'pro'` and shows the upgrade wall.

Even after the organization loads and the real `pro` subscription is fetched, the localStorage cache from the starter fallback can persist and be used on subsequent page loads.

### Fix

**File: `src/hooks/subscription/providers/SubscriptionProvider.tsx`**

Change `fetchSubscriptionData()` so it does NOT create a default subscription when the organization is simply not yet available. Instead, it should wait (keep `isLoading: true`) until the organization is definitively loaded.

Replace lines 148-164:
```typescript
// Current (broken):
if (!organization?.id) {
  if (!orgLoading) {
    const defaultSub = await createDefaultSubscription(...);
    return defaultSub;
  }
  setIsLoading(false);
  return;
}
```

With:
```typescript
// Fixed:
if (!organization?.id) {
  // If org is still loading, keep isLoading true and wait
  if (orgLoading) {
    return; // useEffect will re-trigger when orgLoading changes
  }
  // Org finished loading but is null -- fall through to check
  // the user's individual subscription table as a fallback
  console.log('No organization found, checking user subscription table');
  const { data: userSub, error: userSubError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (userSub) {
    const subscriptionPlan: SubscriptionPlan = {
      subscription_id: userSub.subscription_id,
      user_id: userId,
      status: userSub.status as SubscriptionPlan['status'],
      plan_type: userSub.plan_type,
      current_period_end: userSub.current_period_end,
      project_limit: userSub.project_limit,
      features: (userSub.features as Record<string, any>) || {},
      stripe_customer_id: userSub.stripe_customer_id,
      stripe_subscription_id: userSub.stripe_subscription_id,
      created_at: userSub.created_at,
      updated_at: userSub.updated_at,
      cancel_at_period_end: userSub.cancel_at_period_end || false,
    };
    setSubscription(subscriptionPlan);
    storeSubscriptionDataLocally(subscriptionPlan);
    return;
  }

  // Only create a default starter if there's truly no subscription anywhere
  const defaultSub = await createDefaultSubscription(
    userId, setSubscription, undefined, setIsLoading, setHasCheckedSubscription
  );
  return defaultSub;
}
```

This ensures:
1. While the org is loading, `isLoading` stays `true` (no premature render)
2. If org loading completes but no org exists, we fall back to the `subscriptions` table (where the user's actual `pro` plan lives)
3. Only if both tables have no data do we create a default starter plan

### Files Summary

| File | Change |
|---|---|
| `src/hooks/subscription/providers/SubscriptionProvider.tsx` | Replace the organization-null fallback to check `subscriptions` table instead of immediately creating a starter plan |

### Why This Fixes It

The user's pro subscription exists in both `subscriptions` (user-level) and `organization_subscriptions` (org-level) tables. The current code never reaches the org-level query because the organization briefly appears null, triggering the starter fallback. With this fix, even if the org is null, we check the user-level subscription table before defaulting to starter.

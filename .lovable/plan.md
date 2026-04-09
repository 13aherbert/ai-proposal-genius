

## Diagnosis: Opportunity Page Flashing (Infinite Re-render Loop)

### Root Cause

The subscription data from the database shows `plan_type: "pro"` with `project_limit: 30`. Here's the chain:

1. `normalizePlanType("pro")` maps to `"business"` (legacy mapping)
2. `getProjectLimitForPlan("business")` returns `120` (from `SUBSCRIPTION_PLAN_LIMITS.business`)
3. The DB has `project_limit: 30`, so `30 !== 120` is **always true**
4. This triggers `checkSubscription()` on line 79, which re-fetches the subscription
5. Re-fetch returns the same data (`project_limit: 30`), triggering the effect again
6. **Infinite loop**: fetch → mismatch → refresh → fetch → mismatch → refresh...

The console logs confirm this: "Detected incorrect project limit. Refreshing subscription data." and "Fetching subscription data from API" repeat endlessly, causing the entire page to flash.

### Fix

**File: `src/hooks/use-subscription-features.ts`** (lines 75-80)

Remove the "incorrect project limit" auto-refresh logic entirely. The DB value is the source of truth — the client-side hardcoded map should not override it. The `getSafeProjectLimit` function already handles returning a sensible limit based on plan type.

```typescript
// REMOVE these lines (75-80):
const expectedLimit = getProjectLimitForPlan(normalizedPlanType);
if (subscription.project_limit !== expectedLimit) {
  devLog("Detected incorrect project limit. Refreshing subscription data.");
  checkSubscription();
}
```

Additionally, the `devLog` function on line 42 calls `setLogCount` which itself triggers re-renders. Replace it with a simple `console.log` behind a ref-based counter to avoid contributing to the render churn.

### Files Changed

1. **`src/hooks/use-subscription-features.ts`** — Remove the project limit mismatch check (lines 75-80) and fix `devLog` to not call setState


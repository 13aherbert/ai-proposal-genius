

## Fix: Pro Users Blocked from Opportunities Page

### Root Cause
The Opportunities page (`src/pages/Opportunities.tsx`) does not check whether the subscription data has finished loading before deciding to show the lock screen.

When the page first renders:
1. `useSubscription()` returns `{ subscription: null, isLoading: true }`
2. `normalizePlanType(null?.plan_type)` returns `'trial'`
3. `determineFeatureAccess('opportunity_search', 'trial')` returns `false`
4. The page immediately renders the "Pro Feature" lock/upgrade screen

Even though the subscription later loads with `plan_type: 'pro'`, by that point the lock screen is already shown. In some cases (e.g., navigating directly to `/opportunities`), the component may not re-render properly, leaving the user stuck on the lock screen.

### Fix

**File:** `src/pages/Opportunities.tsx`

1. Destructure `isLoading` from `useSubscription()` alongside `subscription`
2. Before the `if (!hasPro)` check, add a loading guard: if `isLoading` is true, show a spinner/skeleton instead of the lock screen
3. Only render the lock screen after loading is complete and the user truly lacks Pro access

```text
Before (current logic):
  subscription loaded? --NO--> show lock screen (WRONG)
  subscription loaded? --YES, trial--> show lock screen
  subscription loaded? --YES, pro--> show search page

After (fixed logic):
  still loading? --YES--> show loading spinner
  subscription loaded, trial? --> show lock screen  
  subscription loaded, pro? --> show search page
```

### Technical Detail
- No database or edge function changes needed
- The subscription data for this user is correct in both tables (`subscriptions` and `organization_subscriptions` both show `plan_type: 'pro'`)
- The only change is adding a ~5-line loading guard in `Opportunities.tsx`

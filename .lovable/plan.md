

## Diagnosis: Projects, Account Settings, and Admin Dashboard Not Loading

### Three Distinct Root Causes Found

---

### Issue 1: `useUserRoles` Infinite Re-render Loop (Admin Dashboard)

**File**: `src/hooks/user-roles/index.ts`

The `useEffect` on line 87 has dependencies that include ALL the state variables it modifies: `isAdmin`, `isSystemAdmin`, `isUser`, `isCheckingRoles`, `roleCheckError`. Every time `checkRoles` completes and updates any of these states, the effect re-runs, clears the previous timeout, and schedules a NEW 1-second delayed check — creating an infinite loop.

Additionally, `isCheckingRoles` starts as `false` (line 22). Since `AdminLayout` checks `isCheckingRoles` first and then `isAdmin`, the user briefly sees "Admin Access Required" before the first role check even starts (delayed by 1 second).

**Fix**:
- Initialize `isCheckingRoles` to `true` so AdminLayout shows the spinner initially
- Remove state variables from the useEffect dependency array — only depend on `session` and `checkRoles`

### Issue 2: Subscription Provider Re-render Storm (All Pages)

**File**: `src/hooks/subscription/providers/SubscriptionProvider.tsx`

The `SubscriptionProvider` calls `supabase.auth.getSession()` independently (line 136) instead of using the session from `AuthProvider`. Additionally, its `fetchSubscriptionData` useCallback depends on `orgLoading` and `organization?.id`, and the useEffect on line 274 depends on all of those plus `fetchSubscriptionData` itself. Every org state change recreates `fetchSubscriptionData`, which retriggers the effect.

Combined with the `useSubscriptionWithFallback` wrapper in `use-subscription.tsx` (which adds 3 more useEffects that chain off each other), this creates ~25+ simultaneous "Using cached subscription data" / "Refreshing subscription data in background" calls that flood the network.

**Fix**:
- Pass `session` from `useAuth()` into `fetchSubscriptionData` instead of calling `supabase.auth.getSession()` independently
- Stabilize the useEffect dependencies — only react to meaningful changes (org ID changing, not orgLoading toggling)
- Add a `fetchedRef` guard to prevent duplicate fetches

### Issue 3: Organization Query Blocking Projects

**File**: `src/hooks/use-projects.ts`

The projects query at line 111-114 returns empty results when `organizationId === null`:
```typescript
if (organizationId === null) {
  return { data: [], totalCount: 0 };
}
```

If the organization query succeeds but the user's profile has no `current_organization_id`, projects are silently hidden — not stuck loading, but returning empty. This could appear as "not loading" if the user expects to see projects.

---

### Implementation Plan

**Step 1: Fix `useUserRoles` infinite loop and initial state**
- In `src/hooks/user-roles/index.ts`:
  - Change `isCheckingRoles` initial value from `false` to `true`
  - Remove `isAdmin, isSystemAdmin, isUser, isCheckingRoles, roleCheckError` from the useEffect dependency array on line 150
  - Only depend on `session?.user?.id` and `checkRoles`

**Step 2: Stabilize SubscriptionProvider**
- In `src/hooks/subscription/providers/SubscriptionProvider.tsx`:
  - Use `useAuth()` session instead of calling `supabase.auth.getSession()` at line 136
  - Add a `hasFetchedRef` to prevent re-fetching when dependencies change but org ID hasn't actually changed
  - Simplify the useEffect to only run when `organization?.id` changes (not on every `orgLoading` toggle)

**Step 3: Fix projects showing empty for null organization**
- In `src/hooks/use-projects.ts`:
  - When `organizationId === null`, fetch projects by `user_id` only (without org filter) as a fallback instead of returning empty

### Technical Details

```text
Render cycle (current, broken):
  Session loaded
    → useCurrentOrganization starts query
    → SubscriptionProvider sees orgLoading=true, returns early
    → Org query completes → orgLoading=false, org.id set
    → fetchSubscriptionData recreated (deps changed)
    → useEffect re-runs → fetchSubscriptionData called
    → setSubscription → re-render
    → useSubscriptionWithFallback effects chain
    → 25+ subscription fetches fire simultaneously

  useUserRoles:
    isCheckingRoles=false, isAdmin=false
    → AdminLayout shows "Access Required"
    → 1s delay → checkRoles → sets isCheckingRoles=true
    → useEffect re-runs (dep changed) → clears timeout → new 1s delay
    → infinite loop
```


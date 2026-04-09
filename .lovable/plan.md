

## Diagnosis: Projects Still Stuck Loading

### Root Causes Found

**Primary: Dual `useSubscription` hook conflict creating re-render storm**

There are TWO files exporting `useSubscription`:
- `src/hooks/use-subscription.ts` — standalone hook with its own state, fetching, and a `useEffect` loop
- `src/hooks/use-subscription.tsx` — wrapper around the SubscriptionProvider context

When components import `from "@/hooks/use-subscription"` (without extension), Vite resolves `.ts` before `.tsx`. So `RecentProjects.tsx` (line 7) gets the **standalone** hook, NOT the Provider-based one.

The standalone hook (`use-subscription.ts`) has a circular `useEffect` at line 191-198:
- It depends on `[session, checkSubscription]`
- `checkSubscription` is a `useCallback` that depends on `[session]` (line 112)
- Every `session` object reference change recreates `checkSubscription`, which re-triggers the effect
- `checkSubscription` calls `refreshSubscriptionInBackground` (line 64), which calls `setSubscription`, causing another render
- This creates the "Using cached subscription data" / "Refreshing subscription data in background" spam seen in logs (hundreds of times)

This re-render storm destabilizes the `useProjects` hook, which also depends on subscription-related state through `useProjectLimits`.

**Secondary: `useCurrentOrganization` query retry blocking projects**

If the organization query fails (e.g., RLS timeout due to the re-render storm overwhelming the connection), react-query retries 3 times with exponential backoff. During retries, `isLoading` stays `true`, keeping the projects query disabled (`enabled: !!user?.id && !orgLoading`).

### Fix Plan

**Step 1: Remove the duplicate standalone `use-subscription.ts` file**

Delete `src/hooks/use-subscription.ts` entirely. All imports of `@/hooks/use-subscription` will then resolve to `use-subscription.tsx`, which correctly uses the Provider context. This eliminates the re-render storm.

Update any code that relies on types or exports unique to the `.ts` file (like `Subscription`, `SubscriptionResponse` types) — move those to the `.tsx` file or a shared types file.

**Step 2: Stabilize `use-subscription.tsx` wrapper**

The `useSubscriptionWithFallback` wrapper in `use-subscription.tsx` has its own problematic effects:
- Line 66: Direct fetch on error creates cascading retries
- Line 136: Force refresh on error creates another retry chain

Simplify: remove the cascading error-recovery effects. The SubscriptionProvider already handles errors with cached data fallback. The wrapper should just pass through without adding retry storms.

**Step 3: Add safety timeout for `orgLoading` in `useProjects`**

Even after fixing the re-render storm, add a defensive timeout so that if `orgLoading` stays `true` for more than 5 seconds, bypass it and fetch projects without org filter. This prevents any future organization loading issue from permanently blocking projects.

### Files Changed

1. **Delete `src/hooks/use-subscription.ts`** — the standalone hook that conflicts with the Provider
2. **Edit `src/hooks/use-subscription.tsx`** — remove cascading error-recovery effects, re-export any needed types
3. **Edit `src/hooks/use-projects.ts`** — add orgLoading timeout fallback
4. **Edit `src/pages/RecentProjects.tsx`** — clean up unused subscription imports if needed


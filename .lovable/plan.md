

## Fix: Knowledge Base Wizard Flashing on Load

### Root Cause

The `useKnowledgeReadiness` hook has a race condition with the organization loading sequence:

1. `useCurrentOrganization` takes 3 async steps to load (get user, fetch profile, fetch org)
2. While `organization` is still `null`, `useKnowledgeReadiness` hits the early-return guard at line 50-52 and sets `isLoading = false` with zero entries
3. With `isLoading = false` and empty entries, the computed `missingEssential` contains all 6 categories and `isEmpty = true`
4. The Dashboard `useEffect` sees this false "empty" state and sets `showKBWizard = true`
5. Moments later the organization loads, the hook re-fetches real data, but the wizard already flashed

In short: the hook says "I'm done loading and the knowledge base is empty" before it even knows which organization to query.

### Fix

**File: `src/hooks/use-knowledge-readiness.ts`**

Change the early-return guard (lines 50-52) so that when the organization hasn't loaded yet, the hook keeps `isLoading = true` instead of reporting a false "done" state:

```
// Current (broken):
if (!session?.user?.id || !organization?.id) {
  setIsLoading(false);  // <-- falsely reports "done" with empty data
  return;
}

// Fixed:
if (!session?.user?.id) {
  setIsLoading(false);  // No user = genuinely not loading
  return;
}
if (!organization?.id) {
  return;  // Org still loading, keep isLoading = true
}
```

This single change means:
- No user session: correctly reports not loading (no data to show)
- User exists but organization still loading: keeps `isLoading = true`, so the Dashboard `useEffect` early-returns and never triggers the wizard
- Both user and org available: proceeds to fetch real data

No changes needed in `Dashboard.tsx` -- the existing guard `if (knowledgeReadiness.isLoading) return;` in the useEffect already handles this correctly once the hook reports the right loading state.

### Technical Detail

| File | Change |
|------|--------|
| `src/hooks/use-knowledge-readiness.ts` | Split the early-return guard: only set `isLoading(false)` when there's no user session; keep `isLoading = true` when organization is still loading |


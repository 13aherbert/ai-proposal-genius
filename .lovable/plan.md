

## Fix: Opportunity Search Spinner Stuck / No Results

### Root Cause Analysis

Two issues are causing the search to spin indefinitely:

**Issue 1: SAM.gov API timeout**
The SAM.gov API can take a long time to respond for broad searches (e.g., NAICS code only, no keyword). The edge function has no request timeout on the `fetch()` call, so if SAM.gov is slow (>60s), the Supabase Edge Function times out. When an edge function times out, `supabase.functions.invoke` may return an error that doesn't trigger the catch block properly, leaving `isSearching` stuck at `true`.

**Issue 2: No keyword → all results filtered out silently**
When a user searches with only a NAICS code and no keyword, the `rankByRelevance` function correctly returns all results (it skips ranking when keyword is empty). However, if SAM.gov returns results but they're slow, the user sees nothing for a long time.

### Fix Plan

**File: `supabase/functions/search-opportunities/index.ts`**

1. Add a timeout wrapper (15 seconds) around the SAM.gov and Grants.gov fetch calls using `AbortController`. If an API doesn't respond within 15s, abort and return empty results from that provider instead of hanging.

```typescript
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
```

2. Apply this to both `fetchSamGov` (line 73) and `fetchGrantsGov` (line 116) fetch calls.

3. Add try-catch around each provider call in the main handler so one failing provider doesn't crash the entire search.

**File: `src/hooks/use-opportunity-search.ts`**

4. Add a client-side timeout safety net: if the edge function doesn't respond within 30 seconds, abort and show an error toast. This prevents the spinner from getting stuck forever.

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
```

### Technical Details
- `AbortController` is supported in Deno edge functions
- The 15s per-provider timeout ensures the edge function completes well within Supabase's 60s limit
- The client-side 30s timeout is a safety net for any edge function issues
- Grants.gov POST requests also get the timeout treatment
- Error handling catches `AbortError` specifically to show "Search timed out" messaging


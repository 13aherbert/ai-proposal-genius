

## Fix: California Keyword Relevance + Search Progress Feedback

### Problem 1: California returns irrelevant results

The Apify CaleProcure scraper **does not support keyword filtering**. The logs prove it — searching "Video" returned "HVAC Replacement", "WEAPONS FIRING RANGE", etc. The scraper's `keyword` input is either ignored or doesn't work as expected. It simply returns all open opportunities.

**Fix**: After receiving results from the Apify scraper, apply keyword filtering in the edge function before returning results. Use the existing `scoreRelevance` function and filter out zero-score results for California specifically (since SAM.gov/Grants.gov handle keyword filtering server-side, but the scraper does not).

In `fetchCalifornia`, after normalizing items, filter by keyword:
```typescript
// Filter California results by keyword since the scraper doesn't support it
if (safeKeyword) {
  const keywords = safeKeyword.toLowerCase().split(/\s+/);
  opportunities = opportunities.filter(opp => {
    const text = `${opp.title} ${opp.department} ${opp.solicitation_number}`.toLowerCase();
    return keywords.some(w => text.includes(w));
  });
}
```

Also set `totalRecords` to filtered count, not raw item count.

### Problem 2: No progress indication during long searches

California searches take ~28s via Apify. The UI shows a generic spinner with no feedback about what's happening. Users can't tell if it's working or stuck.

**Fix**: Add a progress/status display during search that shows:
- Which providers are being queried
- Elapsed time
- An animated message like "Searching California eProcure... (scraper may take 20-30s)"

Changes:
1. **`src/hooks/use-opportunity-search.ts`**: Add `searchElapsed` state (updated every second during search) and `searchingProviders` state (list of provider names being queried, derived from the `source` param).

2. **`src/pages/Opportunities.tsx`**: Show a search progress panel when `isSearching` is true:
   - Provider badges showing which sources are being queried
   - Elapsed time counter
   - California-specific warning about scraper taking 20-30s
   - Progress bar (estimated: SAM ~2s, Grants ~2s, California ~25s)

3. **`src/components/opportunities/SearchProgressIndicator.tsx`** (new): A small component showing:
   ```
   ⏳ Searching...  [SAM.gov] [Grants.gov] [California eProcure ⚠️ ~25s]
   Elapsed: 12s
   ━━━━━━━━━━━━░░░░░░░░ (progress bar)
   ```

### Files to update
- `supabase/functions/search-opportunities/index.ts` — keyword filter in `fetchCalifornia`
- `src/components/opportunities/SearchProgressIndicator.tsx` — new component
- `src/hooks/use-opportunity-search.ts` — add elapsed timer + provider list state
- `src/pages/Opportunities.tsx` — render progress indicator during search


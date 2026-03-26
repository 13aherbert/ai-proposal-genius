
## Opportunity Search Audit: Findings and Fix Plan

### What I found
1. **The feature is being reached, but observability is too weak**
   - The org usage table shows recent `opportunity_searches` entries, so the edge function is being hit.
   - The current edge logs only show boot events, not enough detail to tell whether SAM.gov / Grants.gov are returning zero results, timing out, or rejecting parameters.

2. **The client and backend use different usage metric names**
   - Edge function writes `opportunity_searches`
   - UI reads/writes `opportunity_search`
   - This does not explain missing RFPs, but it does make usage/limits inconsistent.

3. **SAM.gov request construction is the most likely search-quality problem**
   - The function sends a generic `keyword` parameter and then ranks/filter results locally.
   - The current implementation does not clearly map user input to the provider’s supported search fields, and agency filtering for SAM.gov is happening after the API call instead of at the provider level.
   - This can easily produce weak or empty result sets even when matching notices exist.

4. **The UI hides why search failed**
   - “No results” looks the same whether:
     - providers timed out
     - providers returned 0
     - a filter combination was too restrictive
     - only one provider succeeded
   - That makes the tool feel broken even when the backend technically returned a response.

5. **The current timeout handling is incomplete**
   - Provider fetches have timeouts, but the client-side `AbortController` is not actually passed into `supabase.functions.invoke`, so it is only acting as a timer, not a real cancellation path.

### Plan
**Step 1: Add provider-level diagnostics**
- Instrument `search-opportunities` with structured logs for:
  - normalized search params
  - provider chosen
  - request URL/body shape (without secrets)
  - HTTP status
  - record counts returned
  - timeout / parse / API errors
- Return lightweight provider metadata in the response so the UI can distinguish:
  - success
  - timeout
  - api_error
  - no_results

**Step 2: Fix the provider query mapping**
- Refactor SAM.gov search parameter building so user inputs map to provider-supported fields instead of relying mostly on a loose `keyword` pass-through.
- Move agency filtering into the SAM.gov request where possible rather than post-filtering client-side.
- Keep NAICS, set-aside, date range, and ptype handling explicit and validated.
- Preserve the default `postedFrom`/`postedTo` behavior, but make the date window and provider query logic easier to reason about.

**Step 3: Improve relevance and empty-result behavior**
- Stop treating all empty results the same.
- Keep current ranking, but only use it when it improves ordering — not in a way that risks hiding legitimate provider matches.
- Add a clearer response contract so the UI can show:
  - “No matching RFPs found”
  - “SAM.gov timed out, showing partial results”
  - “Search filters may be too narrow”

**Step 4: Fix client behavior and messaging**
- Update `useOpportunitySearch` to handle provider metadata and surface more useful errors.
- Add a real empty state for filter-based searches.
- Change the default helper text on the page so it does not imply keyword is required when NAICS/agency/date-only searches are supported.
- Keep the spinner from feeling indefinite by using a deterministic client timeout path and clearer fallback messaging.

**Step 5: Clean up related inconsistencies**
- Standardize the metric name to one value everywhere (`opportunity_searches`).
- Verify pagination, total count display, and result rendering still work after response shape changes.
- Make sure saved opportunities and detail modal continue to work with the normalized results.

### Technical details
- Files likely affected:
  - `supabase/functions/search-opportunities/index.ts`
  - `src/hooks/use-opportunity-search.ts`
  - `src/pages/Opportunities.tsx`
  - `src/hooks/use-search-usage.ts`
  - possibly `src/components/opportunities/OpportunitySearchForm.tsx`
- Main goal:
  - first prove whether the issue is **provider query construction**, **provider timeout**, or **over-filtering**
  - then adjust the API integration so results are reliable again
- Based on the current audit, the highest-priority fixes are:
  1. provider diagnostics
  2. SAM.gov query mapping
  3. UI visibility into partial/no-result states
  4. usage metric mismatch cleanup

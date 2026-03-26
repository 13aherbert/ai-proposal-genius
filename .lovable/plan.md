
## Opportunity Finder Audit: Why NAICS 512110 is returning no results

### What I found
1. **The search is timing out before the app gets a response**
   - The session replay shows this exact sequence:
     - user clicks Search
     - button spins
     - after about **30 seconds**, the button resets
     - toast shows **“Search timed out. Try narrowing your search criteria.”**
     - page then shows **“No matching opportunities found”**
   - That means the UI is hitting its **client timeout fallback**, not receiving a completed search response.

2. **The UI is masking a timeout as “no results”**
   - In `use-opportunity-search.ts`, the 30s timer sets `isSearching` to false and shows a toast.
   - But it does **not** set a distinct “timed out” state.
   - In `Opportunities.tsx`, if `results.length === 0` and `providerStatuses` is empty, the UI falls back to **“No matching opportunities found”**.
   - So the current experience is misleading: the search likely **did not finish**, but the page looks like a valid zero-result search.

3. **NAICS-only searches are sending unnecessary provider requests**
   - The search function always calls **Grants.gov** unless the user explicitly switches source.
   - For a NAICS-only search like `512110`, Grants.gov is not a strong match and adds latency/noise.
   - This query should prioritize or default to **SAM.gov-only behavior** when only NAICS / SAM-specific filters are present.

4. **The SAM.gov integration needs verification against the current API contract**
   - Current code calls:
     `https://api.sam.gov/prod/opportunities/v2/search`
   - The current public documentation references:
     `https://api.sam.gov/opportunities/v2/search`
   - Even if the existing path still works in some cases, this is important enough to verify and normalize because it can affect reliability.

5. **The default date window may be filtering out expected results**
   - If the user doesn’t enter dates, the function silently applies **last 90 days only**.
   - So “I know there are RFPs for this NAICS code” can still produce zero results if matching notices are older than 90 days.
   - That may not be the main cause here because your replay showed a timeout, but it is still a real source of confusion.

6. **Observability is still too weak**
   - `search-opportunities` currently logs request shapes in code, but the runtime tools did not surface usable logs for the actual failing searches.
   - Without explicit response metadata for “request never completed” vs “provider returned 0”, debugging remains guesswork.

7. **There is also a separate usage-counting bug**
   - `src/pages/Opportunities.tsx` calls `incrementUsage()` on the client immediately after starting a search.
   - The edge function also records usage server-side.
   - This does not cause missing RFPs, but it should be cleaned up while touching this flow.

### Most likely root cause for 512110 specifically
The strongest evidence points to this chain:

```text
NAICS-only search
→ app calls both SAM.gov and Grants.gov
→ backend request does not complete within 30s
→ client timeout fires
→ UI shows timeout toast
→ UI then incorrectly renders “No matching opportunities found”
```

So the immediate problem is **not proven zero results from SAM.gov**.  
The immediate problem is that the request path is **not completing reliably**, and the UI is **misreporting timeout as empty results**.

### Fix plan
**Step 1: Make timeout vs empty-results explicit in the UI**
- Add a dedicated search state such as:
  - `idle`
  - `loading`
  - `success`
  - `empty`
  - `timed_out`
  - `error`
- Update the Opportunities page so timed-out searches never render as “No matching opportunities found”.

**Step 2: Optimize provider selection for NAICS-only searches**
- If the search contains only SAM-specific filters like:
  - `naicsCode`
  - `ptype`
  - `setAside`
  - possibly agency
- then either:
  - automatically query **SAM.gov only**, or
  - show a strong source recommendation and default to SAM.gov for that case.
- This should materially reduce unnecessary latency.

**Step 3: Verify and normalize the SAM.gov request**
- Update the SAM provider integration to match the current documented endpoint and supported params.
- Keep explicit mapping for:
  - `ncode`
  - `postedFrom`
  - `postedTo`
  - `deptname`
  - `ptype`
  - `typeOfSetAside`
- Add structured response logging around:
  - final request URL shape
  - HTTP status
  - response time
  - total records returned

**Step 4: Improve default search behavior for NAICS searches**
- Revisit the hidden 90-day default.
- Either:
  - widen the default date window for NAICS-only searches, or
  - surface the active date window clearly in the UI so users understand why older matches may not appear.

**Step 5: Strengthen backend diagnostics**
- Return richer `providerStatuses`, including whether a provider was:
  - queried
  - skipped
  - timed out
  - returned 0
  - succeeded with count
- Include overall search diagnostics in the response so the client can explain what actually happened.

**Step 6: Remove double counting of search usage**
- Keep usage recording in one place only, preferably the edge function.
- Remove the extra client-side increment from `Opportunities.tsx`.

### Files to update
- `supabase/functions/search-opportunities/index.ts`
- `src/hooks/use-opportunity-search.ts`
- `src/pages/Opportunities.tsx`
- possibly `src/components/opportunities/OpportunitySearchForm.tsx`

### Expected result after the fix
For a NAICS search like `512110`, users should get one of these clearly:
- actual SAM.gov matches,
- a visible partial-results state,
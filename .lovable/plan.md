

## Diagnosis

The response data from the network request confirms the problem. Searching "Video Production" returns results like "HOSE ASSY,MANIFOLD", "CIRCUIT BREAKER", "DEFLECTOR,DIRT AND", "ANTENNA" -- none containing the words "video" or "production" anywhere in the title or department.

The relevance scoring code IS deployed and running. However, it only **ranks** results -- it does not **filter** them. When SAM.gov's API returns 25 results that have zero relevance to the keyword (all scoring 0), they all appear with equal rank in arbitrary order. The user sees a wall of irrelevant results.

### Root Cause

SAM.gov's keyword search is broad and often returns results that don't match the keyword in the title or department fields visible to the user. The results may match on internal description text or metadata not exposed in the search response. The current system shows ALL results regardless of relevance score.

### Fix

**File:** `supabase/functions/search-opportunities/index.ts`

Modify `rankByRelevance()` to **filter out results with a relevance score of 0** when a keyword is provided. This removes results where neither the title nor department contains any of the search terms.

Additionally, expand scoring to also check `solicitation_number` and the `description` field in `raw_data` (if present) so borderline-relevant results aren't incorrectly filtered.

Changes to `scoreRelevance()`:
- Add scoring for `solicitation_number` matches (+15)
- Add scoring for `raw_data.description` text matches (+3 per word) -- this catches SAM.gov results where the keyword appears in the description URL/text but not the title

Changes to `rankByRelevance()`:
- After scoring, filter out any result with `score === 0` when a keyword is provided
- This ensures only results with at least some keyword relevance are shown

The result: searching "Video Production" will only show opportunities where "video" or "production" appears somewhere in the title, department, solicitation number, or description metadata. If SAM.gov returns nothing relevant, the user sees fewer (or zero) results rather than a misleading list of unrelated contracts.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/search-opportunities/index.ts` | Filter out score-0 results; expand scoring to solicitation number and raw_data description fields |


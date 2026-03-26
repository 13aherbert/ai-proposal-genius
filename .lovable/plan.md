
## Opportunity Search Audit Plan: API Keys and Endpoints

### What I verified
- The project does have a `SAM_GOV_API_KEY` runtime secret configured, so the immediate issue is not “missing secret.”
- The search edge function is calling:
  - `https://api.sam.gov/opportunities/v2/search`
  - `https://api.grants.gov/v1/api/search2`
- The current edge logs for `search-opportunities` only show boot/shutdown events, not the detailed request logs that the function code should emit during searches.
- That means we still do not have proof of what the live provider responses are: invalid key, endpoint mismatch, zero results, timeout, or runtime/deploy mismatch.

### Most likely problem
This no longer looks like a simple UI issue. The stronger possibilities are:
1. **SAM.gov request/endpoint mismatch at runtime**
2. **Invalid or rejected SAM key despite the secret existing**
3. **The deployed function is not the same code we inspected**
4. **The API is returning 0 with the current parameter mapping/date defaults**
5. **The UI is still not surfacing the real provider failure clearly enough**

### Plan
**Step 1: Add definitive provider diagnostics**
- Instrument the edge function so every search logs:
  - whether the SAM key exists and is non-empty
  - the exact endpoint path used
  - sanitized query params
  - HTTP status code
  - response time
  - returned `totalRecords`
  - a short sanitized error body for non-200 responses
- Never log the actual API key.

**Step 2: Verify and normalize the live SAM.gov integration**
- Confirm the correct supported SAM search endpoint/version for this project’s request format.
- Normalize all SAM URLs in the opportunity flow so search and detail fetches use a consistent, supported API base/version.
- Trim/sanitize the runtime SAM key before use in case whitespace or formatting is breaking auth.

**Step 3: Make invalid-key vs bad-endpoint vs zero-results explicit**
- Update provider status handling so the UI can distinguish:
  - `invalid_api_key`
  - `endpoint_error`
  - `timeout`
  - `no_results`
  - `partial_results`
- Replace generic “No matching opportunities found” when the real issue is provider/auth related.

**Step 4: Tighten NAICS-only search behavior**
- For NAICS-only searches like `512110`, force SAM-only behavior.
- If the first SAM query returns 0, retry once with a broader fallback strategy:
  - wider default date window
  - minimal restrictive params only
- This helps separate “truly no matches” from “query too narrow.”

**Step 5: Confirm the runtime path is actually executing**
- Verify the deployed edge function is the code currently in the repo.
- If logs still show only boot/shutdown after instrumentation, treat that as a deployment/runtime mismatch and correct the function packaging/deployment path.

**Step 6: Surface real diagnostics in the page**
- Show provider badges/messages such as:
  - “SAM.gov rejected the API key”
  - “SAM.gov returned 0 results for NAICS 512110”
  - “SAM.gov timed out”
  - “Showing partial results from Grants.gov only”
- Keep retry actions, but stop presenting provider failures as ordinary empty results.

### Files to update
- `supabase/functions/search-opportunities/index.ts`
- `src/hooks/use-opportunity-search.ts`
- `src/pages/Opportunities.tsx`
- possibly `supabase/functions/fetch-opportunity-documents/index.ts` for SAM URL consistency

### Expected result
After this pass, we will know exactly which of these is true:
- the SAM key is present but rejected
- the endpoint/path/version is wrong
- the function is not running the expected code
- the query mapping/date defaults are suppressing results
- or SAM is returning legitimate zero-result responses for the current request shape

That will let us fix the actual root cause instead of continuing to mask it as “no results.”

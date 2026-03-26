
Root-cause investigation plan for the persistent Opportunity Finder failure

What I verified
- The user’s auth/org setup looks valid:
  - profile has `current_organization_id`
  - organization membership is `active`
  - organization subscription is `pro` and `active`
- `SAM_GOV_API_KEY` exists as a configured secret.
- The client hook does explicitly send `Authorization: Bearer ...`.
- `search-opportunities` is configured with `verify_jwt = false`, so in-code token validation is expected and the current pattern is appropriate.
- The current runtime observability is still insufficient:
  - `supabase--edge_function_logs` returned no logs for `search-opportunities`
  - analytics edge logs also showed no recent function invocations for that path
  - this means we still do not have proof of what the live function is doing during the failing search

Most likely exact root causes
1. The search request is likely not reliably reaching/executing the deployed edge function
- There are no recent invocation logs for `search-opportunities`, despite the user reporting repeated searches.
- I also tested the function endpoint directly and got `401 Unauthorized`, which confirms the function is enforcing auth but does not prove the browser request is arriving correctly.
- Because logs are absent, there may be a deployment/runtime mismatch, request routing issue, or silent client-side failure before invocation.

2. The NAICS retry logic is currently invalid for SAM.gov
- The code retries NAICS-only searches with a 730-day window.
- SAM.gov’s documented API says `postedFrom` to `postedTo` may only span 1 year.
- So the retry path can produce invalid requests or provider errors even when the first request is fine.
- For NAICS searches, this is a concrete bug.

3. The search flow still depends on weak diagnostics for provider failures
- Even though the code logs provider request shapes, there is no reliable evidence those logs are appearing in runtime.
- Without that, the app cannot distinguish:
  - request never reached function
  - auth rejected
  - SAM rejected API key
  - SAM returned zero results
  - SAM timed out
  - invalid retry range caused failure

4. There may be a live deploy mismatch
- The repo code now includes explicit auth, provider statuses, and timeout logic.
- But runtime logs are not showing those codepaths.
- That strongly suggests the deployed function may not match the inspected source, or the function is failing before request-level logging is emitted.

Important code-level findings
- `use-opportunity-search.ts`
  - sends auth header correctly
  - has a 45s client timeout
  - can only render good error states if it receives a structured response
- `search-opportunities/index.ts`
  - auth logic is structurally reasonable
  - skips Grants.gov for NAICS-only searches
  - but the fallback retry uses a 730-day posted date range, which conflicts with SAM.gov docs
- `OpportunitySearchForm.tsx`
  - passes NAICS raw input through; edge function sanitizes to 6 digits, which is fine for `512110`

What I now understand about the failure
```text
User searches NAICS 512110
→ client appears to spin
→ we do not have runtime proof the deployed function is actually executing the expected code
→ if it does execute, the first SAM query may return 0 or timeout
→ the retry then uses an out-of-spec 2-year date range
→ result may degrade into provider error / timeout / empty response
→ UI cannot fully explain the true failure because runtime diagnostics are missing
```

Recommended next implementation steps
1. Prove invocation first
- Add guaranteed top-level structured logging at function entry and before every return path.
- Include request id, auth phase result, and whether provider calls were reached.
- Goal: confirm whether the live function is being invoked at all.

2. Remove the invalid SAM retry strategy
- Replace the 730-day retry with a retry that stays within SAM’s 1-year max range.
- If broader discovery is needed, use a segmented strategy:
  - last 365 days
  - then prior 365-day segment in a second request
- Do not send a single >1-year posted date window.

3. Add phase-level response diagnostics
- Return sanitized diagnostics to the client:
  - `phase: auth | org_check | provider_fetch | completed`
  - provider HTTP statuses
  - actual date window used
  - whether fallback retry ran
- This will stop “still broken” from being opaque.

4. Verify deployed/runtime parity
- Confirm the deployed `search-opportunities` function matches the current repo version.
- If not, redeploy or force a no-op code change to refresh the deployment artifact.

5. Test the exact NAICS flow directly
- After logging is fixed, test:
  - `512110` with default dates
  - `512110` with explicit 1-year range
  - `512110` source=`sam_gov`
- Compare runtime provider statuses before changing broader logic.

Technical details
- Confirmed from SAM docs:
  - endpoint `https://api.sam.gov/opportunities/v2/search` is valid
  - `postedFrom` and `postedTo` are mandatory
  - allowed range between them is 1 year
- Current bug in code:
```ts
const retryResult = await fetchSamGov(body, samApiKey, 730);
```
- This is incompatible with the SAM API contract and is the clearest concrete defect I found.
- Secondary concern: absence of runtime invocation logs is too strong to ignore and must be validated before assuming provider-only failure.

Files that should be touched next
- `supabase/functions/search-opportunities/index.ts`
- optionally `src/hooks/use-opportunity-search.ts`
- optionally `src/pages/Opportunities.tsx`

Expected outcome after the next pass
- We will know definitively whether the failure is:
  - invocation/deployment mismatch
  - auth rejection
  - invalid SAM retry window
  - API key rejection
  - provider timeout
  - or legitimate zero-result behavior
- Right now, the strongest exact root cause is a combination of:
  - missing reliable live invocation diagnostics
  - and an invalid 730-day SAM fallback request in the NAICS path

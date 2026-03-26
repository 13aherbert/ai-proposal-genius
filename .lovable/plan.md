
Exact conclusion from the evidence:

1. The failure is not currently at SAM.gov.
- The code is using the requested endpoint: `https://api.sam.gov/opportunities/v2/search`.
- `SAM_GOV_API_KEY` exists.
- The search function code is wired to send the bearer token and to call SAM only for NAICS-only searches.

2. The failing searches are not reaching the `search-opportunities` edge function during the observed failure window.
I can say this confidently because all of these are true at the same time:
- `search-opportunities` edge logs show no invocation logs, only old shutdown events.
- Edge analytics show no recent requests for that function.
- The client network snapshot contains no function call to `functions/v1/search-opportunities`.
- `organization_usage_metrics` has no fresh `opportunity_searches` row during the reported failing session.

That means the timeout/no-results behavior the user sees is happening before the deployed search function executes.

3. The exact failure boundary is now narrowed to the client/runtime path before the outbound function request.
The likely code boundary is:
```text
User submits form
→ handleSearch()
→ useOpportunitySearch.search()
→ supabase.functions.invoke("search-opportunities", ...)
→ expected network request never materializes
```

4. There is also a separate confirmed edge-function failure in the app:
- `get-user-roles` has a boot-time syntax error:
  `Identifier 'supabaseUrl' has already been declared`
- This is caused by the duplicate declaration inside `supabase/functions/get-user-roles/index.ts`.
- AuthProvider triggers this function in the background on auth changes.
- I cannot yet prove this is the direct blocker for opportunity search, but it is a real runtime defect in the same auth/session path and should be treated as high priority.

What I now understand with certainty
```text
The Opportunity Finder problem is not currently “SAM returned 0 results.”
The request is failing before search-opportunities is invoked.
So changing SAM query params alone will not resolve the user-facing timeout.
```

Recommended next implementation plan

Step 1: Instrument the client invocation boundary
- Add logs/state around:
  - form submit
  - `handleSearch`
  - immediately before `supabase.functions.invoke`
  - immediately after invoke resolves/rejects
- Goal: prove whether the promise is never started, never resolves, or throws before network dispatch.

Step 2: Remove the broken auth-side noise
- Fix `supabase/functions/get-user-roles/index.ts` duplicate `supabaseUrl` declaration.
- This will restore a broken background auth dependency and reduce false signals while debugging search.

Step 3: Add a direct fallback request path for diagnosis
- Temporarily test the same search using a direct `fetch` to the function URL with the same bearer token.
- Goal: distinguish “Supabase client invoke problem” from “app-level state/problem before request.”

Step 4: Add explicit client-visible diagnostics
- Surface:
  - `submit_started`
  - `invoke_started`
  - `invoke_failed`
  - `response_received`
- This prevents the UI from showing a generic spinner/timeout when no request was ever sent.

Step 5: Re-test provider behavior only after invocation is proven
- Once requests are definitely reaching the function, validate:
  - NAICS `512110`
  - default 90-day window
  - SAM-only source
- Only then revisit provider logic if results are still wrong.

Files to inspect/change next
- `src/hooks/use-opportunity-search.ts`
- `src/pages/Opportunities.tsx`
- `supabase/functions/get-user-roles/index.ts`

Technical notes
- `search-opportunities` itself currently has the correct SAM base URL and valid manual auth pattern.
- The prior SAM date-window issues may still matter later, but they are not the current root cause of the observed “still broken” state because the function is not being invoked.
- The strongest proven root cause right now is:
  - pre-invocation failure in the client/runtime path
  - plus a separate confirmed `get-user-roles` boot failure in the auth ecosystem

Expected outcome after the next pass
- We will know exactly whether the blocker is:
  - `supabase.functions.invoke` hanging/failing client-side
  - a session/auth runtime issue before request dispatch
  - or another frontend state dependency preventing the request from being sent
- Only after that should we make any SAM/provider changes.

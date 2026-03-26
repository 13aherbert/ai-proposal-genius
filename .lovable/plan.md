
## Opportunity Search Timeout Audit

### What is happening in each phase right now

**Phase 1: Client request**
- `/opportunities` calls `useOpportunitySearch.search()`, which invokes `search-opportunities`.
- The hook starts a **45s client timer** and shows the spinner immediately.
- The request is **not explicitly sending the bearer token** in this hook, so it depends on SDK session propagation.

**Phase 2: Edge function auth**
- This is the current failure point.
- The function does receive the request, but recent runtime logs show:
  - `[search-opportunities] Request received`
  - `[search-opportunities] Auth failed: Auth session missing!`
- That means the request is dying **before any SAM.gov or Grants.gov call happens**.
- Root cause: the function is validating auth with an **anon-key client + `auth.getUser()` session context**, which is brittle in edge functions.
- For this project, the more reliable pattern is:
  - read bearer token from `Authorization`
  - create a Supabase client with **`SUPABASE_SERVICE_ROLE_KEY`**
  - call **`auth.getUser(token)`** directly

**Phase 3: Organization checks**
- After auth, the function does several sequential checks:
  1. profile lookup
  2. active membership lookup
  3. subscription lookup
  4. daily usage lookup
- These are not the main blocker today, but they add latency and should be instrumented with phase timings.

**Phase 4: Provider selection**
- NAICS-only searches are correctly intended to go **SAM-only**.
- That part is reasonable for `512110`.
- However, because auth is failing first, provider logic is never reliably reached.

**Phase 5: External provider calls**
- If auth succeeds, current worst-case timing is still too high:
  - SAM.gov timeout: **25s**
  - Grants.gov timeout: **15s**
  - NAICS fallback retry to SAM with 730-day window can add **another full SAM call**
- Even with parallel calls, the retry path can push the total close to or beyond the **45s client timeout**.

**Phase 6: UI state**
- The UI now distinguishes timeout/error/empty better than before.
- But if the edge function hangs or auth fails inconsistently, users still experience a spinner followed by a timeout toast without clear phase-level diagnosis.

---

## Most likely root cause order

1. **Primary blocker:** edge auth is failing before providers run  
2. **Secondary risk:** provider time budgets are still too large for a synchronous edge-function flow  
3. **Tertiary issue:** no phase-level diagnostics returned to the client, so failures are hard to localize

---

## Implementation plan

### Step 1: Fix edge-function authentication first
Update `supabase/functions/search-opportunities/index.ts` to:
- validate the bearer token with `SUPABASE_SERVICE_ROLE_KEY`
- use `auth.getUser(token)` instead of relying on edge session state
- return a specific auth error payload if token validation fails

This should remove the current `Auth session missing!` failure.

### Step 2: Pass auth explicitly from the client
Update `src/hooks/use-opportunity-search.ts` to send:
- `Authorization: Bearer ${session.access_token}`

That makes the request path explicit and removes ambiguity about SDK-managed token forwarding.

### Step 3: Add phase-by-phase diagnostics
Instrument the edge function to log and optionally return:
- auth time
- org/profile check time
- subscription/usage check time
- provider selection
- SAM request status/time
- Grants request status/time
- retry triggered or not
- total function duration

This will show exactly where time is being spent.

### Step 4: Reduce synchronous timeout risk
Tighten the live search path:
- lower SAM timeout budget
- keep Grants skipped for NAICS-only searches
- cap or conditionally disable the second SAM retry if the first request already consumed too much time
- add an overall edge-function deadline budget

### Step 5: Improve UI messaging for phase failures
Update the Opportunities page to surface:
- auth failure
- organization/subscription gate failure
- provider timeout
- partial results
- retry attempted

This prevents “still spinning / no results” from hiding the real cause.

### Step 6: Decide whether to keep synchronous search or move to queued search
If provider timings are still unstable after auth is fixed:
- move Opportunity Search to a **queued job architecture**
- edge function returns immediately with a job id
- worker performs SAM/Grants fetch
- UI polls or subscribes for completion

That is the safest long-term solution if live provider latency remains unpredictable.

---

## Files to update
- `supabase/functions/search-opportunities/index.ts`
- `src/hooks/use-opportunity-search.ts`
- `src/pages/Opportunities.tsx`

## Technical notes
- `SAM_GOV_API_KEY` is configured, so the immediate issue is **not** “missing key.”
- Current runtime logs do **not** show provider HTTP logs, which strongly indicates requests are failing **before** SAM.gov/Grants.gov are reached.
- The current implementation can still exceed the client timeout even after auth is fixed, especially on the NAICS fallback path.

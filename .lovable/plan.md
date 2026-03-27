

## Texas SmartBuy Search — Apify Credits Exhausted

### Problem
Every Texas search returns HTTP 402 from Apify. The free tier credits are depleted. California searches will likely hit the same issue soon.

### Options

**Option A: Upgrade Apify plan**
- Add credits or upgrade to a paid Apify plan at https://console.apify.com/billing/subscription
- No code changes needed — Texas and California will resume working immediately

**Option B: Graceful degradation in the UI (code change)**
- Detect HTTP 402 specifically in `fetchTexas` and `fetchCalifornia`
- Return a new provider status like `"billing_error"` instead of generic `"api_error"`
- Show a user-friendly message: "Texas SmartBuy is temporarily unavailable (scraper quota exceeded)" instead of "returned an error. Please try again."
- When searching "All Sources", skip failed scraper providers silently so SAM.gov and Grants.gov results still appear without confusion

**Option C: Replace Apify with direct data sources**
- Texas publishes procurement data via Socrata open data portals (data.texas.gov) which have free, unlimited API access
- Replace the Apify actor call with direct Socrata API queries — no account or credits needed
- This eliminates the Apify dependency and cost for Texas entirely

### Recommendation
Option A (add Apify credits) for immediate fix. Option C (direct Socrata API) for long-term reliability — it removes the paid dependency entirely. Option B regardless, so the UI handles quota errors gracefully.

### Files to update (for Options B + C)
- `supabase/functions/search-opportunities/index.ts` — update `fetchTexas` error handling + optionally replace with Socrata API
- No frontend changes needed unless adding the `billing_error` status to the UI


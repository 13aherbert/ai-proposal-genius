

## Fix: California eProcure Keyword Search

### Finding

The Apify scraper documentation confirms it **does** support keyword search as an input parameter (`keyword: string`). Our code already passes `keyword` to the actor input (line 283). However, we then also apply a **redundant client-side keyword filter** (lines 347-354) that throws away results the scraper already matched.

The scraper likely matches keywords against fields we don't check in our client-side filter (e.g. description text, category, UNSPSC codes). So results that the scraper correctly returns are being discarded by our overly strict post-filter.

Additionally, the scraper supports extra useful parameters we're not using:
- `dataType` (default `"bids"`) -- controls what type of data to scrape
- `unspscCodes` -- category codes (similar to NAICS for CA procurement)
- `certificationTypes` -- small business, DVBE filters (maps to our `setAside`)

### Fix

1. **Remove the client-side keyword filter** (lines 346-354) since the scraper handles keyword filtering natively
2. **Add `dataType: "bids"`** explicitly to the actor input for clarity
3. **Map `setAside` to `certificationTypes`** when provided (e.g. "Small Business" → `["Small Business"]`)
4. **Pass `departments` as an array** instead of a string, matching the scraper's expected input schema (`departments: array`)

### File to update
- `supabase/functions/search-opportunities/index.ts` — lines 278-354 in `fetchCalifornia`

### Expected result
Keyword searches like "IT services" or "Video" will return relevant California results directly from the scraper without being filtered out by the post-processing step.


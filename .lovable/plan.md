

## Diagnosis: California eProcure Keyword Search Returns 0 Results

### Root cause

The Apify CaleProcure scraper's `keyword` parameter **does not work reliably**. Evidence:

- Searching with `keyword: "Hvac"` → Apify HTTP 201, **0 items** returned
- Searching with `keyword: "Video"` → Apify HTTP 201, **0 items** returned
- Previous searches WITHOUT a keyword → scraper returned **25 items** (but irrelevant ones)

The scraper has **0 monthly active users**, **0.0 rating**, and only 4 total users. Its keyword filtering is either broken or uses an incompatible search mechanism on the CaleProcure site.

### Fix

Stop relying on the scraper's native `keyword` parameter. Instead:

1. **Always omit `keyword` from the Apify actor input** — let the scraper return all open bids
2. **Apply keyword filtering locally** in the edge function after receiving results, matching against `title`, `department`, `eventName`, and all string fields in `raw_data`
3. **Request more results** from the scraper (e.g. `limit: 100`) so we have a larger pool to filter from when keywords are provided

### Changes in `supabase/functions/search-opportunities/index.ts`

In `fetchCalifornia`:
- Remove `if (safeKeyword) actorInput.keyword = safeKeyword;` (line 284)
- Increase scraper limit to 100 when keyword is provided (to get a bigger pool for filtering)
- After normalizing items, apply local keyword filtering:

```text
if (safeKeyword) {
  const keywords = safeKeyword.toLowerCase().split(/\s+/).filter(Boolean);
  opportunities = opportunities.filter(opp => {
    const searchText = [
      opp.title, opp.department, opp.solicitation_number,
      ...extractStringValues(opp.raw_data)
    ].join(" ").toLowerCase();
    return keywords.some(w => searchText.includes(w));
  });
}
```

- Update `totalRecords` to the filtered count
- Log both raw and filtered counts for debugging

### Expected result
- Scraper returns all open CA bids (~25-100 items)
- Local filtering keeps only HVAC-relevant results
- Users see relevant California opportunities for keyword searches

### File to update
- `supabase/functions/search-opportunities/index.ts` — `fetchCalifornia` function (~lines 278-370)


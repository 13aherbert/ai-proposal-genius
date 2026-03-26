

## Fix: Pagination shows only 1 page because totalRecords is wrong

### Root Cause
In `supabase/functions/search-opportunities/index.ts`, line 517:
```typescript
totalRecords: allOpportunities.length,  // always 25 (the current page)
```
This overwrites the real total (e.g., 31,703) with just the page size. The client uses `totalRecords` to calculate `totalPages`, so it thinks there's only 1 page.

The actual `totalRecords` from SAM.gov is available in `fetchSamGov` (line 142) but is discarded — only the opportunities array and provider status are returned.

### Fix

**File: `supabase/functions/search-opportunities/index.ts`**

1. Include `totalRecords` in the return value of `fetchSamGov` and `fetchGrantsGov`
2. Accumulate the real total across providers in the main handler
3. Return the real total in the response instead of `allOpportunities.length`

Specifically:
- `fetchSamGov` return type changes to include `totalRecords: number` (already parsed on line 142)
- `fetchGrantsGov` similarly returns its total from `json?.data?.totalCount` or similar
- Main handler sums provider totals and returns that as `totalRecords`
- Line 517 becomes: `totalRecords: combinedTotalRecords`

**No client-side changes needed** — `Opportunities.tsx` already has working pagination controls that use `totalRecords` and `PAGE_SIZE` to calculate pages and call `handlePageChange` with the correct offset.

### Files to update
- `supabase/functions/search-opportunities/index.ts`


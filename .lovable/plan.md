

## Root Cause: Grants.gov Returns 0 Results With Empty Keyword

### What is happening

From the edge function logs:
```
[Grants.gov] Request: keyword="", rows=25, agency=""
[Grants.gov] Results: 0, total: 0
```

The Grants.gov `search2` API treats an empty `keyword` as "match nothing." Unlike SAM.gov which supports browsing by date range alone, Grants.gov **requires a keyword or other filter** (like `agencies`, `fundingCategories`, `aln`) to return results.

When the user selects "Grants.gov" as source and hits Search with no keyword and no other filters, the edge function sends `{"keyword": "", "rows": 25, "oppStatuses": "forecasted|posted"}` — and Grants.gov returns 0 hits.

### Fix

**File: `supabase/functions/search-opportunities/index.ts`** — `fetchGrantsGov` function

1. When `keyword` is empty and no `agency` filter is set, use a wildcard keyword `"*"` instead of `""`. The Grants.gov API accepts `"*"` as a browse-all query.
2. If `"*"` doesn't work (some versions reject it), fall back to using a space `" "` or the word `"grants"` as a catch-all.
3. Add a log line so we can see which keyword was actually sent.

The change is a single line in `fetchGrantsGov`:

```typescript
// Before
const body = { keyword: safeKeyword || "", ... };

// After  
const effectiveKeyword = safeKeyword || "*";
const body = { keyword: effectiveKeyword, ... };
```

Additionally, the Grants.gov response uses `data.hitCount` for total count (not `data.totalCount`), so we should also check that field to ensure accurate totals.

### Files to update
- `supabase/functions/search-opportunities/index.ts` (fetchGrantsGov function, ~3 lines)

### Expected result
Selecting "Grants.gov" source with no keyword will return posted/forecasted grant opportunities instead of 0 results.


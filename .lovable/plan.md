

## Root Cause: Keyword Search Returns 0 Results

### What is happening

The edge function logs prove it clearly:

```
[SAM.gov] Results: 25, totalRecords: 31703
[Search] Final: 0 results
```

SAM.gov returns 25 results for keyword "Cybersecurity" -- then the edge function **throws them all away**.

### Exact bug location

`supabase/functions/search-opportunities/index.ts`, lines 296-308:

```typescript
function rankByRelevance(opps, keyword) {
  return opps
    .map(opp => ({ opp, score: scoreRelevance(opp, keyword) }))
    .filter(({ score }) => score > 0)   // ← THIS LINE KILLS EVERYTHING
    .sort(...)
    .map(({ opp }) => opp);
}
```

The `scoreRelevance` function checks the keyword against `title`, `department`, `solicitation_number`, and `raw_data.description`. But:

1. SAM.gov already does server-side keyword matching -- results ARE relevant
2. The keyword often appears in the **full description text**, not the title or department
3. `raw_data.description` is a **URL** (e.g., `https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid=...`), not actual description text
4. So every result scores **0** and gets filtered out

### Why NAICS search works

`scoreRelevance` returns `1` when keyword is empty (line 264), so NAICS-only searches skip the filter entirely. That is why NAICS 512110 returned 6 results successfully.

### Fix

**Line 300**: Remove the `filter` that strips zero-score results. SAM.gov has already matched by keyword server-side, so all returned results are relevant. Instead, just sort by score (higher-scored results first) but keep everything.

```typescript
function rankByRelevance(opps, keyword) {
  if (!keyword || !keyword.trim()) return opps;
  return opps
    .map(opp => ({ opp, score: scoreRelevance(opp, keyword) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = a.opp.posted_date || "";
      const dateB = b.opp.posted_date || "";
      return dateB.localeCompare(dateA);
    })
    .map(({ opp }) => opp);
}
```

### File to update
- `supabase/functions/search-opportunities/index.ts` (lines 296-308)

### Expected result
Keyword searches like "Cybersecurity", "Video", "Video production" will return the 25 results SAM.gov provides instead of filtering them all to zero.


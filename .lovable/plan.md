

## Diagnosis: Why "Video Production" Search Returns Irrelevant Results

After analyzing the edge function and search form, I identified three root causes:

### Problem 1: No Relevance Sorting
Results are returned in whatever order the external APIs provide (typically by posted date, newest first). There is no client-side relevance ranking, so a contract mentioning "video" once in a footnote ranks equally with one titled "Video Production Services."

### Problem 2: SAM.gov Opportunity Type Filter is Broken
The search form has SAM.gov-specific `ptype` codes (e.g., `"o"` for Solicitation, `"p"` for Presolicitation) mixed into the `opportunityType` dropdown. These are sent as `opportunityType` and filtered client-side against `opp.type` — but SAM.gov's `type` field contains strings like `"Solicitation"`, not `"o"`. This means selecting any SAM.gov-specific type filters out ALL results instead of narrowing them.

Meanwhile, the SAM.gov API supports a `ptype` query parameter that would filter server-side (much faster/accurate), but the form never sends it.

### Problem 3: Grants.gov Returns Default-Ordered Results
The Grants.gov API call doesn't specify a `sortBy` parameter, so results come back in default order rather than by keyword relevance.

---

## Fix Plan

### Fix 1: Add Relevance-Based Sorting in Edge Function
**File:** `supabase/functions/search-opportunities/index.ts`

Add a `scoreRelevance()` function after deduplication that:
- Scores each result based on keyword presence in the title (highest weight), department, and solicitation number
- Sorts results by relevance score descending, then by posted date descending as tiebreaker
- Uses case-insensitive partial matching on each keyword token

```text
Score weights:
  Title exact phrase match  → +100
  Title contains all words  → +50
  Title contains any word   → +10 per word
  Department match          → +5 per word
```

### Fix 2: Fix Opportunity Type / ptype Filtering
**File:** `src/components/opportunities/OpportunitySearchForm.tsx`

Split the opportunity type dropdown into two concerns:
- Keep "Contract" and "Grant" as `opportunityType` (for cross-source filtering)
- Move SAM.gov-specific types (`o`, `p`, `k`, `r`, `s`) into the `ptype` search parameter so SAM.gov filters them server-side

Update `handleSubmit` to send `ptype` when a SAM.gov-specific type is selected.

**File:** `supabase/functions/search-opportunities/index.ts`
- The `ptype` param is already passed to SAM.gov API (line 64) — it just needs to receive a value from the frontend.

### Fix 3: Improve Grants.gov Relevance
**File:** `supabase/functions/search-opportunities/index.ts`

Add `sortBy: "relevance"` to the Grants.gov API request body so results come back ranked by keyword match from the source.

---

### Summary of Changes

| File | Change |
|------|--------|
| `search-opportunities/index.ts` | Add `scoreRelevance()` function to rank results by keyword match in title/department; add `sortBy: "relevance"` to Grants.gov request |
| `OpportunitySearchForm.tsx` | Fix opportunity type dropdown to correctly send `ptype` for SAM.gov-specific types vs `opportunityType` for generic types |

These three fixes together will ensure that searching "Video Production" surfaces contracts and grants with those words prominently in the title, rather than random results that happen to mention those terms somewhere in their metadata.


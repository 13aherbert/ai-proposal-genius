
Goal: make keyword search meaningfully relevant across SAM.gov, Grants.gov, and California eProcure, and surface clear in-progress search status in the UI.

What I verified
- The progress UI is only partially built:
  - `src/components/opportunities/SearchProgressIndicator.tsx` exists
  - but `src/pages/Opportunities.tsx` never renders it
- The hook currently derives provider labels with the wrong source keys:
  - it checks `sam.gov` / `grants.gov`
  - the form sends `sam_gov` / `grants_gov`
  - so single-source progress tracking is currently wrong
- California keyword search is still not trustworthy:
  - the live request/response for `keyword: "Video"` returned unrelated California bids
  - so Apify’s documented keyword support is not reliable enough by itself in this app
- Cross-source relevance is still too loose:
  - `rankByRelevance()` only sorts
  - it does not remove zero-relevance rows
  - this allows obviously unrelated keyword results to appear from any provider

Implementation plan

1. Tighten keyword relevance in the edge function
- Update `supabase/functions/search-opportunities/index.ts`
- Keep provider-native keyword search enabled for all sources
- After normalization, add a second-pass local relevance gate when a keyword is present:
  - compute searchable text from title, department, solicitation number, and any useful raw string fields available
  - require a minimum local relevance score before a result is returned
- Apply this consistently across all providers so “keyword search” means “results visibly related to the keyword”
- Keep no-keyword browsing behavior unchanged

2. Make California specifically resilient
- Keep sending `keyword` to the Apify actor
- Do not trust the actor alone for relevance
- Add California post-filtering using all available string fields from the scraper payload, not just title/department
- If California returns items with no local keyword match, exclude them rather than showing irrelevant opportunities

3. Improve cross-source ranking behavior
- Refine `scoreRelevance()` / `rankByRelevance()` so results are ordered by:
  - exact phrase match
  - all words in title
  - partial title matches
  - department / solicitation / other metadata matches
- When keyword search is active, filter out rows with zero confidence instead of merely sorting them to the bottom

4. Wire the progress bar into the page
- Update `src/pages/Opportunities.tsx`
- Render `SearchProgressIndicator` while `isSearching` is true
- Place it directly below the search form so users immediately see that work is in progress

5. Fix provider tracking in the search hook
- Update `src/hooks/use-opportunity-search.ts`
- Correct the source comparisons to use the real values:
  - `sam_gov`
  - `grants_gov`
  - `california_eprocure`
- Expose the derived provider list cleanly to the page so the progress indicator reflects the actual sources being queried

6. Make the progress UI more informative
- Expand `SearchProgressIndicator.tsx` to show:
  - elapsed time
  - expected providers being queried
  - California long-running hint
  - progress bar based on estimated provider duration
- After the search completes, continue using `providerStatuses` on the page for final per-provider outcomes

Files to update
- `supabase/functions/search-opportunities/index.ts`
- `src/hooks/use-opportunity-search.ts`
- `src/pages/Opportunities.tsx`
- `src/components/opportunities/SearchProgressIndicator.tsx`

Technical notes
- No database changes are needed
- The main bug is not auth or request dispatch anymore; it is result-quality logic plus missing UI wiring
- The most important functional fix is changing keyword handling from “sort only” to “filter + rank” during keyword searches
- The most important UX fix is actually rendering the already-created progress component and feeding it the correct provider list

Expected outcome
- California keyword searches stop showing unrelated bids
- All-source keyword searches return only rows with visible relevance to the entered keyword
- Users can clearly see that the search is running, which providers are involved, and why California may take longer

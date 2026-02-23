

## Opportunity Finder Enhancement Plan

### Overview

Expand the existing SAM.gov-only opportunity search into a multi-source aggregation engine by adding Grants.gov as a second data source, enhancing the search form with more filters, and adding a detail view for opportunities.

---

### Part 1: Multi-Source Edge Function (Grants.gov Integration)

**File: `supabase/functions/search-opportunities/index.ts`**

Refactor the edge function into a modular provider architecture:

- Extract SAM.gov fetch logic into a `fetchSamGov()` helper function
- Add a new `fetchGrantsGov()` helper that calls the public `https://api.grants.gov/v1/api/search2` endpoint (no API key needed)
- Both providers return results in the same normalized `Opportunity` format
- Add a `source` filter parameter so users can search one or both sources
- Merge and deduplicate results before returning
- Add an `opportunityType` filter parameter (contract, grant, etc.)
- SAM.gov results get `type` from the API response; Grants.gov results are tagged as `"grant"`

The Grants.gov search2 endpoint accepts a POST body with fields: `keyword`, `rows`, `oppStatuses` ("forecasted|posted"), `fundingCategories`, `agencies`. No authentication required.

Normalized mapping from Grants.gov response:

| Grants.gov field | Normalized field |
|---|---|
| `id` or `oppNumber` | `external_id` |
| `title` | `title` |
| `oppNumber` | `solicitation_number` |
| `agencyName` / `agency` | `department` |
| `openDate` | `posted_date` |
| `closeDate` | `response_deadline` |
| `fundingCategory` | `set_aside` (repurposed for category) |
| Link constructed from oppNumber | `description_url` |
| `"grant"` | `type` |
| `"grants_gov"` | `source` |

**Config update: `supabase/functions/config.toml`**

Add `search-opportunities` entry (currently missing):
```toml
[[functions]]
name = "search-opportunities"
verify_jwt = false
import_map = "import_map.json"
```

---

### Part 2: Enhanced Search Form

**File: `src/components/opportunities/OpportunitySearchForm.tsx`**

Add new filter controls:

- **Source** dropdown: "All Sources", "SAM.gov Only", "Grants.gov Only"
- **Opportunity Type** dropdown: "Any", "Contract", "Grant", "Solicitation", "Presolicitation", "Sources Sought"
- **Agency** text input for filtering by agency name

Update `SearchParams` interface in `src/hooks/use-opportunity-search.ts` to include:
```typescript
source?: string;       // "all" | "sam_gov" | "grants_gov"
opportunityType?: string;
agency?: string;
```

The edge function will use `source` to decide which providers to call, reducing unnecessary API calls.

---

### Part 3: Opportunity Detail Modal

**New file: `src/components/opportunities/OpportunityDetailModal.tsx`**

A dialog/sheet component that shows the full opportunity details:

- Title, solicitation number, source badge (SAM.gov or Grants.gov)
- Full department/agency name
- Posted date and response deadline (with days remaining)
- NAICS code, set-aside type, opportunity type
- Full description (from raw_data if available)
- External link button ("View on SAM.gov" / "View on Grants.gov")
- Save button
- "Start Project" button that navigates to `/upload-rfp` with prefilled data

**Updated file: `src/components/opportunities/OpportunityCard.tsx`**

- Add a "View Details" button that opens the detail modal
- Show a source badge (SAM.gov vs Grants.gov) on each card
- Pass click handler from parent

**Updated file: `src/pages/Opportunities.tsx`**

- Manage selected opportunity state for the detail modal
- Update page description from "Search government RFP opportunities from SAM.gov" to "Search RFPs, contracts, and grant opportunities"

---

### Part 4: UI Polish

- Update OpportunityCard to show a colored source badge distinguishing SAM.gov (blue) and Grants.gov (green)
- Show opportunity type badge alongside the source
- Update the "View on SAM.gov" button to dynamically show the correct source name
- Add pagination controls (Next/Previous) using the existing `offset` parameter

---

### Files Summary

| File | Action |
|---|---|
| `supabase/functions/search-opportunities/index.ts` | Major refactor: add Grants.gov provider, source filter, modular architecture |
| `supabase/functions/config.toml` | Add missing `search-opportunities` entry with `verify_jwt = false` |
| `src/hooks/use-opportunity-search.ts` | Extend `SearchParams` and `Opportunity` interfaces with new fields |
| `src/components/opportunities/OpportunitySearchForm.tsx` | Add source, opportunity type, and agency filters |
| `src/components/opportunities/OpportunityDetailModal.tsx` | New component: full detail view in a dialog |
| `src/components/opportunities/OpportunityCard.tsx` | Add source badge, View Details button |
| `src/pages/Opportunities.tsx` | Wire up detail modal, update copy, add pagination |

### Dependencies

No new packages required. All changes use existing UI components (Dialog, Badge, Select, Button).

### Security Notes

- Grants.gov public endpoint requires no API key -- no secrets needed
- All API calls remain server-side via the edge function
- Rate limiting applies to the combined search (still 50/day per org)
- No API keys exposed to the frontend




## Opportunity Finder: New Features Plan

### What's Already Built
- Search with filters (keyword, source, type, agency, dates, NAICS, set-aside)
- Two data sources: SAM.gov and Grants.gov
- Save opportunities with status tracking (saved/reviewing/pursuing/dismissed)
- Detail modal with description extraction
- "Start Project" flow from saved opportunities
- Organization-scoped data with RLS, rate limiting (50/day), Pro+ gating

### What's Missing from the Spec

Comparing the feature spec against the current implementation, here are the features that can be added, grouped by priority.

---

### Priority 1: Quick Wins (Small effort, high value)

**1. "Generate Proposal Draft" button on search results and detail modal**
- Add a button to the OpportunityCard and OpportunityDetailModal that navigates to `/upload-rfp` with prefilled data (title, deadline, agency, description)
- Currently only available on saved opportunities via "Start Project" -- extend to unsaved results too
- Files: `OpportunityCard.tsx`, `OpportunityDetailModal.tsx`

**2. Notes field on saved opportunities**
- The `saved_opportunities` table already has a `notes` column
- Add an inline editable text area on the SavedOpportunities cards so users can add notes
- Files: `SavedOpportunities.tsx`, `use-opportunity-search.ts` (add `updateNotes` function)

**3. Filter/sort saved opportunities**
- Add status filter dropdown and sort options (by deadline, date saved) to the Saved tab
- Currently all saved opportunities display in a flat list with no filtering
- Files: `SavedOpportunities.tsx`

**4. Pagination for search results**
- The edge function already accepts `limit` and `offset` but the UI has no pagination controls
- Add "Load More" or page navigation buttons
- Files: `Opportunities.tsx`, `OpportunitySearchForm.tsx`

---

### Priority 2: Medium Effort Features

**5. Saved Search Alerts / Notifications**
- New DB table: `saved_searches` (organization_id, user_id, search_params JSONB, name, is_active, last_run_at, created_at)
- New DB table: `opportunity_alerts` (id, saved_search_id, user_id, opportunity_external_id, is_read, created_at)
- "Save this search" button on the search form that persists current filter params
- New edge function `check-saved-searches` that runs on a cron schedule, re-executes saved searches, and inserts alerts for new results
- In-app notification badge on the Opportunity Finder sidebar item
- Files: new migration, new edge function, new UI components

**6. Opportunity Lists / Pipeline View**
- New DB table: `opportunity_lists` (id, organization_id, name, description, created_by, created_at)
- New DB table: `opportunity_list_items` (id, list_id, saved_opportunity_id)
- Allow users to create named lists (e.g., "Cybersecurity Opportunities", "Q2 Pipeline")
- Add a "Move to list" action on saved opportunities
- Kanban-style pipeline view using existing status values as columns
- Files: new migration, new components, update `SavedOpportunities.tsx`

**7. Search result caching (30-minute TTL)**
- New DB table: `opportunity_search_cache` (id, cache_key TEXT UNIQUE, results JSONB, total_records INT, created_at, expires_at)
- In the edge function, hash search params into a cache key, check cache before calling external APIs
- Reduces API calls and improves response time
- Files: `search-opportunities/index.ts`, new migration

---

### Priority 3: Larger Features (Future phases)

**8. Additional data source providers (modular)**
- The edge function architecture already supports adding providers
- Candidates: EU TED API, Canada MERX, state procurement portals (NY, CA)
- Each new provider follows the same pattern: fetch, normalize to `NormalizedOpportunity`, merge

**9. AI Opportunity Matching**
- Compare user's company profile (industry, NAICS codes, past wins from knowledge base) against search results
- Add a relevance score badge to each opportunity card
- Requires a new edge function that calls the AI service with company context + opportunity data

**10. Deadline calendar view**
- Calendar component showing saved opportunity deadlines
- Visual timeline of upcoming deadlines
- Uses existing `response_deadline` data from saved opportunities

---

### Recommended Implementation Order

| # | Feature | Effort | Files Changed |
|---|---------|--------|---------------|
| 1 | Generate Proposal Draft button | Small | 2 UI components |
| 2 | Notes on saved opportunities | Small | 2 files |
| 3 | Filter/sort saved opportunities | Small | 1 component |
| 4 | Pagination | Small | 2 files |
| 5 | Saved search alerts | Medium | Migration + edge function + UI |
| 6 | Opportunity lists/pipeline | Medium | Migration + new components |
| 7 | Search result caching | Medium | Migration + edge function |
| 8 | Additional sources | Medium each | Edge function |
| 9 | AI matching | Large | Edge function + UI |
| 10 | Deadline calendar | Medium | New component |

### Technical Notes
- All new tables require RLS policies scoped to `organization_id` using `user_belongs_to_organization()`
- Saved searches cron would use Supabase `pg_cron` or an external scheduler calling the edge function
- The existing modular provider pattern in `search-opportunities/index.ts` makes adding new sources straightforward -- each is an async function returning `NormalizedOpportunity[]`


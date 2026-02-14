

## RFP Opportunity Search Feature

### Overview
Add a new "Find Opportunities" page where Pro/Enterprise users can search for government and public RFP opportunities from SAM.gov (and extensible to other sources). Results are displayed in a searchable, filterable list. Users can save interesting opportunities and optionally start a new project directly from a found opportunity.

---

### Architecture

```text
User (Pro/Enterprise)
  |
  v
/opportunities page (new)
  |
  v
Edge Function: search-opportunities
  |
  +---> SAM.gov Opportunities API (v2)
  +---> (Future: Grants.gov, state portals)
  |
  v
Results displayed + optional save to DB
```

---

### Data Source: SAM.gov Public API

- **Endpoint:** `https://api.sam.gov/opportunities/v2/search`
- **Auth:** API key passed as query parameter (`api_key=...`)
- **Free tier:** 10 requests/day (sufficient for MVP; entity registration unlocks 1,000/day)
- **Key search parameters:** `keyword`, `postedFrom`, `postedTo`, `ptype` (solicitation type), `solnum`, `naicsCode`, `setAside`, `deptname`, `limit`, `offset`
- **Returns:** Opportunity title, solicitation number, department, posted/response dates, set-aside type, NAICS code, description link, etc.

A SAM.gov API key is required. It will be stored as a Supabase Edge Function secret (`SAM_GOV_API_KEY`).

---

### Implementation Steps

#### 1. Add SAM.gov API Key Secret
- Prompt user to register at SAM.gov for a public API key
- Store as `SAM_GOV_API_KEY` via the secrets tool

#### 2. Database: `saved_opportunities` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| organization_id | uuid | FK to organizations |
| saved_by | uuid | user who saved it |
| external_id | text | SAM.gov notice ID |
| source | text | 'sam_gov' (extensible) |
| title | text | opportunity title |
| solicitation_number | text | |
| department | text | |
| naics_code | text | |
| posted_date | timestamptz | |
| response_deadline | timestamptz | |
| set_aside | text | |
| description_url | text | link to full notice |
| raw_data | jsonb | full API response |
| notes | text | user notes |
| status | text | 'saved', 'reviewing', 'pursuing', 'dismissed' |
| created_at | timestamptz | |

RLS: Organization members can CRUD their org's saved opportunities.

#### 3. Edge Function: `search-opportunities`
- Accepts: `keyword`, `postedFrom`, `postedTo`, `naicsCode`, `setAside`, `ptype`, `limit`, `offset`
- Validates JWT and checks user has Pro/Enterprise subscription via org subscription lookup
- Calls SAM.gov API, transforms response, returns results
- Rate-limits per organization (e.g., 50 searches/day) using `organization_usage_metrics`

#### 4. New Page: `/opportunities`
- Route added to `App.tsx` as a `ProtectedRoute`
- **Search form** at top: keyword input, date range pickers, NAICS code, set-aside type dropdown, solicitation type dropdown
- **Results list**: Cards showing title, department, deadline, set-aside, NAICS, with "Save" and "View on SAM.gov" buttons
- **Saved tab**: Toggle between "Search" and "Saved" views
- **Subscription gate**: Non-Pro users see an upgrade prompt instead of the search form
- **Start Project button**: On saved opportunities, a "Create Project from Opportunity" action pre-fills the Upload RFP form with the opportunity title and deadline

#### 5. Navigation
- Add "Find Opportunities" link to the main navbar (between Projects and Knowledge Base)
- Add a Quick Action card on the Dashboard for Pro/Enterprise users

#### 6. Feature Gating
- Add `'opportunity_search'` to the `FeatureName` type
- Gate access in the subscription features hook so only Pro/Enterprise plans have it enabled

---

### Extensibility for Future Sources
The `source` field on `saved_opportunities` and the edge function architecture support adding more sources later:
- Grants.gov (separate API key, different response format)
- State/local procurement portals (via Firecrawl scraping if no API exists)

Each source would get its own transformer function inside the edge function, with a unified response format returned to the frontend.

---

### Technical Details

**New/modified files:**
- `supabase/functions/search-opportunities/index.ts` -- new edge function
- `src/pages/Opportunities.tsx` -- new page
- `src/components/opportunities/` -- new folder: `OpportunitySearchForm.tsx`, `OpportunityCard.tsx`, `SavedOpportunities.tsx`
- `src/hooks/use-opportunity-search.ts` -- new hook
- `src/App.tsx` -- add route
- `src/components/navigation/` -- add nav link
- `src/hooks/subscription/subscription-features-types.ts` -- add feature name
- `supabase/config.toml` -- add function config with `verify_jwt = false`
- Database migration for `saved_opportunities` table + RLS policies

**Security considerations:**
- SAM.gov API key never exposed to client (only in edge function via `Deno.env`)
- JWT validation in edge function
- Organization membership verification before returning results
- Subscription tier check server-side
- Input sanitization on search parameters
- Rate limiting per organization


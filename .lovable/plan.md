

## Auto-Fetch RFP Documents from Opportunity Sources

### Problem
Currently, clicking "Draft Proposal" on an opportunity just navigates to `/upload-rfp` with prefilled metadata (title, deadline, agency). The user still has to manually find and upload the RFP documents. The goal is to automatically pull documents from the opportunity source and create a project as if the user uploaded them.

### Discovery Findings

**SAM.gov Public API** already returns two key fields in search results that we currently ignore:
- `resourceLinks` -- Array of direct URLs to download opportunity attachments (PDFs, documents)
- `description` -- A URL to download the full notice description text (e.g., `https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid={id}`)

These are available without additional authentication beyond our existing API key.

**Grants.gov** does not return attachment URLs in its search API. Users would need to be redirected to the Grants.gov detail page for document downloads.

**Current code gaps:**
1. The `search-opportunities` edge function normalizes SAM.gov results but drops `resourceLinks` and the `description` URL
2. The `NormalizedOpportunity` type has no field for attachment URLs
3. The `UploadRFP` page does not read `location.state` at all -- the prefill data passed via `navigate()` is silently ignored
4. `useRFPUpload.handleFileUpload` only accepts a `File` object, not a URL

### Architecture

```text
User clicks "Draft Proposal"
        │
        ▼
New Edge Function: fetch-opportunity-documents
        │
        ├─ SAM.gov: Download resourceLinks files + description text
        ├─ Grants.gov: Fetch description from API
        │
        ▼
Upload files to Supabase Storage (rfp-files bucket)
        │
        ▼
Create project record with metadata
        │
        ▼
Navigate to /project/{id} with automation auto-started
```

### Implementation Plan

#### 1. Capture attachment URLs in search results

**File:** `supabase/functions/search-opportunities/index.ts`

- Add `resource_links` field to `NormalizedOpportunity` interface (type: `string[]`)
- Add `description_text_url` field (type: `string | null`)
- In `fetchSamGov()`, map `opp.resourceLinks` to `resource_links` and `opp.description` to `description_text_url`
- For Grants.gov, set `resource_links: []` (attachments not available via API)

**File:** `src/hooks/use-opportunity-search.ts`

- Update the `Opportunity` TypeScript type to include `resource_links?: string[]` and `description_text_url?: string | null`

#### 2. New edge function: `fetch-opportunity-documents`

**File:** `supabase/functions/fetch-opportunity-documents/index.ts`

This function:
1. Accepts: `{ opportunityId, source, resourceLinks, descriptionTextUrl, title, deadline, agency }`
2. Auth check: validate user session, get org ID
3. Subscription check: same Pro+ gate as search
4. For each URL in `resourceLinks`:
   - Fetch the file via HTTP (with API key appended for SAM.gov URLs)
   - Determine filename from Content-Disposition header or URL path
   - Upload to `rfp-files` bucket with org-scoped naming
   - Track the primary RFP file (first PDF found, or first file)
5. If `descriptionTextUrl` is provided and no PDF attachments were found:
   - Fetch the description HTML/text
   - Save as a `.txt` file to storage as fallback
6. Create a `projects` row with: title, deadline, status='draft', rfp_file_path, organization_id
7. Create `project_documents` rows for all downloaded files
8. Return: `{ projectId, filesDownloaded, primaryFilePath }`

Rate limit: count against same daily usage metric.

#### 3. Update "Draft Proposal" button behavior

**Files:** `OpportunityCard.tsx`, `OpportunityDetailModal.tsx`, `SavedOpportunities.tsx`

Replace the current `navigate("/upload-rfp", { state: ... })` with:

1. Show a loading state on the button ("Fetching documents...")
2. Call `supabase.functions.invoke('fetch-opportunity-documents', { body: { ... } })`
3. On success: navigate directly to `/project/{projectId}` (skip upload page entirely)
4. On failure (no documents found): fall back to current behavior -- navigate to `/upload-rfp` with prefilled metadata, and show a toast explaining that no documents were available for auto-download

This means the user never sees the upload page for opportunities that have downloadable documents.

#### 4. Fix the prefill bug in UploadRFP (fallback path)

**File:** `src/pages/UploadRFP.tsx`

- Add `useLocation()` to read `location.state`
- If `prefillTitle` is present, set it as the initial `projectTitle`
- If `prefillDeadline` is present, parse and set as initial `deadline`
- If `prefillAgency` is present, set as initial `clientName`

This fixes the existing broken prefill for cases where auto-fetch fails or no documents are available.

#### 5. Auto-trigger proposal automation after document fetch

When the edge function successfully creates a project with an uploaded RFP file:
- Navigate to `/project/{projectId}`
- Pass `{ autoStart: true }` in navigation state
- The project detail page should detect this flag and auto-trigger the `AutomatedProposalCreation` flow (analysis, outline, sections, content generation)

This requires a small update to the project detail page to check for the `autoStart` state.

### Summary of Changes

| Component | Change |
|-----------|--------|
| `search-opportunities/index.ts` | Add `resource_links` and `description_text_url` to normalized results |
| `use-opportunity-search.ts` | Update `Opportunity` type with new fields |
| **New:** `fetch-opportunity-documents/index.ts` | Edge function to download docs, upload to storage, create project |
| `OpportunityCard.tsx` | Replace navigate with edge function call + loading state |
| `OpportunityDetailModal.tsx` | Same as above |
| `SavedOpportunities.tsx` | Same as above |
| `UploadRFP.tsx` | Fix prefill from `location.state` (fallback path) |
| Project detail page | Accept `autoStart` flag to trigger automation |

### Edge Cases Handled
- **No `resourceLinks`**: Falls back to navigating to `/upload-rfp` with prefilled metadata
- **Download fails**: Toast error, fall back to manual upload flow
- **Large files**: Edge function has a 60s timeout; files over 20MB are skipped with a warning
- **Non-PDF files**: All file types are downloaded; the first PDF is marked as the primary RFP file
- **Grants.gov opportunities**: No auto-download available (API doesn't expose attachments), always falls back to prefilled upload page
- **Rate limiting**: Document fetch counts against the daily 50-search limit


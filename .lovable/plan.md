

## Improve Opportunity-to-Proposal Flow

### Current State
- **OpportunityCard** and **OpportunityDetailModal** both have a "Draft Proposal" button
- `useDraftProposal` hook calls `fetch-opportunity-documents` edge function which:
  1. Downloads resource_links (SAM.gov attachments) or description text
  2. Uploads files to Supabase Storage
  3. Creates a project with `rfp_file_path`
  4. Navigates to `/projects/{id}` with `autoStart: true` → auto-opens analysis tab
- **Problem areas**:
  - No progress visibility during the fetch (just a toast saying "Fetching...")
  - No document preview before committing to a project
  - State sources (CA, TX, NY) rarely have `resource_links`, so users always fall back to manual upload
  - No ability to review what documents were found before drafting
  - The "Draft Proposal" button gives no indication of what will happen (download docs? create project? both?)

### Plan

#### 1. Add a "Draft Proposal" confirmation dialog
**New component**: `DraftProposalDialog.tsx`

Before fetching documents, show a dialog with:
- Opportunity title, agency, deadline summary
- Document availability indicator:
  - "X document links found" (if `resource_links` exist)
  - "Description text available" (if `description_text_url` exists)
  - "No documents detected — you'll upload manually" (if neither)
- Source-specific notes (e.g., "SAM.gov documents will be downloaded automatically")
- Two paths:
  - **"Auto-fetch & Create Project"** — runs the existing `fetch-opportunity-documents` flow
  - **"Manual Upload"** — navigates to `/upload-rfp` with prefilled metadata
- Checkbox: "Auto-analyze after fetching" (default on, maps to `autoStart`)

#### 2. Add real-time progress to document fetching
**Update**: `useDraftProposal` hook + `DraftProposalDialog`

Replace the single toast with a stepped progress UI inside the dialog:
- Step 1: "Downloading documents..." (with count: "1 of 3 files")
- Step 2: "Creating project..."
- Step 3: "Ready — View Project"

Implementation: The edge function already returns `filesDownloaded` and `warnings`. For real-time steps, update the dialog state based on the promise lifecycle (start → response → navigate). No SSE/streaming needed — just visual states within the existing request.

#### 3. Improve state source handling (CA, TX, NY)
**Update**: `fetch-opportunity-documents` edge function

For state sources without `resource_links`, attempt to scrape/fetch the opportunity page:
- **California**: Use the CaleProcure event URL to fetch the bid page HTML and extract any attachment links
- **Texas/NY**: Use the Socrata dataset URL to check for linked documents
- Pass `source` + `external_id` to the edge function so it can attempt source-specific document discovery
- If no documents found, create the project anyway with just the description text as a `.txt` file, so the user still gets a project with context

#### 4. Enhance the OpportunityCard "Draft Proposal" button
**Update**: `OpportunityCard.tsx` and `OpportunityDetailModal.tsx`

- Change button label based on document availability:
  - Has resource_links → "Draft Proposal (X docs)"
  - Has description only → "Draft Proposal"
  - No docs → "Start Proposal"
- Both card and modal buttons open the new `DraftProposalDialog` instead of directly calling `draftProposal`

#### 5. Post-fetch: auto-trigger RFP analysis
**Update**: `fetch-opportunity-documents` edge function

After creating the project and uploading documents, optionally trigger the `analyze-rfp` function automatically (if `autoAnalyze: true` is passed). This eliminates the extra click on the project page. The project page already handles `autoStart` to switch to the analysis tab.

### Files to create/update
- `src/components/opportunities/DraftProposalDialog.tsx` — new confirmation + progress dialog
- `src/hooks/use-draft-proposal.ts` — add progress state, open dialog instead of direct action
- `src/components/opportunities/OpportunityCard.tsx` — wire button to dialog
- `src/components/opportunities/OpportunityDetailModal.tsx` — wire button to dialog
- `supabase/functions/fetch-opportunity-documents/index.ts` — add state source document discovery + optional auto-analyze trigger

### Expected outcome
- Users see what documents are available before committing
- Clear progress during the fetch process
- State source opportunities create usable projects (not just manual upload fallback)
- One-click path from search result → analyzed project with proposal outline


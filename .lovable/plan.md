

## AI Proposal Auto-Design Plan

### Current State
The system **already has most of what's described**:
- 8 templates with distinct layouts, 9 block types, drag-and-drop editor, brand guidelines system, cover image upload, PDF export, autosave, outline sidebar, undo/redo
- `useProposalDesign.ts` already creates initial blocks from `proposal_sections` (cover → TOC → heading+text per section) and applies default brand guidelines
- Missing: smart section-to-block mapping (all sections become heading+text), stock image search, "Generate Designed Proposal" one-click button, Pexels integration

### What to Build

#### 1. Smart Layout Engine in `useProposalDesign.ts`
Upgrade the block generation logic (lines 128-137) to map section types to richer block structures instead of always producing heading+text:

| Section type pattern | Generated blocks |
|---|---|
| `executive_summary` | heading + callout (key points) + text |
| `timeline` / `schedule` | heading + table (auto-parsed if content has dates) |
| `pricing` / `cost` | heading + table (auto-parsed) |
| `team` / `personnel` | heading + text (team grid placeholder) |
| `case_study` / `experience` | heading + quote + text |
| `methodology` / `approach` | heading + text + divider |
| Default | heading + text (current behavior) |

Match by checking `section_title.toLowerCase()` against keyword patterns.

#### 2. "Generate Designed Proposal" Button
Add a prominent button in `ProposalDesignStudio.tsx` (and optionally in the proposal draft view) that:
- Deletes existing blocks (after confirmation if they exist)
- Re-fetches `proposal_sections` and `organization_brand_guidelines`
- Runs the smart layout engine to regenerate all blocks
- Applies the default brand guideline or best-matching template

This is essentially a "regenerate design from content" action exposed as a one-click UX.

#### 3. Pexels Stock Image Search
**Edge function**: `search-stock-images/index.ts` — proxies requests to `https://api.pexels.com/v1/search` with the API key stored as a Supabase secret.

**UI**: Add a "Search Stock Images" tab/button to `ImageBlock.tsx` and `CoverBlock.tsx`:
- Opens a dialog with a search input
- Shows image grid from Pexels results
- Click to insert image URL into the block

**AI suggestion**: When generating blocks, auto-populate a `suggestedImageQuery` field in image block content based on the preceding section title (e.g., "cybersecurity consulting" for a "Solution" section about cybersecurity).

#### 4. No Database Changes Required
The existing `proposal_designs` table and `organization_brand_guidelines` table already cover all storage needs. No new tables needed.

### File Changes

| File | Change |
|---|---|
| `useProposalDesign.ts` | Add `mapSectionToBlocks()` function with keyword-based layout mapping; add `regenerateDesign()` method returned from hook |
| `ProposalDesignStudio.tsx` | Add "Generate Designed Proposal" button that calls `regenerateDesign()` |
| **New: `supabase/functions/search-stock-images/index.ts`** | Pexels API proxy edge function |
| **New: `src/components/project/design-studio/StockImageSearch.tsx`** | Dialog component with search input + image grid |
| `blocks/ImageBlock.tsx` | Add "Search Stock Images" button that opens `StockImageSearch` dialog |
| `blocks/CoverBlock.tsx` | Add "Search Stock Images" option alongside upload |
| `supabase/config.toml` | Add `[functions.search-stock-images]` with `verify_jwt = false` |

### Implementation Order

1. Add Pexels API key as Supabase secret
2. Create `search-stock-images` edge function
3. Build `StockImageSearch` dialog component
4. Add stock image search to `ImageBlock` and `CoverBlock`
5. Build smart `mapSectionToBlocks()` layout engine
6. Add `regenerateDesign()` to `useProposalDesign` hook
7. Add "Generate Designed Proposal" button to `ProposalDesignStudio`
8. Deploy edge function


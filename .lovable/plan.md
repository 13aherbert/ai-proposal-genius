

## Auto-Insert Pexels Images During Design Generation

### Problem
Currently, the layout engine only adds empty image blocks with a `suggestedImageQuery` field for "solution"/"overview"/"company" sections. Users must manually search and select images. Other visual sections (case studies, methodology, team) get no image blocks at all.

### Changes

#### 1. Add more image blocks across section types in `mapSectionToBlocks()`

**File:** `useProposalDesign.ts` — `mapSectionToBlocks()` function

Add image blocks with `suggestedImageQuery` to these additional section types:
- `case_study` / `experience` — after text
- `methodology` / `approach` — after text, before divider
- `team` / `personnel` — after text
- `executive_summary` — after text

Each gets a contextual `suggestedImageQuery` derived from `extractImageQuery()`.

#### 2. Auto-fetch Pexels images during generation

**File:** `useProposalDesign.ts` — new `autoPopulateImages()` async function

After `mapSectionToBlocks()` builds all blocks, iterate over image blocks that have a `suggestedImageQuery` but no `url`. For each, call the `search-stock-images` edge function and pick the first result's `large` URL. This runs during both `createNewDesign()` and `regenerateDesign()`.

```text
blocks = mapSectionToBlocks(...)
blocks = await autoPopulateImages(blocks)  // fills empty image URLs
```

Logic:
- Collect all image blocks with `suggestedImageQuery` and empty `url`
- Batch queries (max 5-6 to avoid slowness)
- Call `supabase.functions.invoke('search-stock-images', { body: { query, per_page: 1 } })`
- Set `block.content.url` to first photo's `large` src
- Set `block.content.caption` to photographer credit
- If any call fails, leave the block empty (graceful fallback)

#### 3. Also auto-populate cover image

In `createNewDesign()` and `regenerateDesign()`, after building blocks, find the cover block and if it has no `coverImageUrl`, fetch a relevant image using the project title as query and set it.

### File Changes

| File | Change |
|------|--------|
| `useProposalDesign.ts` | Add image blocks to more section types in `mapSectionToBlocks()`; add `autoPopulateImages()` function; call it in `createNewDesign()` and `regenerateDesign()` |

No database changes. No new files. No edge function changes.

### Implementation Notes
- Parallel fetch all image queries using `Promise.allSettled` to avoid one failure blocking everything
- Cap at 6 concurrent image fetches to keep generation fast (<3s)
- Users can still replace/remove any auto-inserted image via existing UI


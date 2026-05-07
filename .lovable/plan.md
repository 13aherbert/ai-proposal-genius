## Goal
Sections in both the Review tab and Proposal Draft tab must display in the saved outline order (`sort_order` ascending), matching the Compiled view.

## Root cause
- `src/components/project/review/ReviewQueue.tsx` re-sorts sections by workflow status → "assigned to me" → `updated_at DESC`, which throws away outline order entirely.
- `src/components/project/proposal-draft/ProposalDraft.tsx` (`filteredSections`) preserves the array as returned by the hook, but there is no defensive resort. Any stale optimistic cache write from `reorderSectionsMutation` (or legacy data without `sort_order`) can make the displayed order drift from the database.

## Changes

### 1. `src/components/project/review/ReviewQueue.tsx`
- Replace the priority/me/updated_at sort in `filteredSections` with a strict `sort_order ASC` sort (with `created_at` as tiebreaker).
- Keep the status filter as-is.
- Remove the now-unused `currentUserId` priority logic from this sort (status grouping is already exposed via the filter chips above the list, so reordering the rows is unnecessary and confusing).

### 2. `src/components/project/proposal-draft/ProposalDraft.tsx`
- In `filteredSections`, defensively sort by `sort_order` (ascending), then `created_at` ascending, before applying status/myOnly filters. This guarantees the Draft list matches the outline regardless of cache state.

### 3. `src/components/project/proposal-draft/useProposalSections.ts`
- In `reorderSectionsMutation`, when writing the optimistic cache via `setQueryData`, ensure the array is sorted by the new `sort_order` (it already is, but make this explicit to prevent regressions).
- No schema change needed — `sort_order` already exists and is populated correctly (verified against DB for the current project).

## Out of scope
- No database migration. Existing rows already have correct `sort_order` values (verified via direct query).
- No changes to Compiled view or Auto-Generated proposal — those already respect order.

## Verification
- Open Review tab: sections appear top-to-bottom in outline order (Executive Summary → Conclusion), independent of workflow status or last-edited time. Filter chips still narrow the list by status.
- Open Proposal (Draft) tab: same outline order.
- Drag-reorder a section in Draft, refresh, then open Review tab: new order persists in both tabs.

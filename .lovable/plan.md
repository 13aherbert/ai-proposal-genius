## Real root causes

1. **Status pill doesn't open a dropdown for solo / non-team users.**
   In `SectionEditor.tsx`:
   ```ts
   const currentMember = members.find(m => m.user_id === currentUserId);
   const isAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";
   const isReviewer = isAdmin;
   const isAssignee = section.assigned_to === currentUserId;
   ```
   For a solo project, `members` is empty → `currentMember` is `undefined` → `isAdmin`, `isReviewer`, `isAssignee` are all `false`. `SectionStatusControl` then computes zero transitions and falls through to the **static `<span>` branch** with no click handler. Clicking it bubbles up to `CardHeader.onClick={onSelect}`, which just expands/collapses the section.

2. **"Generate with AI" still reads as a stacked row.**
   The button was moved into its own `flex justify-end` row at the top of `CardContent`, which still consumes a full row above the editor. The user wants it truly inline with the section title bar.

## Changes

### `src/components/project/proposal-draft/SectionEditor.tsx`
- **Permission fallback for solo users:** when there's no `currentMember` record at all, treat the current user as admin for workflow purposes:
  ```ts
  const isAdmin = !currentMember || currentMember.role === "owner" || currentMember.role === "admin";
  ```
  Keep `isReviewer = isAdmin` and `isAssignee` as-is. This guarantees `SectionStatusControl` always has at least one transition for solo users, so it renders the interactive button (with `stopPropagation` already in place) instead of the static span.
- **Move "Generate with AI" into the section header**, immediately to the left of the expand/collapse chevron, as a small icon-style button (`size="sm"`, `h-8`, brand-green styling, `Wand2` icon, label hidden on small screens via `sr-only`/`hidden sm:inline`). Wire `onClick` to call `generateContent` and `e.stopPropagation()` so clicking it doesn't toggle expand. Hide it when `isReadOnly`.
- **Remove the now-redundant standalone "Generate with AI" row** from `CardContent`. Keep the `AIProgress` indicator inside `CardContent` (just below the read-only notice) so progress still shows when generation is running.
- Result: the expanded card's first visual element below the header is the editor itself, eliminating the extra whitespace.

### `src/components/project/proposal-draft/components/SectionStatusControl.tsx`
- Defensive: also call `e.stopPropagation()` in `onPointerDown` of the trigger button so Radix's pointer-down open path can't accidentally let the click bubble to the parent header in any browser.

## Out of scope
- No DB changes.
- No changes to the Review tab status flow (already wired through `useSubmitReview`).

## Verification
- As a solo user (no member rows), open the Draft tab, click the status pill on a section → dropdown opens with "Submit for Review" (and "Revert to Draft" once not in draft). Clicking the pill no longer toggles expand/collapse.
- Expand a section: the "Generate with AI" button is visible inline in the header to the left of the chevron; the body of the expanded card shows the editor immediately, with no extra row above it.
- "Generate with AI" still works and the progress bar still appears while generating.

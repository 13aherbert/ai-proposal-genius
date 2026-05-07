## Issues
1. The new `SectionStatusControl` (clickable status badge) is gated behind `showTeamFeatures` (`plan !== "starter" && members.length > 1`), so solo users still see only a static badge with no way to change status.
2. When a section is expanded in the Draft view, there's excessive vertical whitespace between the title row, the status, and the "Generate with AI" button — caused by full `CardHeader` bottom padding plus a full-width "Generate with AI" button taking its own row at the top of `CardContent`.

## Changes

### `src/components/project/proposal-draft/SectionEditor.tsx`
- **Always render `SectionStatusControl`** (drop the `showTeamFeatures` ternary that falls back to the static `WorkflowStatusBadge`). Status changes apply to all users; team-only controls (assignee, due date) stay gated.
- **Tighten expanded spacing:**
  - Add `pb-2` to `CardHeader` when `isSelected` so the header doesn't keep its full bottom padding when expanded.
  - Reduce `CardContent` top spacing: change `space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0` to `space-y-2 sm:space-y-3 p-3 sm:p-6 pt-2`.
  - Move the "Generate with AI" button inline (right-aligned, `size="sm"`, `w-auto`) instead of a full-width row, so it sits compactly above the editor without dominating the top of the expanded area. Keep it hidden when `isReadOnly`.
- Remove the now-unused `WorkflowStatusBadge` import.

## Verification
- As a solo (single-member) user, click the status pill on any section in the Draft tab → dropdown opens with "Submit for Review" / etc.
- Expand a section: the gap between the title bar and the editor is visibly reduced; "Generate with AI" sits as a small inline button on the right rather than a full-width bar.

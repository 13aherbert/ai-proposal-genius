
## Streamline Proposal Draft Page

### Problems Found

1. **Duplicate progress bars**: ContentGenerationButton has its own built-in progress display, AND ProposalDraft renders a separate AIProgress component. Both show during content generation.
2. **Duplicate strict mode alerts**: Two nearly identical info boxes appear when strict mode is toggled on (one outside and one inside the settings panel).
3. **BackupManager uses two header buttons**: "Save Backup" and "Backup Options" -- the manual save action should live inside the Backup Options dialog to reduce header clutter.
4. **Destructive "Delete All" button sits at the same level as creative actions**: It has equal visual weight to "Add Section" and "Generate All Content", making the toolbar feel cluttered and risky.
5. **Content Generation settings panel always visible**: The collapsible `<details>` block with strict mode and KB validation sits inline even when users have no intent to generate, adding visual noise.

---

### Changes

**1. Remove duplicate progress bar from ProposalDraft.tsx**

Remove the `AIProgress` component (lines 145-152), the `generationProgress` and `isGenerating` state variables, and the `handleProgressUpdate` callback. ContentGenerationButton already handles its own progress display internally -- the parent wrapper is redundant.

**File:** `src/components/project/proposal-draft/ProposalDraft.tsx`

---

**2. Remove duplicate strict mode alert from ContentGenerationButton.tsx**

Remove the standalone strict mode alert at lines 103-113 (outside the settings panel). The identical alert inside the `<details>` panel (lines 146-153) is sufficient since that is where the toggle lives.

**File:** `src/components/project/proposal-draft/components/ContentGenerationButton.tsx`

---

**3. Consolidate BackupManager into a single button**

Remove the standalone "Save Backup" button. Move the manual save action inside the "Backup Options" dialog as a third option alongside Export and Import. Rename the trigger button to just "Backups" for brevity.

**File:** `src/components/project/proposal-draft/BackupManager.tsx`

---

**4. Move "Delete All Sections" into a dropdown menu**

Replace the prominent red "Delete All Sections" button with a small icon-only "more actions" dropdown (using the existing `DropdownMenu` component). The dropdown will contain "Delete All Sections" as a destructive menu item. This de-emphasizes the destructive action and frees up toolbar space.

**File:** `src/components/project/proposal-draft/ProposalDraft.tsx`

---

**5. Flatten ContentGenerationButton to just the button**

Move the settings panel (strict mode toggle, KB validation) into a popover or dialog that opens when the user clicks a small settings icon next to the "Generate All Content" button, instead of always rendering a collapsible block inline. The generation button itself stays in the toolbar row alongside other action buttons.

**File:** `src/components/project/proposal-draft/components/ContentGenerationButton.tsx`

---

### Result

The toolbar shrinks from 4 full-width buttons + a settings block to a clean row:
- "Add Section" button
- "Create Sections from Outline" button (conditional)
- "Generate All Content" button with a small settings gear icon
- A "more actions" icon button (containing Delete All)

The header simplifies from 2 backup buttons to 1 "Backups" button. One progress bar instead of two. One strict mode alert instead of two.

### Technical Summary

| Change | File | Effort |
|--------|------|--------|
| Remove duplicate progress bar | `ProposalDraft.tsx` | Small |
| Remove duplicate strict mode alert | `ContentGenerationButton.tsx` | Small |
| Consolidate BackupManager buttons | `BackupManager.tsx` | Small |
| Move Delete All to dropdown | `ProposalDraft.tsx` | Small |
| Move generation settings to popover | `ContentGenerationButton.tsx` | Medium |

No new dependencies needed -- uses existing DropdownMenu and Popover components from shadcn/ui.

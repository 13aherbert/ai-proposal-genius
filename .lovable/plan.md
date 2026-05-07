## UX Review — Project Editing Experience

Reviewed: `ProjectDetails` page → `ProjectHeader` + `ProjectSidebar` + `ProjectContent` (Overview / Analysis / Proposal / Review / Design), plus the `ProjectInfoCard` (Details, Documents, Automated Proposal Creation) shown on Overview.

### Issues found

1. **Overview is overloaded.** `ProjectInfoCard` stacks four heavy zones in one card: Details grid, Edit form toggle, Documents block, *and* the full Automated Proposal Creation panel. New users land here and immediately face ~6 buttons (Edit, View RFP, Add Document, Start, Reset, Stop) plus a 5‑row step list and a tips alert. Cognitive overload.

2. **Duplicated/competing CTAs.**
   - "View RFP Document" + "Add Document" are styled as primary green buttons — same weight as the main automation "Start" CTA. Three primary actions compete for attention.
   - "Edit Details" is an outlined button in the card header that toggles the entire card into a form, hiding Documents and Automation. An inline pencil icon on the details row would be lighter.

3. **Automated Proposal Creation panel is verbose.**
   - Always‑visible "About Automated Proposal Creation" tips alert (5 bullets) is onboarding noise after the first run.
   - Step list shows numbered circle + title + description + status badge + status icon — 4 redundant signals per row.
   - Reset/Stop/Start render as 3 separate buttons; only one is meaningful at a time.
   - Header has its own progress block while a duplicate "Step Progress" bar appears in the Current Step alert.

4. **Sidebar + sub‑tabs create two navigation layers.** Sidebar has Overview / Analysis / Proposal / Review / Design. Then Analysis has tabs (Summary, Outline) and Proposal has tabs (Draft, Compiled, Auto‑Generated). Locked items appear in *both* layers with `Lock` icons + `TierBadge`, doubling the upgrade noise. Many sub‑tabs are also reachable via the top‑level sidebar concept.

5. **Lock affordances are inconsistent.** Sidebar shows `Lock + TierBadge`. Proposal tabs show `Lock` only. Analysis tabs are `disabled` with no lock icon. Inside, locked content swaps between `GatedFeature` (rich upsell) and `FeatureLocked` (small card) — three different patterns for the same concept.

6. **"Test mode active" + presence avatars + automation alerts** all stack at the top of the content pane on Overview, pushing actual project info below the fold on a 1067px viewport.

7. **Project header is bare.** Just back arrow + title. Status, deadline, and client (currently buried in the Details grid) are the highest‑signal facts and belong here as small meta chips.

### Proposed changes

**A. Restructure the Overview tab**
- Replace the single mega‑card with a 2‑column responsive layout:
  - Left (2/3): **Project Details** card (read‑only by default, inline pencil → modal/drawer for edit; remove the full‑card toggle).
  - Right (1/3): **Documents** card (compact list, single "Add" icon‑button, RFP shown as the first pinned row with a "View" link instead of a primary button).
- Move **Automated Proposal Creation** into its own collapsible card *below* details, collapsed by default once any step has completed. First‑time users see it expanded.

**B. Promote key meta to `ProjectHeader`**
- Add a row under the title with: status pill, due‑date chip, client name. Remove these duplicates from the Details grid.

**C. Simplify the Automation panel**
- Single split‑button: primary action = `Start` / `Resume` / `Stop` based on state; secondary "Reset" hidden in an overflow (`⋯`) menu.
- Collapse the "About Automated Proposal Creation" alert into a small "?" tooltip next to the title.
- Drop the per‑row description on completed steps; show description only for the current step (already in the blue alert).
- Remove the duplicate Step Progress bar — keep only the overall progress in the header.
- Replace numbered circle + status icon with a single icon (the icon already encodes state).

**D. Flatten navigation**
- Keep sidebar sections, but remove duplicate `Lock + TierBadge` from sidebar items whose locked state is already shown by the in‑content `GatedFeature` (sidebar shows just `Lock`, single source of upsell copy).
- In `UnifiedAnalysisView`: standardize on `GatedFeature` (delete the `FeatureLocked` card) so all locked states look identical.
- Consider merging "Compiled" into Draft as a view‑mode toggle (Draft | Compiled) at the top of the editor — they're the same data, different presentation. Frees a tab and reduces tier confusion.

**E. Top‑of‑content stacking**
- Move the presence avatars into `ProjectHeader` (right side). Keep the Test‑mode banner but make it dismissible per session.

### Files to change

- `src/components/project/info/ProjectInfoCard.tsx` — split layout, remove full‑card edit toggle.
- `src/components/project/info/ProjectDetails.tsx` — remove status/client/deadline (moved to header), add inline edit affordance.
- `src/components/project/info/ProjectDocuments.tsx` — demote button styles, compact RFP row.
- `src/components/project/AutomatedProposalCreation.tsx` — split button, collapsible info, dedupe progress, simplify rows; wrap in a `Collapsible` shell.
- `src/components/project/details/ProjectHeader.tsx` — add status/deadline/client meta row + presence slot.
- `src/components/project/details/ProjectContent.tsx` — move presence into header; tidy banner stacking.
- `src/components/project/details/ProjectSidebar.tsx` — remove `TierBadge` from sidebar items (keep `Lock`).
- `src/components/project/unified-analysis/UnifiedAnalysisView.tsx` — replace `FeatureLocked` with `GatedFeature`.
- `src/components/project/unified-proposal/UnifiedProposalView.tsx` — collapse Draft+Compiled into one tab with a view toggle (optional, requires confirmation).

### Open questions

1. Confirm you're happy collapsing **Draft + Compiled** into one tab with a view toggle (D above)? It's the biggest reduction but changes user habits.
2. Should **Edit Details** become a side drawer or a modal? (Drawer keeps Documents/Automation visible.)
3. Keep the "About Automated Proposal Creation" tips behind a `?` tooltip, or remove entirely after first run?

No DB / RLS / edge‑function changes — pure front‑end UX work.

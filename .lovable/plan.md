
Diagnosis confirmed:
1) The green “Project Plan & Timeline” text is coming from Markdown rendered inside a Text block (`TextBlock.tsx`), not from a Heading block.
2) Global typography config hard-codes all `h3` tags to green in `tailwind.config.ts` (`typography.DEFAULT.css.h3.color = '#34D399'`), so Markdown `###` headings render green regardless of proposal branding.
3) The `**` seen in editor is raw Markdown in the textarea (source mode), not preview rendering.

Implementation plan:
1) Remove hard-coded green `h3` typography rule from `tailwind.config.ts` (set to `inherit` like h1/h2/h4).
2) Add explicit Markdown heading renderers in `TextBlock.tsx` (`h1`–`h4`) so preview headings use proposal branding (`settings.primaryColor`, `settings.headerFont`) and no global prose color leaks in.
3) Normalize generated markdown heading lines in `useProposalDesign.ts` when creating text blocks (convert patterns like `### **Title**` → `### Title`) to reduce noisy `**` in editor-generated content.
4) Keep existing textarea editor behavior (raw markdown), but ensure generated content is cleaner by default after regeneration.

Validation plan:
1) Regenerate Designed Proposal.
2) Confirm “Project Plan & Timeline” in Preview matches brand color/font (not green).
3) Confirm timeline/cost sections still render tables correctly.
4) Confirm generated markdown no longer includes `**` around heading text for new regenerations.
5) Verify one existing proposal and one newly regenerated proposal end-to-end in Preview + Editor tabs.

Technical details:
- Files to update:
  - `tailwind.config.ts`
  - `src/components/project/design-studio/blocks/TextBlock.tsx`
  - `src/components/project/design-studio/useProposalDesign.ts`
- No DB or Edge Function changes required.

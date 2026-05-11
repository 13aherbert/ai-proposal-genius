## Starter tier: Compiled/Split view + watermarked exports

### Goal
- Starter users can use **Compiled** and **Split** views in the proposal editor.
- Starter users can export the proposal as **PDF** and **Word (.doc / .docx)**.
- Starter exports include a **watermark** that contains a phrase ("Generated with OptiRFP Free — Upgrade to remove watermark") and the **OptiRFP logo**. No watermark for Growth+.

### Changes

**Tier matrix**
- `src/hooks/subscription/feature-access.ts` — add `starter` to `compiled_draft`. Leaves `data_export` unchanged (we don't gate the new Starter export through it; that map is still used for Design Studio export).

**Editor toggles (no more lock)**
- `src/components/project/unified-proposal/UnifiedProposalView.tsx`
  - Remove `compiledLocked` derivation and the `disabled`/`Lock` icon on the Compiled and Split `ToggleGroupItem`s.
  - Remove the `<GatedFeature requiredTier="growth">` wrappers around the Compiled and Split panels — render `ProposalDraft` (and the resizable split layout) directly.
  - `Auto-Generated` tab remains gated to `business`.

**Export from Compiled view (available to all tiers)**
- `src/components/project/proposal-draft/components/CompiledView.tsx`
  - Replace the existing `Print` button with an **Export** `DropdownMenu`: items for `Print`, `Export as PDF`, `Export as Word (.docx)`, `Export as Word (.doc)`. Keep `Copy All` and ToC toggle.
  - Calls `supabase.functions.invoke('export-proposal-pdf', { body: { projectId, plan, format } })`. For `pdf` it opens a print window with the returned HTML (existing pattern). For `docx`/`doc` it downloads a Blob from the returned base64 payload + filename.
  - Inline watermark already shown in compiled view for `plan === 'starter'`; updated to include the OptiRFP logo image alongside the existing phrase.

**Edge function — `supabase/functions/export-proposal-pdf/index.ts`**
- Accept either `{ designId, plan, format? }` (existing Design Studio path) **or** `{ projectId, plan, format }` (new lightweight Starter path).
- New `projectId` path: load `projects` row + ordered `proposal_sections`, render a simple branded HTML document (project title, section headings, section HTML content sanitized, doc stats footer).
- `format`:
  - `pdf` (default) → return `{ html }` as today (client opens print dialog and "Save as PDF").
  - `docx` → return `{ filename, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', base64 }`. Build a minimal valid `.docx` zip whose `word/document.xml` contains an `altChunk` referencing an embedded HTML part with the same body — Word renders the HTML faithfully (including the watermark block).
  - `doc` → return `{ filename, mimeType: 'application/msword', base64 }` containing Word-compatible HTML with `xmlns:o="urn:schemas-microsoft-com:office:office"` etc. Opens natively in Word & Google Docs.
- **Watermark application** (when `plan === 'starter'` and not on a paid trial):
  - HTML/PDF: keep the existing fixed footer band but add `<img src="<absolute logo URL>" />` next to the phrase. Use the public Lovable upload URL for the logo so it renders in the print window and inside Word's HTML import.
  - DOCX/DOC: append a footer paragraph with the same logo + phrase at the end of the body (Word renders embedded `<img>` from the public URL on import).
  - Logo source: `${origin}/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png` passed from the client as `logoUrl` in the body so the function doesn't need to know the deployed origin.

**Watermark phrase**
- "Generated with OptiRFP Free — Upgrade to remove watermark"

### Out of scope
- Design Studio export gating stays at Growth+ (this PR only adds a separate, simpler Starter export path).
- No DB changes. No new RLS. Edge function uses existing service-role client + `projects`/`proposal_sections` RLS-safe reads (already in place).
- No layout, Auto-Generated tab, or Evaluation gating changes.

### Files touched
- `src/hooks/subscription/feature-access.ts`
- `src/components/project/unified-proposal/UnifiedProposalView.tsx`
- `src/components/project/proposal-draft/components/CompiledView.tsx`
- `supabase/functions/export-proposal-pdf/index.ts`

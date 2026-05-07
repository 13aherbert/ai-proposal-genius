
## Design Studio — UX Audit & Redesign Plan

After reviewing `ProposalDesignStudio.tsx`, the canvas system (`CanvasEditor`, `CanvasPage`, `CanvasElement`, `InsertSidebar`, `FloatingToolbar`, `autoLayout.ts`, `elementFactory.ts`, `TextRenderer`), and the live state of project `df1ae5e9…`, the default Design output is genuinely hard to use. Below is a critique grouped by severity, then a focused fix plan.

### Critical UX problems with the default design

1. **Auto-layout produces overlapping / clipped text.**
   `autoLayout.ts` estimates text height with a fixed glyph-width constant (`AVG_CHAR_WIDTH = 0.52`) and renders into absolutely-positioned boxes with `overflow:hidden` (`TextRenderer` style). Real fonts wrap differently, so paragraphs routinely render taller than the box → bottom lines are clipped, and the next block sits on top of them.
2. **Body text is split mid-sentence across pages.**
   `addText()` slices the *plain-text* string at a character cut, then re-wraps the *remaining* text as `<p>${remaining}</p>` — losing the original HTML, lists, links, bold/italic. The page break is purely visual and breaks reading flow.
3. **Cover page uses hard-coded coordinates.**
   Title is pinned at `y = PAGE_H * 0.4` with width = full content width, so long titles wrap, push into the subtitle, and the date sits at the bottom margin regardless of what's above it.
4. **Tables and TOC are silently dropped** (`case 'toc': break;`, table case missing). A user who built a careful proposal sees content disappear with no warning.
5. **Default zoom is too small.**
   `useState(0.6)` on an 816×1056 page inside a `h-[calc(100vh-280px)]` container at 1067px viewport → the page is tiny, text renders below the legibility threshold, and "Fit" recomputes to ~0.55 making it worse.
6. **Insert sidebar is icon-only with no labels.**
   Five tabs (`Type`, `Square`, `ImageIcon`, `Palette`, `Layout`) of unlabeled 14px icons — discoverability is near zero. Icons (`Star`, `Heart`, etc.) show only the first 2 characters of the name as a placeholder.
7. **No templates / no thumbnails.**
   Pages tab is just "Page 1 (3)" text rows. There's no page thumbnail strip, no template library in canvas mode, no way to preview a layout before applying it.
8. **Branding (colors / fonts) is unreachable from canvas mode.**
   `BrandingCustomizer` only renders in classic view, but canvas mode is the default. Users have to switch out of the canvas (losing context) just to change brand colors.
9. **"Re-import from Proposal" is one-click destructive.**
   The AlertDialog warns, but there's no "merge" or "import only new sections" option, so users avoid using it after any manual edit.
10. **No alignment guides, snapping, rulers, or grid.**
    Free-form drag with no visual aid → hand-built layouts look ragged.
11. **Save / autosave state is invisible.**
    `isSaving` is passed only into `ExportPanel`; users don't see when changes are persisted.
12. **No print/export preview that matches the canvas.**
    Preview tab only exists in classic view; canvas has no "see what the PDF will look like" affordance.

### Plan — phased fixes

**Phase 1 — Fix the default output (highest leverage)**

- **Replace heuristic text sizing with real measurement.** Add a hidden offscreen measurement node (matching `fontFamily`, `fontSize`, `lineHeight`, `width`) to compute actual rendered height for each text block before placing it. Use this in `autoLayout.ts` instead of `approxTextHeight`.
- **Stop clipping text boxes.** Change `TextRenderer` style from `overflow: hidden` to `overflow: visible` and make the element height **auto-grow** based on content (use a `ResizeObserver` on the editor to write `height` back to the element). This eliminates the truncation problem entirely.
- **Preserve HTML when paginating long text.** Rewrite `addText()` to walk the parsed HTML node-by-node (paragraphs, list items), measure each, and break at paragraph boundaries — never mid-sentence. Carry the original markup forward.
- **Render TOC and tables.** Add `addToc()` (text list of headings, hyperlinked to page numbers) and `addTable()` (group of shape + text cells). Stop silently dropping content.
- **Cover page becomes flow-based.** Center title vertically based on its measured height + subtitle + date stack; cap title width at 80% of content width for better line breaks.

**Phase 2 — Sensible defaults & legibility**

- **Default zoom = "Fit width"** rather than a fixed 0.6, computed on first mount and re-applied when the side panels resize.
- **Add a visible page thumbnail rail** on the left (replacing the bare "Pages" tab), so users can jump between pages and reorder via drag.
- **Promote alignment guides + snap** when dragging (snap to page center, margins, and other elements; show 1px guide lines).

**Phase 3 — Discoverability of the sidebar**

- **Label every tab** (`Text`, `Shapes`, `Images`, `Background`, `Pages`) — keep icons but show text on ≥md viewports.
- **Real icon previews** in the icons grid — render the actual lucide icon, not the first 2 letters.
- **Surface BrandingCustomizer in canvas mode** as a "Brand" tab in the sidebar, so colors/fonts/logo are one click away.
- **Add a Templates tab** in canvas mode listing the existing `templates.ts` entries with thumbnails; selecting one rebuilds the canvas (with confirm).

**Phase 4 — Editing affordances**

- **Persistent top toolbar** for the selected element (font family, size, weight, color, alignment) instead of only the floating one — the floating toolbar can stay for quick actions.
- **Visible save state** ("Saved · 2s ago" / "Saving…") next to the zoom controls.
- **Non-destructive re-import**: change "Re-import from Proposal" to offer "Replace all" vs "Append new sections only" (diff by section id).
- **Inline preview / export**: add a "Preview" mode toggle in canvas (renders pages stacked, no chrome) so the user can see the export result without leaving the editor.

### Files that will change

- `src/components/project/design-studio/canvas/autoLayout.ts` — real measurement, HTML-preserving pagination, TOC + table, cover layout.
- `src/components/project/design-studio/canvas/elements/TextRenderer.tsx` — auto-grow height, no clipping.
- `src/components/project/design-studio/canvas/CanvasEditor.tsx` — fit-width default, save indicator, preview toggle, top toolbar slot.
- `src/components/project/design-studio/canvas/CanvasElement.tsx` / new `hooks/useSnapGuides.ts` — snapping & guides during drag.
- `src/components/project/design-studio/canvas/sidebar/InsertSidebar.tsx` — labelled tabs, real icons, new Brand and Templates tabs, page thumbnails.
- `src/components/project/design-studio/ProposalDesignStudio.tsx` — non-destructive re-import options; remove the canvas-mode lockout of branding.

### Out of scope (flag for later)

- Replacing the canvas engine with a third-party library (e.g. tldraw, fabric).
- Multi-user real-time collaboration on the canvas.
- AI-driven layout suggestions ("rebalance this page").

### Suggested rollout

Phase 1 alone resolves the "near unusable" complaint. Phases 2–4 make the studio competitive with Canva-class tools. I'd recommend approving Phase 1 first, shipping it, then validating with the same proposal before deciding the order of 2–4.

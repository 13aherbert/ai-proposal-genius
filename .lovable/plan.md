
## Canva-Style Proposal Design Studio — Implementation Plan

### Vision
Replace the current vertical block-flow editor with a **free-form, fixed-page canvas** where users click any element to select it, drag to move, resize via handles, and edit properties through a contextual floating toolbar — exactly like Canva, Figma, or Google Slides.

### Architecture Overview

**Page model:** Discrete US-Letter pages (816×1056 px @ 96dpi, 8.5×11"). Each page is a fixed-size canvas scaled to fit the viewport (similar to the slide-app pattern in this codebase). Users see exactly what each PDF page will look like.

**Element model:** Every element on a page is an absolutely-positioned object with `{x, y, width, height, rotation, zIndex}` plus type-specific properties. No more vertical block flow — a page can hold any combination of text boxes, images, shapes, and decorations placed anywhere.

---

### Phase 1 — Data Model & Foundation

**New types** (`src/components/project/design-studio/canvas/types.ts`):
```ts
type CanvasElementType = 'text' | 'heading' | 'image' | 'shape' | 'icon' | 'line' | 'divider' | 'table';

interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number; y: number;           // top-left in page coordinates (816×1056)
  width: number; height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  // Type-specific
  text?: { html: string; fontFamily: string; fontSize: number; fontWeight: number;
           color: string; align: 'left'|'center'|'right'|'justify';
           lineHeight: number; letterSpacing: number };
  image?: { url: string; objectFit: 'cover'|'contain'; cropX: number; cropY: number;
            cropW: number; cropH: number; opacity: number; borderRadius: number;
            shadow: string; filter: string };
  shape?: { kind: 'rect'|'circle'|'triangle'|'line'|'arrow';
            fill: string; stroke: string; strokeWidth: number;
            borderRadius: number; shadow: string; opacity: number };
  icon?: { name: string; color: string; strokeWidth: number };
}

interface CanvasPage {
  id: string;
  background: { type: 'solid'|'gradient'|'image'|'pattern';
                color?: string; gradient?: {from: string; to: string; angle: number};
                imageUrl?: string; overlayOpacity?: number };
  elements: CanvasElement[];
}

interface CanvasDocument {
  pages: CanvasPage[];
  pageSize: { width: number; height: number };  // default 816×1056
}
```

**Storage strategy:** Extend `proposal_designs.content_blocks` to also store the new `pages: CanvasPage[]` shape. Keep the legacy block array for one release to support migration. A migration utility converts each existing block into elements on auto-paginated pages (heading → text element, image block → image element, etc.).

**No DB migration required** in Phase 1 — the JSONB `content_blocks` column already accepts the new shape. We add a `schema_version` field to `design_settings` to distinguish v1 (blocks) from v2 (pages).

---

### Phase 2 — Canvas Renderer & Selection

**New components under `src/components/project/design-studio/canvas/`:**

| Component | Responsibility |
|---|---|
| `CanvasEditor.tsx` | Top-level orchestrator: pages list, zoom controls, page navigation, keyboard shortcuts |
| `CanvasPage.tsx` | One page; fixed 816×1056 with `transform: scale()` to fit viewport; renders background + elements |
| `CanvasElement.tsx` | Wraps any element with selection ring, drag handlers, resize handles (8 corners/edges), rotate handle |
| `SelectionLayer.tsx` | Draws marquee selection, alignment guides (snap to other elements / page center), distance hints |
| `useCanvasInteraction.ts` | Hook managing pointer events: drag-to-move, drag-to-resize, marquee select, multi-select with Shift |

**Interaction details:**
- Click an element → selects it (blue outline + 8 resize handles + rotate handle)
- Drag empty space → marquee multi-select
- Drag selected element → move with snap-to-guide (page center, edges, sibling element edges)
- Resize handles → corner = proportional with Shift, edge = single-axis
- Arrow keys nudge by 1px (10px with Shift)
- Cmd/Ctrl+D duplicate, Delete to remove, Cmd+] / Cmd+[ for layer order
- Double-click text element → enter inline TipTap edit mode

---

### Phase 3 — Floating Contextual Toolbar

**`FloatingToolbar.tsx`** — appears just above the selected element(s) and changes based on selection type. Built on Radix Popover + Floating UI for positioning.

**Text/heading toolbar:**
- Font family picker (Google Fonts list: Inter, Roboto, Playfair, Montserrat, Lora, etc., loaded on demand)
- Font size (slider + numeric input, 8–144px)
- Bold / Italic / Underline / Strikethrough
- Color picker (with brand palette swatches from `design_settings`)
- Alignment (left/center/right/justify)
- Line height, letter spacing (popover sub-menu)
- Bullet/numbered list (when in inline edit mode)

**Image toolbar:**
- Replace (upload / Pexels stock search — reuse existing `StockImageSearch`)
- Crop (drag mask within element bounds)
- Border radius slider
- Shadow presets (none/soft/medium/hard)
- Filter presets (none/grayscale/sepia/blur)
- Opacity slider
- Flip horizontal/vertical

**Shape toolbar:**
- Fill color, stroke color, stroke width
- Border radius (rect)
- Shadow, opacity

**Multi-select toolbar:**
- Align left/center/right/top/middle/bottom
- Distribute horizontally / vertically
- Group / ungroup
- Lock / unlock

---

### Phase 4 — Left Sidebar: Insert Panel

Tabs in a 280px left sidebar:

1. **Pages** — vertical thumbnails of every page; click to navigate; drag to reorder; "+ Add page" button; right-click for duplicate/delete; auto-thumbnails generated from canvas via `html2canvas` cached per page.
2. **Text** — preset text styles (Heading 1, Heading 2, Body, Caption, Quote) — click to drop a styled text box at page center.
3. **Elements** — Shapes (rectangle, circle, triangle, line, arrow, divider lines), Icons (Lucide library, searchable), Stickers/decorations.
4. **Images** — Upload, recent uploads, Pexels search (reuse `StockImageSearch`), brand assets (logos pulled from `organization_brand_guidelines`).
5. **Backgrounds** — Per-page background editor: solid color, gradient (from/to/angle), image with overlay, pattern presets.
6. **Templates** — Existing template gallery, but each template now seeds a multi-page canvas document instead of blocks.
7. **Brand kit** — Brand colors, fonts, logos from `organization_brand_guidelines`, click to apply to selection.

---

### Phase 5 — Top Toolbar & Zoom

Replace current header buttons with:
- **Undo / Redo** (existing 30-state history extended to track per-element changes)
- **Zoom controls**: fit-to-width, 50%, 75%, 100%, 150%, 200% + Cmd+/- shortcuts; pinch-zoom on trackpad
- **Page navigator**: "Page 2 of 7" with prev/next arrows
- **Preview** (full-screen, no chrome)
- **Generate Designed Proposal** (regenerate from outline content, populates v2 pages)
- **Export** (PDF/DOCX — see Phase 7)
- **Share / Comments** (existing)

---

### Phase 6 — Auto-Layout & "Generate from Content"

The existing `mapSectionToBlocks()` and AI regeneration in `useProposalDesign.ts` will be rewritten as `mapSectionToCanvasPages()`:

- Each top-level section becomes one or more pages.
- A layout engine places: heading at top, body text in a column, optional image to the side based on section type.
- Templates define page **layout slots** (e.g., "title slot" at x=80,y=80,w=656,h=120) which the engine fills with content.
- Auto-pagination: if a text element overflows page height, split into a continuation text box on a new page (TipTap-based measurement to find break point).

This keeps the "click Generate Designed Proposal" magic but outputs Canva-style pages instead of blocks.

---

### Phase 7 — Export Pipeline

The existing `export-proposal-pdf` Edge Function expects HTML. Two options:

1. **Recommended (Phase 7a):** Render each canvas page to a self-contained `<div style="width:816px;height:1056px;position:relative">` with absolutely-positioned children, then forward to the existing PDF function with `@page { size: letter }` CSS. Each page wrapper gets `page-break-after: always`. Minimal Edge Function changes — just teach it to recognize the new HTML shape and disable its current section-flow CSS for v2 documents.
2. **DOCX:** Best-effort conversion — text elements become paragraphs with inline styles, images become inline images, shapes are flattened to images via server-side rasterization (or a "DOCX may lose free-form layout" warning; PDF is the high-fidelity export).

The export preview iframe (`ExportPreviewModal`) renders the same HTML for WYSIWYG verification.

---

### Phase 8 — Migration & Backward Compatibility

- New designs default to v2 (canvas) schema.
- Existing v1 designs (block array) keep working via a read-only legacy renderer + a one-click "Convert to canvas editor" button that runs the migration utility.
- The migration utility converts each block to one or more canvas elements on auto-sized pages so users don't lose work.

---

### Files to Create

```
src/components/project/design-studio/canvas/
├── types.ts                       # CanvasElement, CanvasPage, CanvasDocument
├── CanvasEditor.tsx               # Top-level editor
├── CanvasPage.tsx                 # Single page renderer
├── CanvasElement.tsx              # Element wrapper with selection/drag/resize
├── SelectionLayer.tsx             # Marquee + alignment guides
├── FloatingToolbar.tsx            # Contextual toolbar (text/image/shape variants)
├── toolbars/
│   ├── TextToolbar.tsx
│   ├── ImageToolbar.tsx
│   ├── ShapeToolbar.tsx
│   └── MultiSelectToolbar.tsx
├── sidebar/
│   ├── InsertSidebar.tsx          # Tabbed left panel
│   ├── PagesPanel.tsx
│   ├── TextPresetsPanel.tsx
│   ├── ElementsPanel.tsx          # Shapes, icons, dividers
│   ├── ImagesPanel.tsx
│   ├── BackgroundsPanel.tsx
│   └── BrandKitPanel.tsx
├── elements/
│   ├── TextElement.tsx            # TipTap inline edit
│   ├── ImageElement.tsx           # With crop/filter
│   ├── ShapeElement.tsx           # SVG-based shapes
│   └── IconElement.tsx            # Lucide icon renderer
├── hooks/
│   ├── useCanvasInteraction.ts    # Drag/resize/select pointer logic
│   ├── useAlignmentGuides.ts      # Snap-to-guide computation
│   ├── useCanvasZoom.ts
│   └── useCanvasHistory.ts        # Element-level undo/redo
├── utils/
│   ├── migrateBlocksToCanvas.ts   # v1 → v2 converter
│   ├── autoLayoutEngine.ts        # Section content → pages
│   ├── pageThumbnail.ts           # html2canvas thumbnails
│   └── exportHtml.ts              # Canvas → printable HTML
└── googleFonts.ts                 # Curated font list + loader
```

### Files to Modify

- `ProposalDesignStudio.tsx` — replace `BlockEditor`/`ProposalPreview` with new `CanvasEditor` for v2 docs (route legacy designs to old editor via schema_version check)
- `useProposalDesign.ts` — extend save logic for the `pages` field, update history to track element-level changes, rewrite `regenerateDesign` to call the new auto-layout engine
- `types.ts` — add `CanvasDocument` and `schema_version` to `DesignSettings`
- `ExportPanel.tsx` / `ExportPreviewModal.tsx` — switch to canvas-based HTML export for v2 docs
- `supabase/functions/export-proposal-pdf/index.ts` — accept the new fixed-page HTML shape and apply `@page { size: letter }` CSS for v2 documents

### Dependencies to Add

- `@dnd-kit/core` — already installed; reused for page reordering
- `@floating-ui/react` — toolbar positioning
- `html2canvas` — page thumbnails
- `react-colorful` — color picker (lightweight)
- Lucide icons (already installed) for icon library
- No heavy canvas library needed; pure DOM + CSS transforms keeps bundle slim and SSR-friendly

### Out of Scope for This Plan
- Real-time multi-user cursor collaboration on the canvas (presence indicators only)
- Animated/video elements
- Custom drawing/freehand tool
- Brand kit *editing* (existing flow stays; we just consume it)

### Risks & Mitigations
- **Bundle size**: lazy-load the entire `canvas/` folder via `React.lazy` so non-design-studio routes stay fast
- **Print fidelity**: PDF export uses fixed pixel coordinates @ 96dpi mapping cleanly to letter size — no reflow surprises
- **Mobile UX**: Canvas editor is desktop-first; mobile users see a read-only preview with comment-only access (matches current responsive strategy)
- **Migration risk**: legacy v1 editor stays available; users opt in to convert

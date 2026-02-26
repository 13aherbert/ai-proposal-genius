

## Proposal Design Studio -- Next Iteration Plan

### Current State Assessment

Phase 1 MVP is functional with: 5 templates, 9 block types, drag-and-drop editor, branding customizer (colors/fonts/margins), preview mode, and PDF export (HTML print fallback). The following gaps remain from the Phase 1 spec and natural quality improvements.

### Gap Analysis

| Feature | Status | Priority |
|---------|--------|----------|
| Logo upload in branding | Field in types but missing from BrandingCustomizer UI | High |
| Logo display on cover page | Not rendered | High |
| Template visual previews | Emoji-only, no real preview thumbnails | Medium |
| Templates don't apply `headerStyle` / `coverLayout` | Config exists but never used in rendering | High |
| Table: add/remove columns | Only rows can be added/removed | Medium |
| Proposal outline sidebar | Not built | Medium |
| Document stats (word/page count) | Not built | Low |
| Image replace/remove after upload | No way to swap an uploaded image | Medium |
| Word (.docx) export | Not built | Low (Phase 2) |
| Shareable link export | Not built | Low (Phase 2) |

### Proposed Iteration Scope

Focus on **template differentiation**, **logo support**, and **editor polish** -- the highest-impact gaps.

---

### 1. Add Logo Upload to BrandingCustomizer

**File:** `BrandingCustomizer.tsx`

- Add a logo upload section using the same pattern as `ImageBlock` (upload to `rfp-files/{org_id}/branding/`)
- Show current logo thumbnail with a remove button
- Requires passing `organizationId` prop through from `ProposalDesignStudio`

### 2. Render Logo on Cover Page

**Files:** `blocks/CoverBlock.tsx`, `export-proposal-pdf/index.ts`

- Display `settings.logoUrl` at the top of the cover block in both editor and preview modes
- Add logo rendering in the edge function HTML output

### 3. Apply Template `headerStyle` and `coverLayout` Variations

**Files:** `blocks/CoverBlock.tsx`, `blocks/HeadingBlock.tsx`, `ProposalPreview.tsx`, `ProposalDesignStudio.tsx`, `types.ts`

Currently `headerStyle` and `coverLayout` are stored on the template config but never influence rendering. Changes:

- Pass `templateId` (or the resolved template config) to block components that need it
- **CoverBlock**: Render 5 distinct cover layouts (`centered`, `left-aligned`, `split`, `minimal`, `full-bleed`) using different flexbox/grid arrangements
- **HeadingBlock**: Render 5 header styles (`bold` = heavy weight, `underline` = bottom border, `accent-bar` = left color bar, `minimal` = no decoration, `gradient` = gradient text/background)
- Update the edge function's `renderBlockToHtml` to match these variations
- Add `headerStyle` and `coverLayout` to `DesignSettings` so they persist with the design (currently only on template config)

### 4. Template Visual Preview Thumbnails

**File:** `TemplateSelector.tsx`

- Replace emoji-only previews with small rendered mini-previews showing the template's cover layout, colors, and header style
- Each card renders a tiny HTML mockup (colored rectangles, text placeholders) styled with the template's `defaults`

### 5. Table Column Management

**File:** `blocks/TableBlock.tsx`

- Add "Add Column" button
- Add column delete button on each header cell
- When adding a column, extend all existing rows with an empty cell

### 6. Image Block Replace/Remove

**File:** `blocks/ImageBlock.tsx`

- When an image is already uploaded, show "Replace" and "Remove" buttons instead of only showing the preview
- "Remove" clears the URL; "Replace" triggers file input again

### 7. Proposal Outline Sidebar

**Files:** New `ProposalOutlineSidebar.tsx`, update `ProposalDesignStudio.tsx`

- Left panel listing all blocks by type/title (cover, headings, etc.)
- Click to scroll/focus the corresponding block in the editor
- Shows block type icons and truncated content labels
- Integrated into the editor tab alongside the block list

---

### Implementation Order

1. Logo upload in BrandingCustomizer + logo on CoverBlock
2. Add `headerStyle` / `coverLayout` to `DesignSettings` and pass to blocks
3. CoverBlock layout variations (5 layouts)
4. HeadingBlock style variations (5 styles)
5. Update edge function HTML rendering to match new variations
6. Template visual preview thumbnails
7. Table column add/remove
8. Image replace/remove
9. Proposal outline sidebar

### File Changes Summary

| File | Change |
|------|--------|
| `types.ts` | Add `headerStyle` and `coverLayout` to `DesignSettings` |
| `templates.ts` | Copy `headerStyle`/`coverLayout` into template `defaults` |
| `BrandingCustomizer.tsx` | Add logo upload section, accept `organizationId` prop |
| `ProposalDesignStudio.tsx` | Pass `organizationId` to BrandingCustomizer |
| `blocks/CoverBlock.tsx` | Render logo, implement 5 cover layouts |
| `blocks/HeadingBlock.tsx` | Implement 5 header styles |
| `blocks/TableBlock.tsx` | Add/remove column support |
| `blocks/ImageBlock.tsx` | Add replace/remove buttons |
| `ProposalOutlineSidebar.tsx` | **New** -- outline navigation panel |
| `ProposalPreview.tsx` | No changes needed (already delegates to block components) |
| `export-proposal-pdf/index.ts` | Add logo rendering, cover layout variations, heading style variations |
| `useProposalDesign.ts` | Ensure `headerStyle`/`coverLayout` are included when mapping template defaults |


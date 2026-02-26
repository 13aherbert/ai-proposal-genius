

## Proposal Design Studio -- Next Iteration Plan

### What's Built
- 9 block types with drag-and-drop editing, 5 templates with cover/header style variations
- Logo upload, branding customizer, markdown table rendering, outline sidebar
- PDF export via edge function (HTML print fallback)
- Autosave every 10s

### What's Missing (Prioritized)

**High Priority -- Core Editing & Export Quality**

1. **Duplicate block** -- No way to copy an existing block; add a "Duplicate" button next to the trash icon in `BlockEditor.tsx`
2. **Block collapse/expand** -- Long text blocks crowd the editor; add toggle to collapse block content to a single-line summary
3. **Page break control** -- Divider block always inserts `page-break-after`; add a toggle so users can choose decorative divider vs. page break
4. **Numbered lists in markdown** -- The edge function's `markdownToHtml` only handles `- ` unordered lists; add ordered list (`1. `) conversion
5. **Callout/Quote markdown support** -- These blocks render plain text; apply the same `markdownToHtml` conversion so bold/italic/links work inside them

**Medium Priority -- UX Polish**

6. **Undo/redo** -- No history; implement a simple block-state history stack (max 30 states) with Ctrl+Z / Ctrl+Shift+Z
7. **Block insert between** -- Currently blocks only append to the end; add inline "+" insert buttons between existing blocks
8. **Preview zoom/page simulation** -- Preview is a single scrolling div; add page-break visual indicators and a zoom control
9. **Section numbering** -- Heading blocks don't show section numbers; add optional auto-numbering (1, 1.1, 1.2, 2, etc.) controlled by a design setting
10. **Word count / page estimate** -- Display document stats in the outline sidebar

**Lower Priority -- Advanced Features**

11. **Shareable preview link** -- Generate a public read-only URL for client review (requires new edge function + table for share tokens)
12. **Word (.docx) export** -- Add DOCX generation alongside PDF
13. **Version history** -- Save snapshots of the design with timestamps; allow reverting to previous versions
14. **AI content refinement** -- Button on text blocks to rewrite/improve content using the existing section generation infrastructure

### Recommended Scope for This Iteration

Focus on items 1-5 (core editing) and 6-8 (UX polish) -- these are the highest-impact improvements that don't require new database tables or edge functions.

### Changes

| File | Change |
|------|--------|
| `BlockEditor.tsx` | Add duplicate button, insert-between buttons, collapse/expand toggle per block |
| `blocks/DividerBlock.tsx` | Add page-break vs. decorative toggle |
| `blocks/QuoteBlock.tsx` | Render content through `markdownToHtml` in preview mode |
| `blocks/CalloutBlock.tsx` | Render content through `markdownToHtml` in preview mode |
| `ProposalPreview.tsx` | Add page-break visual indicators, zoom control slider |
| `ProposalOutlineSidebar.tsx` | Add word count / page estimate display |
| `useProposalDesign.ts` | Add undo/redo history stack with keyboard shortcuts |
| `types.ts` | Add `sectionNumbering` boolean to `DesignSettings` |
| `blocks/HeadingBlock.tsx` | Render section numbers when enabled |
| `export-proposal-pdf/index.ts` | Fix ordered list rendering, add section numbering, apply markdown in callout/quote blocks |
| `BrandingCustomizer.tsx` | Add section numbering toggle |

### Implementation Order

1. Duplicate block + insert-between buttons in BlockEditor
2. Block collapse/expand toggle
3. Undo/redo history in useProposalDesign
4. Page break toggle on DividerBlock
5. Markdown rendering in QuoteBlock and CalloutBlock
6. Ordered list support in edge function
7. Section numbering setting + HeadingBlock rendering
8. Preview page-break indicators + zoom
9. Word count in outline sidebar
10. Deploy updated edge function


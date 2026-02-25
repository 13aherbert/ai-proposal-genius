

## Proposal Design Studio -- Phase 1 MVP Implementation Plan

### Overview

Build a template-based proposal design studio that lets users take their completed `proposal_sections` content and render it into a professionally styled, branded document with PDF export via a server-side edge function.

### Architecture

```text
┌─────────────────────────────────────────────────────┐
│  ProjectContent (existing)                          │
│  ├─ ProjectSidebar: add "Design" section            │
│  └─ renderSection("design") → ProposalDesignStudio  │
│       ├─ TemplateSelector (5 templates)             │
│       ├─ BrandingCustomizer (colors, logo, fonts)   │
│       ├─ ProposalDesigner (block editor + preview)  │
│       └─ ExportPanel → export-proposal-pdf edge fn  │
└─────────────────────────────────────────────────────┘
```

### Database Changes

**New table: `proposal_designs`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK → projects | |
| organization_id | uuid FK → organizations | |
| user_id | uuid | |
| template_id | text | e.g. "modern-corporate" |
| design_settings | jsonb | Colors, fonts, margins, logo URL |
| content_blocks | jsonb | Ordered array of block objects (type, content, settings) |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

RLS: organization-scoped read/write using `user_belongs_to_organization`.

### Template System

Five built-in templates, each defined as a TypeScript config object (no DB rows needed):

1. **Modern Corporate** -- Blue/dark palette, bold headers, geometric accents
2. **Clean Minimal** -- White space focused, thin rules, muted colors
3. **Government Contract** -- Conservative serif fonts, formal structure, compliance-focused layout
4. **Consulting Proposal** -- Professional sans-serif, executive summary emphasis, case study blocks
5. **Creative Agency** -- Vibrant accent colors, large imagery placeholders, modern typography

Each template defines defaults for: primary/secondary colors, header/body fonts, margin sizes, header style, cover page layout.

### Block Types

Content blocks stored in `content_blocks` JSONB array:

- `cover` -- Title, subtitle, logo, date, client name
- `toc` -- Auto-generated from section headers
- `heading` -- H1/H2/H3 with customizable style
- `text` -- Rich text (rendered from markdown)
- `image` -- User-uploaded image with caption
- `table` -- Pricing/data table
- `divider` -- Horizontal rule / page break
- `quote` -- Highlighted callout/quote block
- `callout` -- Info/warning/success box

### Content Mapping

When user clicks "Design Proposal", the system:
1. Loads all `proposal_sections` for the project
2. Creates a default `proposal_designs` record if none exists
3. Maps sections into blocks: cover page + TOC + one `heading` + one `text` block per section
4. User can then rearrange, add, or remove blocks

### Branding Customizer

Inline panel allowing users to set:
- **Logo**: Upload to `rfp-files` bucket under `{org_id}/branding/`
- **Primary color**: Color picker
- **Secondary color**: Color picker
- **Header font**: Dropdown (Inter, Georgia, Merriweather, Roboto, Playfair Display)
- **Body font**: Dropdown (same set)
- **Page margins**: Slider (narrow/normal/wide)

Settings stored in `design_settings` JSONB.

### Preview Mode

A full-width preview panel that renders the blocks using the selected template's CSS. Uses CSS `@media print` styles and `page-break` rules to simulate page layout. Toggle between editor and preview modes.

### PDF Export (Server-Side Edge Function)

**New edge function: `export-proposal-pdf`**

- Receives `designId` (proposal_designs.id)
- Loads the design record (template, settings, blocks) from DB
- Renders HTML from blocks + template CSS
- Uses Deno-compatible approach: generates styled HTML and converts to PDF using a lightweight HTML-to-PDF approach (server-rendered HTML with print CSS, or `jspdf` + `html2canvas` equivalent for Deno)
- Returns the PDF as a downloadable file or uploads to storage and returns a signed URL
- Manual JWT validation (verify_jwt = false in config.toml)
- Organization membership check before processing

### File Changes

| File | Change |
|------|--------|
| **DB Migration** | Create `proposal_designs` table with RLS policies |
| `src/components/project/details/ProjectSidebar.tsx` | Add "Design" section entry with `Palette` icon |
| `src/components/project/details/ProjectContent.tsx` | Add `case "design"` rendering `ProposalDesignStudio` |
| `src/components/project/design-studio/ProposalDesignStudio.tsx` | **New** -- Main container, loads sections + design, orchestrates sub-components |
| `src/components/project/design-studio/TemplateSelector.tsx` | **New** -- Grid of 5 template cards with preview thumbnails |
| `src/components/project/design-studio/templates.ts` | **New** -- Template config definitions (colors, fonts, layouts) |
| `src/components/project/design-studio/BrandingCustomizer.tsx` | **New** -- Color pickers, font selectors, logo upload, margin slider |
| `src/components/project/design-studio/BlockEditor.tsx` | **New** -- Block list with drag-to-reorder (uses existing @dnd-kit), add/remove blocks |
| `src/components/project/design-studio/blocks/CoverBlock.tsx` | **New** -- Editable cover page block |
| `src/components/project/design-studio/blocks/TextBlock.tsx` | **New** -- Markdown text block |
| `src/components/project/design-studio/blocks/HeadingBlock.tsx` | **New** -- Section header block |
| `src/components/project/design-studio/blocks/ImageBlock.tsx` | **New** -- Image upload block |
| `src/components/project/design-studio/blocks/TableBlock.tsx` | **New** -- Editable table block |
| `src/components/project/design-studio/blocks/DividerBlock.tsx` | **New** -- Divider/page break |
| `src/components/project/design-studio/blocks/QuoteBlock.tsx` | **New** -- Quote/callout block |
| `src/components/project/design-studio/blocks/TocBlock.tsx` | **New** -- Auto-generated table of contents |
| `src/components/project/design-studio/ProposalPreview.tsx` | **New** -- Full document preview renderer |
| `src/components/project/design-studio/ExportPanel.tsx` | **New** -- Export button, calls edge function, downloads PDF |
| `src/components/project/design-studio/useProposalDesign.ts` | **New** -- Hook for CRUD on `proposal_designs`, autosave every 10s |
| `supabase/functions/export-proposal-pdf/index.ts` | **New** -- Edge function: loads design, renders HTML, generates PDF |
| `supabase/functions/config.toml` | Add `export-proposal-pdf` entry |

### Autosave

The `useProposalDesign` hook will debounce updates and auto-save `content_blocks` and `design_settings` to the database every 10 seconds when changes are detected, using a dirty flag pattern.

### Implementation Order

1. Database migration (table + RLS)
2. Template definitions + TemplateSelector UI
3. useProposalDesign hook (load/save/autosave)
4. ProposalDesignStudio container + content mapping logic
5. Block components (cover, text, heading, divider, quote, toc, image, table)
6. BlockEditor with drag-and-drop reordering
7. BrandingCustomizer panel
8. ProposalPreview renderer
9. Integration into ProjectSidebar + ProjectContent
10. export-proposal-pdf edge function
11. ExportPanel UI

### Technical Notes

- Image uploads reuse the existing `rfp-files` Supabase storage bucket with `{org_id}/design-assets/` prefix
- Block drag-and-drop uses `@dnd-kit/core` and `@dnd-kit/sortable` already installed
- The edge function will need no new secrets -- it reads from DB and storage using the service role key
- PDF generation in Deno: will use server-rendered HTML with inline CSS, then leverage a Deno-compatible PDF library or return styled HTML that the client can print-to-PDF as a fallback


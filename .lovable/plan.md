

## Plan: Persistent Brand Guidelines Across Proposals

### Current State
- Each proposal stores its own `DesignSettings` (colors, fonts, logo, header style, cover layout) in the `proposal_designs` table -- these are per-proposal, not shared.
- An `organization_branding` table exists but is used for the white-label system (app-level theming), not for proposal design defaults.
- There is no way to save or load proposal branding presets.

### Approach
Create a new `organization_brand_guidelines` table to store proposal-specific brand presets (logo, colors, fonts, header/cover style). Users can save their current design settings as guidelines from the Design Studio, or manage them from Account Settings. When creating a new proposal, the system auto-applies saved guidelines instead of template defaults.

### Database Changes

**New table: `organization_brand_guidelines`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | references organizations(id) |
| name | TEXT | e.g. "Default", "Client-facing" |
| is_default | BOOLEAN | only one default per org |
| logo_url | TEXT | storage path in rfp-files |
| primary_color | TEXT | hex |
| secondary_color | TEXT | hex |
| header_font | TEXT | |
| body_font | TEXT | |
| header_style | TEXT | matches HeaderStyle type |
| cover_layout | TEXT | matches CoverLayout type |
| margins | TEXT | narrow/normal/wide |
| section_numbering | BOOLEAN | |
| created_at / updated_at | TIMESTAMPTZ | |

RLS: org members can read; owners/admins can insert/update/delete.

### Code Changes

| File | Change |
|------|--------|
| **New: `src/hooks/useBrandGuidelines.ts`** | Hook to fetch, save, update, delete brand guidelines for the current org. Includes `getDefaultGuideline()` helper. |
| **`BrandingCustomizer.tsx`** | Add "Save as Brand Guideline" button and a dropdown to load a saved guideline. When loading, it applies all settings from the guideline to the current proposal. |
| **`useProposalDesign.ts`** | On new proposal creation (the `else` branch), check for a default brand guideline and merge its settings (logo, colors, fonts, styles) into the initial `DesignSettings` instead of using only template defaults. |
| **`AccountSettings.tsx`** | Add a new "Brand Guidelines" card section that shows saved guidelines with edit/delete, and a button to create a new one. Visible to all users (not just enterprise). |
| **New: `src/components/account/BrandGuidelinesCard.tsx`** | UI component for managing brand guidelines from account settings -- list, create, edit, set default, delete. Includes color pickers, font selectors, and logo upload reusing existing patterns. |
| **`ProposalDesignStudio.tsx`** | No direct changes needed; `BrandingCustomizer` handles the save/load UI. |

### User Flow

1. **From Design Studio**: User customizes branding, clicks "Save as Brand Guideline" -- saves current colors/fonts/logo/styles as a named preset. Option to mark as default.
2. **From Account Settings**: User manages guidelines (rename, edit colors, set default, delete).
3. **New proposal creation**: System checks for a default guideline. If found, merges its values into the initial design settings (overriding template colors/fonts/logo but keeping template structure).
4. **From Design Studio**: User can click "Load Guideline" dropdown to apply a saved guideline to the current proposal at any time.

### Implementation Order

1. Create `organization_brand_guidelines` table + RLS policies
2. Build `useBrandGuidelines` hook
3. Add save/load UI to `BrandingCustomizer`
4. Update `useProposalDesign` to auto-apply default guideline on new proposals
5. Build `BrandGuidelinesCard` for Account Settings
6. Add the card to `AccountSettings.tsx`




## More Distinct Templates & Cover Image Upload

### Problem
All 5 templates currently differ only in colors, fonts, and minor layout shifts. They lack structural variety (e.g., sidebar layouts, banner images, accent shapes). Additionally, there's no way to add a hero/cover image to the cover page -- the image block exists but is separate from the cover.

### Changes

#### 1. Add Cover Image Support to CoverBlock

**File:** `types.ts`
- Add `coverImageUrl?: string` to `ContentBlock.content` convention for cover blocks

**File:** `blocks/CoverBlock.tsx`
- Add an image upload field in editor mode (reuse the same upload pattern as `ImageBlock`)
- In preview mode, render the cover image as a background or hero image depending on layout
- Use `useSignedUrl` to resolve the stored path

**File:** `BrandingCustomizer.tsx`
- No changes needed -- the cover image is per-block, not per-branding config

#### 2. Add 3 New Structurally Distinct Templates

**File:** `templates.ts` -- add 3 new templates:

| Template | Cover Layout | Header Style | Visual Difference |
|----------|-------------|-------------|-------------------|
| **Executive Brief** | `banner` (new) | `boxed` (new) | Full-width hero image banner on cover, headings inside colored boxes |
| **Technical Report** | `sidebar` (new) | `numbered` (new) | Cover has a colored sidebar strip with metadata, headings show auto-numbers with underline |
| **Bold Pitch** | `diagonal` (new) | `pill` (new) | Cover uses a diagonal color split, headings are inside rounded pill shapes |

#### 3. Implement New Cover Layouts

**File:** `types.ts`
- Extend `CoverLayout` type: add `'banner' | 'sidebar' | 'diagonal'`

**File:** `blocks/CoverBlock.tsx` -- add 3 new layout renderers:
- **`banner`**: Full-width cover image at top (or gradient fallback), title overlaid at bottom with semi-transparent bar
- **`sidebar`**: Left 30% is a colored sidebar with logo + date + metadata; right 70% has title and subtitle on white
- **`diagonal`**: Diagonal CSS clip-path splitting primary/secondary colors, title centered over the split

#### 4. Implement New Header Styles

**File:** `types.ts`
- Extend `HeaderStyle` type: add `'boxed' | 'numbered' | 'pill'`

**File:** `blocks/HeadingBlock.tsx` -- add 3 new style renderers:
- **`boxed`**: Full-width colored background box with white text
- **`numbered`**: Auto-number prefix (from sectionNumber prop) with underline, distinct from plain `underline` style by using a colored number badge
- **`pill`**: Rounded pill/capsule shape background behind the heading text

#### 5. Update Template Mini-Previews

**File:** `TemplateSelector.tsx`
- Add mini-preview renderers for the 3 new cover layouts (`banner`, `sidebar`, `diagonal`)

#### 6. Update PDF Export

**File:** `supabase/functions/export-proposal-pdf/index.ts`
- Add HTML rendering for the 3 new cover layouts
- Add HTML rendering for the 3 new header styles
- Handle cover image in PDF export (resolve signed URL)

### Implementation Order

1. Extend `CoverLayout` and `HeaderStyle` types
2. Add 3 new templates to `templates.ts`
3. Implement cover image upload in `CoverBlock.tsx` editor mode
4. Implement 3 new cover layout previews (banner, sidebar, diagonal)
5. Implement 3 new header style previews (boxed, numbered, pill)
6. Update `TemplateSelector.tsx` mini-previews
7. Update edge function for new layouts/styles + cover image
8. Deploy edge function

### File Changes Summary

| File | Change |
|------|--------|
| `types.ts` | Extend `CoverLayout` and `HeaderStyle` union types |
| `templates.ts` | Add 3 new template configs |
| `blocks/CoverBlock.tsx` | Cover image upload + 3 new layout renderers |
| `blocks/HeadingBlock.tsx` | 3 new header style renderers |
| `TemplateSelector.tsx` | 3 new mini-preview layouts |
| `export-proposal-pdf/index.ts` | New layout/style HTML + cover image support |


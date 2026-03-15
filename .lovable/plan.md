

## Plan: Fix Open Graph URL Domain

Update all references from `ai-proposal-genius.lovable.app` to `optirfp.ai` in two locations:

### Changes

1. **`index.html`** (line ~12-13):
   - `og:url` → `https://optirfp.ai`
   - `og:image` → `https://optirfp.ai/og-image.png`
   - `og:title` → `OptiRFP — AI RFP Response Software`

2. **`src/hooks/use-seo.ts`** (line 3):
   - `CANONICAL_BASE` → `"https://optirfp.ai"`

This ensures both the static HTML fallback tags and the dynamic `useSEO` hook generate correct URLs for social sharing and canonicals.

### Files Modified (2)
- `index.html`
- `src/hooks/use-seo.ts`


## Goal
All 4 blog posts in the `blog_posts` table currently point at generic Unsplash URLs. On `/blog`, these either feel off-brand or are not rendering reliably. I'll replace them with purpose-built cover images for each post.

## Posts to cover
1. `rfp-security-question-examples` — Security & compliance theme (shield, lock, SOC 2 vibe)
2. `how-to-write-a-winning-rfp-response` — Writing/strategy theme (document + trophy)
3. `5-rfp-mistakes-that-cost-contracts` — Cautionary theme (warning + contract)
4. `ai-vs-traditional-rfp-tools` — AI vs legacy theme (split visual)

## Steps
1. Generate 4 unique 1600×900 cover images with `imagegen` (fast tier, JPG) in the brand's dark blue-gray + purple accent palette. Save under `src/assets/blog/`.
2. Upload each via `lovable-assets` so the binaries live on the CDN, not in the repo.
3. Run a Supabase `UPDATE` on `blog_posts.image_url` for each slug, pointing to the new CDN URLs.
4. Verify on `/blog` that each card shows its new cover and `/blog/<slug>` hero image renders.

## Notes
- No frontend code changes — `Blog.tsx` and `BlogPost.tsx` already render `image_url` correctly.
- Existing Unsplash URLs will be overwritten (no rollback needed; old values are stock photos).
- CSP already allows `https:` images, so CDN URLs (`/__l5e/assets-v1/...`) work in both preview and production.

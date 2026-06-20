# Make optirfp.ai discoverable on Google, Bing, and Yahoo

Yahoo Search is powered by Bing, so "Yahoo" coverage = Bing coverage. The work below covers both major crawlers plus a few hygiene items specific to this codebase.

## What's already in place
- `public/robots.txt` allows crawling and points to `https://optirfp.ai/sitemap.xml`.
- `public/sitemap.xml` exists.
- `src/components/SEO.tsx` + `src/hooks/use-seo.ts` set per-page title, description, canonical, OG, Twitter, and JSON-LD.
- `SEO_CONFIG` covers home, pricing, blog, tools, and 6 compare pages.
- An admin Google Search Console panel (`/admin` → SEO) is already wired up via the `gsc-analytics` edge function and can verify the domain.

## Gaps to fix

1. **Audit `public/sitemap.xml`** — confirm every public route is listed: home, pricing, blog, tools, FAQ, docs, about, contact, security, integrations, white-label, lifetime deal, all 6 compare pages, and the 3 new guides (`/resources/what-is-an-rfp`, `/resources/rfp-examples`, `/resources/rfp-response-template`). Add any missing URLs and bump `<lastmod>`.

2. **Add SEO config + `<SEO />` to the 3 new resource pages** if they're not already using it, so each has a unique title, description, canonical, and Article/HowTo JSON-LD. Without this they share generic head tags and won't rank.

3. **Verify Google Search Console** via the existing `/admin` → SEO panel (already published, meta tag method). After verification, submit `https://optirfp.ai/sitemap.xml` from the GSC UI.

4. **Verify Bing Webmaster Tools** (covers Yahoo). Two options — pick one:
   - **Recommended:** "Import from Google Search Console" inside Bing Webmaster Tools — one click, no code change.
   - Or add a `<meta name="msvalidate.01" content="..." />` tag to `index.html` and submit the sitemap manually.

5. **Add IndexNow** (optional but high-leverage for Bing/Yahoo) — drop a key file at `public/<key>.txt` and ping `https://api.indexnow.org/indexnow` when blog posts or guides publish. Gets new URLs indexed in minutes instead of weeks.

6. **Confirm `noindex` is not set anywhere globally.** Spot-check `index.html` and `useSEO` to make sure no route accidentally emits `<meta name="robots" content="noindex">`.

7. **Sanity-check canonicals** — every page's canonical should self-reference `https://optirfp.ai/<path>`, not the homepage. `SEO_CONFIG` looks correct; just confirm the 3 new resource pages follow the same pattern.

## Out of scope (until you ask)
- Switching to SSR/prerender for social crawlers (LinkedIn/Slack) — separate effort.
- Schema markup beyond what `SEO_CONFIG` already emits.
- Paid indexing services.

## Clarifying questions before I build
- **Bing verification:** OK to use "Import from Google Search Console" (zero code), or do you want the `msvalidate.01` meta tag route?
- **IndexNow:** Want me to wire this up now, or skip until the blog publishes more often?
- **Resource pages:** Should I audit and add `<SEO />` to the 3 new `/resources/*` pages as part of this, or is that already done?

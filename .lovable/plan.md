# Build-time prerender for per-page SEO metadata

## Why the tags all look identical in View Source

The SPA ships one `index.html` with a fallback title and description. `useSEO` rewrites `<title>` / `<meta description>` / `<link rel=canonical>` / `og:*` **client-side** after React mounts. JS-executing crawlers (Googlebot, GA4, browser tabs) see the correct per-route values. View Source and non-JS crawlers (LinkedIn, Slack, older Facebook fetches) only ever see the static defaults — which is why every page currently looks the same to them.

The fix: **bake a per-route HTML file at build time** so `dist/tools/rfp-deadline-calculator/index.html` already contains the right `<title>` and metadata before it's ever served, with zero runtime middleware and no monthly service.

## Approach

Add a Node prerender script that runs after `vite build`, spins up `vite preview` locally, uses Playwright to visit every URL in `public/sitemap.xml`, waits for `useSEO` to run, then writes the fully-rendered HTML back to `dist/<route>/index.html`. Netlify's static-file-first behavior serves the prerendered HTML to every crawler, and the SPA still hydrates normally for real users. The existing SPA fallback (`/* → /index.html 200`) keeps handling dynamic routes not in the sitemap (blog posts by slug, auth pages, dashboard).

## Files to add / change

1. **`scripts/prerender.mjs`** (new)
   - Parse `public/sitemap.xml`, extract each `<loc>` and strip the domain to get the path.
   - Also include an explicit list of blog slugs and template slugs (read from `src/data/blog-posts.ts` and `src/data/rfp-templates.ts`) so those pages get prerendered too.
   - Launch `vite preview --port 4173` as a child process, wait for the port to be listening.
   - For each route: `page.goto('http://localhost:4173' + route, { waitUntil: 'networkidle' })`, then `page.waitForFunction(() => document.title && document.title !== 'OptiRFP — AI-Powered RFP Response Platform')` with a fallback timeout for routes that legitimately keep the default (home).
   - Grab `document.documentElement.outerHTML`, prepend `<!DOCTYPE html>`, write to `dist/<route>/index.html`. For `/` overwrite `dist/index.html`.
   - Kill preview server, exit.

2. **`package.json`**
   - Add `"postbuild": "node scripts/prerender.mjs"` so it runs automatically after `vite build` in Netlify.
   - Add dev dependency `playwright` (Chromium only).

3. **`netlify.toml`**
   - Add `PLAYWRIGHT_BROWSERS_PATH = "0"` and prepend `npx playwright install --with-deps chromium && ` to the build command so Netlify's build image has a browser.
   - Keep the existing SPA `/* → /index.html 200` fallback — it still applies to anything not prerendered.

4. **`src/hooks/use-seo.ts`** (tiny addition)
   - After writing tags, set `document.documentElement.dataset.seoReady = "1"` so the prerender script has a reliable signal to wait on instead of a title heuristic.

## Technical notes

- `og:image` per route: `useSEO` already accepts `ogImage`. Prerender captures whatever the DOM ends up with, so any per-page image set via `useSEO` is baked in. Pages that don't set one keep the sitewide banner from `index.html`.
- Canonical duplication: `useSEO` updates the existing `<link rel="canonical">` in place rather than appending, so prerendered HTML ships exactly one canonical per page.
- Hydration mismatch risk: React 18 tolerates head differences; body content is rendered from the same code path so no visible flash. If a specific page shows a mismatch warning we suppress by clearing the `<div id="root">` server HTML before writing (leave the shell empty) — the prerender is head-only SEO, not full SSR.
- Build time: ~30 sitemap URLs × ~1s each ≈ 30–45s added to Netlify build.
- Lovable preview / dev (`npm run dev`) is unaffected — prerender only runs on `npm run build`.

## Verification

After deploy, `curl -A "Mozilla" https://optirfp.ai/tools/rfp-deadline-calculator` should return HTML whose `<title>` is the tool's SEO title, not the sitewide default. Same for `/blog`, `/compare/loopio`, etc. View Source in a browser will show the correct per-page tags.

## Out of scope

- No changes to routing, GA4, analytics, `useSEO` semantics (beyond the ready flag), or any page component's content.
- No runtime prerender service, no Netlify edge functions, no Prerender.io.
- Authenticated routes (Dashboard, /admin/*, /account) are not prerendered — they should not be indexed anyway.

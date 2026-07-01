
## Plan: Unique per-page SEO across all listed routes

Uses the project's existing `SEO` component (`src/components/SEO.tsx`) + `SEO_CONFIG` (`src/config/seo-config.ts`) + `useSEO` hook. No new dependency — react-helmet-async would duplicate every tag on top of `useSEO`.

The `useSEO` hook already emits: `<title>`, `meta description`, `link canonical`, `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, and optional JSON-LD — exactly the set requested.

### 1. Extend `src/config/seo-config.ts`

Add missing entries (keep existing ones untouched):

- `templateGenerator` → `/tools/rfp-response-template-generator`
- `templateLibrary` → `/tools/rfp-template-library`
- `aiResponseGenerator` → `/tools/ai-rfp-response-generator`
- `howToRespond` → `/tools/how-to-respond-to-an-rfp`
- `goNoGo` → `/tools/rfp-go-no-go-decision-tool`
- `lifetime` → `/lifetime`

Each with the exact title/description/canonical from the request.

### 2. Add `<SEO {...SEO_CONFIG.x} />` to each page

Files touched (mount `<SEO />` at top of component tree, replacing any inline `useSEO` call to avoid double-emission):

| Route | File |
|---|---|
| `/` | `src/pages/Index.tsx` |
| `/pricing` | `src/pages/Pricing.tsx` (currently a redirect — add SEO before redirect fires, or skip since it redirects to `/`) |
| `/blog` | `src/pages/Blog.tsx` |
| `/tools` | `src/pages/tools/ToolsHub.tsx` |
| `/tools/rfp-response-template-generator` | `src/pages/tools/RfpResponseTemplateGenerator.tsx` |
| `/tools/rfp-template-library` | `src/pages/tools/RfpTemplateLibrary.tsx` |
| `/tools/ai-rfp-response-generator` | (verify route — may need to locate/confirm file) |
| `/tools/how-to-respond-to-an-rfp` | (verify route) |
| `/tools/rfp-go-no-go-decision-tool` | `src/pages/tools/GoNoGoDecisionTool.tsx` |
| `/compare/loopio` | `src/pages/CompareLoopio.tsx` |
| `/compare/autorfp` | `src/pages/CompareAutoRFP.tsx` |
| `/compare/responsive` | `src/pages/CompareResponsive.tsx` |
| `/compare/proposify` | `src/pages/CompareProposify.tsx` |
| `/lifetime` | `src/pages/LifetimeDeal.tsx` |

Note: `/pricing` currently redirects to `/#pricing`, so it never renders SEO. I'll flag this — options are (a) leave as-is (redirect wins, no separate pricing SEO), or (b) render `<SEO />` before the redirect (title flashes but crawlers see it). Recommend (a) and delete `/pricing` from `sitemap.xml` if present, since the URL doesn't exist as its own page.

### 3. Enforce unique H1 per page

Audit each page and ensure exactly one `<h1>` with the exact text specified in the request. Change extras to `<h2>` where duplicates exist. No visual/design changes — only tag swaps where required.

### 4. Verification

- Grep every touched file: exactly one `<h1>` and one `<SEO />`.
- Run `tsgo` (typecheck) — no runtime changes to logic.
- Report back: which files were edited, which routes needed H1 demotion, and the `/pricing` decision.

### Technical notes

- `useSEO` already handles cleanup on unmount and updates on prop change, so navigating between pages replaces (not appends) the meta tags. This is functionally equivalent to `react-helmet-async` for JS-executing crawlers.
- Social crawlers (LinkedIn, Slack) that don't run JS still see only `index.html` head — this is a hard limitation of any CSR SPA without SSR. Same trade-off would apply to react-helmet-async.
- Not adding og:image per page — the sitewide default in `SEO.tsx` covers all pages.

### Out of scope

- No `react-helmet-async` install.
- No design or copy changes beyond the specified H1 strings.
- No sitemap changes unless `/pricing` decision requires it.

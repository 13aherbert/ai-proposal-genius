## Fix: send GA4 pageviews after the page's real title is set

### Root cause
`useAnalytics` fires `trackPageView` on `location` change from `AppContent`. Because every route is `React.lazy` behind `<Suspense>`, the target page hasn't mounted yet — so `document.title` is still the previous page's (or the static `index.html` default). GA4 receives every hit with the same title.

### Change

**1. Move pageview tracking out of `useAnalytics` route effect**

In `src/hooks/use-analytics.ts`, remove the `useEffect` that calls `analytics.trackPageView` on `location` change. Keep the exported wrappers (they're used elsewhere for events).

**2. Fire the pageview from `useSEO` after title/canonical are written**

In `src/hooks/use-seo.ts`, at the end of the effect (after `document.title = title` and canonical/OG tags are set), call `analytics.trackPageView(window.location.pathname + window.location.search, title)`.

This guarantees:
- `page_title` sent to GA4 matches the SEO config for that route
- `page_location` reflects the canonical URL currently in the DOM
- Each SEO'd route fires exactly one pageview per navigation

**3. Handle routes without `useSEO`**

A few authenticated routes (Dashboard, ProjectDetails, admin pages) don't call `useSEO`, so they'd stop reporting pageviews. Add a lightweight fallback in `AppContent`: a `useEffect` on `location.pathname` that schedules `analytics.trackPageView` on the *next* frame via `requestAnimationFrame` (or `setTimeout(0)`) AND only fires if no `useSEO`-driven pageview happened for this path in the last tick. Simplest implementation: keep a ref of the last path that fired via `useSEO`; the fallback compares before firing.

Alternative (simpler, acceptable): don't dedupe — accept that SEO'd pages fire from `useSEO` and non-SEO'd internal app pages fire from the fallback after a `requestAnimationFrame` delay (which is enough for the mounted page's own `document.title` writes, if any, to land first). Duplicate risk is low because non-SEO'd pages don't call `useSEO`.

I'll implement the simpler alternative: `useAnalytics` uses `requestAnimationFrame` before reading `document.title`, and `useSEO` fires an immediate pageview with the explicit title. To avoid double-counting on SEO'd pages, `useSEO` sets a module-level `lastTrackedPath` and the `useAnalytics` fallback skips when it matches.

### Files touched
- `src/hooks/use-analytics.ts` — replace route effect with rAF-delayed tracker that dedupes against `useSEO`'s last-tracked path.
- `src/hooks/use-seo.ts` — after writing head tags, call `analytics.trackPageView(path, title)` and record the path in the shared dedupe ref.
- (No changes to `SEO.tsx`, `seo-config.ts`, or any page — they already pass correct titles.)

### Verification
- Open the site, navigate between `/`, `/pricing`, `/tools`, `/compare/loopio`.
- In DevTools console, confirm `[Analytics] Page view:` logs show the correct per-route title on each navigation.
- In GA4 DebugView (or Realtime → Events), confirm `page_view` events carry distinct `page_title` values matching `SEO_CONFIG`.

### Out of scope
- No changes to `index.html` static title (that's still correct for the initial `/` hit and social crawlers).
- No changes to sitemap, robots, or per-page SEO copy.
- No new analytics provider or GA config changes.

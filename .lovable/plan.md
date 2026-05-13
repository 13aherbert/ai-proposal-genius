# Google Analytics Verification & Hardening

## Current state

- `src/services/analytics.ts` dynamically loads `gtag.js` for ID `G-88BD9C95TL`, but **only in production** (`import.meta.env.DEV` short-circuits init). In the Lovable preview (dev mode) no beacons fire — that's why you may not see data yet.
- The snippet is **not** present in `index.html`, so the tag only loads after React mounts and the analytics singleton constructs.
- Route page views are already tracked via `useAnalytics()` mounted in `AppContent`.

## Plan

1. **Add the official gtag snippet to `index.html`** right after the existing `<head>` opening block (before the theme-flash script is fine, or right after it). This guarantees GA loads on every page — including pre-React, 404, and static loads — exactly as Google recommends.

2. **Update `src/services/analytics.ts`** to:
   - Detect an existing `window.gtag` / `dataLayer` (from the inline snippet) and **skip injecting a second `gtag.js` script**.
   - Still call `gtag('config', id, { send_page_view: false })` so the SPA `useAnalytics()` hook owns route page views (prevents double-counting the initial load).
   - Remove the `isDevelopment` gate around initialization so events fire in preview too (keep the dev `console.log` for visibility). This lets you verify in the Lovable preview via GA4 DebugView.

3. **Verify** after deploy:
   - Open the published site, check Network tab for `https://www.googletagmanager.com/gtag/js?id=G-88BD9C95TL` (200) and a `collect?v=2&tid=G-88BD9C95TL...` beacon.
   - In GA4 → Admin → DebugView, confirm `page_view` events appear on navigation.
   - Confirm CSP in `SecurityProvider.tsx` already allows `googletagmanager.com` and `google-analytics.com` (it does, from prior change).

## Files touched

- `index.html` — add gtag snippet after `<head>` opener.
- `src/services/analytics.ts` — dedupe script injection, enable in dev.

No business-logic or backend changes.

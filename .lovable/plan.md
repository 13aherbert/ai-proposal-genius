## Wire up Google Analytics (GA4)

The analytics service already exists (`src/services/analytics.ts`) and reads `VITE_GA4_MEASUREMENT_ID`. It loads gtag.js dynamically, tracks page views via `useAnalytics`, and supports custom events. Two gaps prevent it from running:

1. The measurement ID `G-88BD9C95TL` is not set anywhere the client can read it.
2. `useAnalytics()` is not invoked at the app root, so route page views aren't tracked.

### Changes

1. **Hardcode the GA4 measurement ID as a fallback** in `src/services/analytics.ts`
   - Use `import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-88BD9C95TL'` so it works without an env var (publishable IDs are safe in client code).

2. **Add a gtag.js snippet to `index.html`** for early loading
   - Inject the standard GA4 `<script async src="...gtag/js?id=G-88BD9C95TL">` plus init snippet in `<head>` with `send_page_view: false` (SPA route changes are tracked manually).
   - This ensures tracking fires even before React mounts and improves first-page attribution.
   - Update the `AnalyticsService` to detect an existing `window.gtag` and skip duplicate script injection.

3. **Mount `useAnalytics()` at the app root**
   - Add a tiny `AnalyticsTracker` component that calls `useAnalytics()` and renders nothing.
   - Render it inside the `<BrowserRouter>` in `src/App.tsx` so route changes trigger `trackPageView`.

4. **Allow GA endpoints in CSP** (`src/components/security/SecurityProvider.tsx`)
   - Add `https://www.googletagmanager.com` to `script-src`.
   - Add `https://www.google-analytics.com` and `https://*.analytics.google.com` to `connect-src` and `img-src`.

5. **Verify**
   - Reload preview, confirm `gtag/js?id=G-88BD9C95TL` request fires and `collect?...` beacons send on route changes via the network panel.

### Notes
- Dev mode currently early-returns in the analytics service (`isDevelopment` short-circuit). Keep that behavior so localhost doesn't pollute GA, but the production preview/published site will track correctly.
- No backend or schema changes needed.

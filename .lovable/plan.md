# Stop Lovable preview traffic from polluting GA4

## Problem

Right now GA fires on every pageload in:
- `id-preview--*.lovable.app` (static preview)
- `*.lovableproject.com` (live sandbox preview you're viewing now)
- The Lovable editor iframe wrapper
- `localhost` during dev

Only the published domains should report:
- `ai-proposal-genius.lovable.app`
- `optirfp.ai` (and any future custom domain)

## Fix — two coordinated guards

### 1. `index.html` — gate the inline gtag snippet

Wrap the gtag bootstrap in a hostname allowlist so the script tag is never injected on preview/dev hosts. Pseudocode:

```js
(function(){
  var h = location.hostname;
  var allowed = h === 'optirfp.ai'
             || h === 'www.optirfp.ai'
             || h === 'ai-proposal-genius.lovable.app';
  if (!allowed) return;
  // inject <script async src="...gtag/js?id=G-88BD9C95TL">
  // init dataLayer + gtag('config', ..., { send_page_view: false })
})();
```

This blocks GA at the earliest possible point — no network request to `googletagmanager.com` from preview at all.

### 2. `src/services/analytics.ts` — mirror the same guard

Add a `isTrackingHost()` check (same allowlist). If false:
- Skip `initialize()` entirely
- `isEnabled()` returns false → all `trackPageView` / `trackEvent` calls become no-ops
- Keep dev `console.log` so you can still see what *would* have fired

This is a defense-in-depth layer in case the inline snippet is ever changed or someone proxies the preview through a different host.

## Verification steps after deploy

1. **In Lovable preview** (this view): open DevTools → Network → filter `google` — should see **zero** requests to `googletagmanager.com` or `google-analytics.com`.
2. **On `ai-proposal-genius.lovable.app`**: same filter should show `gtag/js?id=G-88BD9C95TL` (200) and a `collect?v=2&tid=G-88BD9C95TL...` beacon on navigation.
3. **GA4 DebugView**: confirm events only appear from production hostnames.

## Optional belt-and-suspenders (not in this plan unless you want it)

- Add a GA4 **internal traffic filter** in the GA admin UI that excludes `referrer = lovable.app` / `lovableproject.com`. Useful as a safety net but requires GA console access — say the word and I'll document the exact steps.

## Files touched

- `index.html` — wrap gtag bootstrap in hostname allowlist
- `src/services/analytics.ts` — add `isTrackingHost()` guard, short-circuit init + isEnabled

No business logic, backend, or DB changes.

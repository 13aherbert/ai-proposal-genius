

## Plan: Fix GA4 Configuration

### Problem

Two issues:
1. **`index.html`** uses `%VITE_GA4_MEASUREMENT_ID%` — Vite does NOT perform environment variable substitution in HTML files using `%` syntax. This literal string is checked against itself, so the gtag script never loads.
2. **`analytics.ts`** reads `import.meta.env.VITE_GA4_MEASUREMENT_ID` correctly, but never loads the gtag.js script itself — it assumes `index.html` already loaded it.

### Fix

**1. `index.html`** — Remove the broken GA4 script block entirely (lines 20-28). The gtag script loading will be handled in JS instead.

**2. `src/services/analytics.ts`** — In the `initialize()` method, dynamically create and append the gtag.js `<script>` tag (just like `index.html` was trying to do). This ensures the script loads using the correct `import.meta.env.VITE_GA4_MEASUREMENT_ID` value.

**3. Set the secret** — The `VITE_GA4_MEASUREMENT_ID` environment variable needs to be set in the project's Lovable secrets to `G-88BD9C95TL` (the ID from the docs).

### Files Modified (2)
- `index.html` — remove broken script block
- `src/services/analytics.ts` — add dynamic script loading in `initialize()`


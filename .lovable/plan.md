## Goal

Today `/lifetime` is a bare redeem form and `/lifetime-deal` is the marketing page. Since `/lifetime` is the URL being shared in outreach, it should be the full landing page — with code redemption as the hero CTA, waitlist as the fallback. Consolidate to one canonical URL.

## What changes

### 1. Rewrite `src/pages/LifetimeDeal.tsx` (route `/lifetime`)

Same marketing structure as `LifetimeDealLanding.tsx` (hero, "What you get forever" grid, 14-day guarantee, FAQ + JSON-LD, footer CTA), with the redemption flow embedded as the hero card instead of a separate page.

Hero card is state-driven. Code-entry is always the primary action; waitlist appears as a small fallback link below.

| State | Trigger | Hero card shows |
|---|---|---|
| `loading` | `?code=` present, validating | Spinner |
| `needs-code` | no `?code=` | Code input + "Apply" button. Below: small "Don't have a code? Get notified →" link that expands the waitlist email form inline |
| `invalid` | validation returned invalid | Inline error with reason copy, code input pre-filled to retry, same waitlist fallback |
| `valid-ready` | code valid, user not signed in | "Sign up & Claim Lifetime Deal" CTA + plan name + projects line + features list |
| `valid-ready-auth` | code valid, signed in, eligible | "Claim Lifetime Deal" CTA → Stripe checkout |
| `ineligible` | signed in with paid/lifetime sub | "You already have a paid plan" panel + manage subscription button |
| `claimed-waitlist` | waitlist email submitted | "You're on the list" confirmation |

All existing logic is preserved verbatim from current `LifetimeDeal.tsx`: `validate-lifetime-code` invocation, `pricing_tiers` lookup for features, `create-lifetime-checkout` flow, `localStorage` code persistence for signup round-trip, ineligibility detection. Waitlist insert into `lifetime_deal_leads` is copied from `LifetimeDealLanding.tsx` (same `source: "lifetime-deal-landing"` value so analytics stay continuous).

SEO: keep the richer `useSEO` from the landing page (title, description, canonical pointing at `/lifetime`). Keep the FAQPage JSON-LD block.

### 2. Redirect `/lifetime-deal` → `/lifetime`

In `src/App.tsx`, replace the `/lifetime-deal` route element with a small `<Navigate>` component that forwards any `?code=` search param. Delete `src/pages/LifetimeDealLanding.tsx` (no longer referenced).

### 3. Update outbound references

- `public/sitemap.xml` — change `/lifetime-deal` entry to `/lifetime`.
- `public/llms.txt` — update the lifetime URL.
- `src/pages/LifetimeDealLanding.tsx` internal links (`/lifetime` "I already have a code") — moot once deleted.
- Search the codebase for any other `/lifetime-deal` references and point them at `/lifetime`.

## Files touched

- Rewrite: `src/pages/LifetimeDeal.tsx`
- Edit: `src/App.tsx` (swap `/lifetime-deal` route to redirect)
- Edit: `public/sitemap.xml`, `public/llms.txt`
- Delete: `src/pages/LifetimeDealLanding.tsx`

## Out of scope

- No DB schema changes. No edge function changes. No new copy beyond what already exists across the two pages.
- No A/B testing harness — single canonical experience.
- No change to the actual Stripe checkout or `validate-lifetime-code` function.

## Risk notes

- Anyone with `/lifetime-deal` bookmarked still lands correctly via the redirect (with code preserved).
- The Stripe webhook + `create-lifetime-checkout` continue to work unchanged because the redemption logic is copied wholesale, not rewritten.
- One canonical URL avoids duplicate-content SEO penalty between the two near-identical pages.

# Launch Readiness Plan — OptiRFP

A pre-launch sweep across the full app. Grouped by priority so we can ship the must-haves first and queue the nice-to-haves for week-one polish.

## P0 — Must fix before launch

### 1. Billing & Stripe end-to-end verification
- Run a full "real card" smoke test for **every** path: Starter signup → Growth monthly → Growth annual → Business → Enterprise lead → Lifetime Deal → cancel → reactivate → refund.
- Confirm `stripe-webhook` handles all of: `checkout.session.completed` (subscription + payment modes), `customer.subscription.updated/deleted`, `invoice.payment_failed`, `charge.refunded`. Verify each updates `subscriptions`, `organization_subscriptions`, and tier limits consistently.
- Verify the **lifetime** guards we just added: subscription update/delete events must skip rows where `is_lifetime = true`.
- Confirm `STRIPE_WEBHOOK_SECRET` is set in production and webhook signing is enforced (no `constructEventAsync` bypass).
- Reconcile `stripe-prices.ts` price IDs with what's live in Stripe (test vs live mode keys).

### 2. Auth & onboarding hardening
- Confirm `selected_plan` and `lifetime_deal_code` localStorage handoff survives the email-confirmation round-trip on a fresh browser.
- Make sure `Auth.tsx` handles: invalid token, expired magic link, already-confirmed email, password reset deep link.
- Verify `ProtectedRoute` redirects unauth users to `/auth?redirect=...` (not blank screen) and resumes the original route after login.
- Email confirmation: ensure templates point to the production custom domain, not preview.

### 3. Security baseline
- Run `supabase--linter` and `security--run_security_scan`; resolve all CRITICAL/HIGH findings.
- Confirm RLS on every new/touched table: `lifetime_deal_codes`, `lifetime_deal_redemptions`, `subscriptions`, `organizations`, `user_roles`, `api_keys`.
- Verify no edge function logs PII or secrets; rotate any keys ever printed.
- Confirm CSP, HSTS, X-Frame-Options in `netlify.toml` are present and not relaxed.
- Re-check `is_system_admin()` is used everywhere admin endpoints gate access (not `auth.uid() in (...)` lists).

### 4. Production data hygiene
- Purge test users / test orgs / orphaned `subscriptions` rows.
- Make sure `pricing_tiers` rows match Stripe live prices and feature gates.
- Seed at least one real lifetime code in `lifetime_deal_codes` with the production Stripe price ID.
- Confirm RFP storage bucket (`rfp-files`) has 50MB cap and per-org RLS in production.

### 5. Critical user paths smoke test
A scripted run through with screenshots:
1. Sign up → onboarding → upload RFP → analyze → outline → generate proposal → export PDF.
2. Invite teammate → accept invite → comment on section → approve.
3. Search opportunities (SAM.gov, Grants.gov) → start draft from opportunity.
4. Knowledge base upload → use in proposal generation.
5. Upgrade plan → hit a feature gate → upgrade unlocks it immediately.

## P1 — Strongly recommended before launch

### 6. Error & monitoring instrumentation
- Confirm `ErrorBoundary` catches and reports route-level crashes (currently silent?).
- Add a lightweight error reporter (Sentry or a Supabase `error_logs` table) for both frontend and edge functions.
- Set up Stripe webhook failure alerts (Slack/email) so a missed event doesn't silently leave users unprovisioned.
- Verify `useWebVitals` is actually shipping data somewhere usable.

### 7. SEO & marketing surface
- Audit titles/meta on all public pages (`Index`, `Pricing`, `Blog`, `BlogPost`, all `Compare*`, `About`, `FAQ`, `Security`, `Integrations`, `Demo`, `Contact`, `LifetimeDeal`). Each: unique <60-char title, <160-char description, single H1, canonical, OG/Twitter cards.
- `sitemap.xml` includes blog posts and compare pages; `robots.txt` correct for production domain.
- JSON-LD: `Organization`, `Product`, `FAQPage` (on FAQ), `BlogPosting` (on posts), `BreadcrumbList`.
- Verify all images have alt text and lazy loading.

### 8. Performance pass
- Run Lighthouse on `/`, `/pricing`, `/dashboard`, `/projects/:id`. Target: LCP < 2.5s, CLS < 0.1.
- Confirm route-level `lazy()` is doing its job — check the initial JS bundle size.
- Audit `TanStack Query` `staleTime`/`gcTime` defaults vs hot pages (Dashboard, Projects).
- Compress hero images; use AVIF/WebP where possible.

### 9. Accessibility
- Run axe on the top 10 routes; fix focus-trap, label, and color-contrast issues.
- Confirm modals return focus on close and trap focus while open (we have a 150ms delay rule).
- Verify dark mode contrast on brand-purple accents passes WCAG AA.

### 10. Empty/error/loading states
- Every dashboard list (Projects, Opportunities, KB, Team, Webhooks, Saved Searches): real empty state with CTA, not a blank page.
- Replace any `console.error`-only failure paths with user-facing toasts.
- Network-offline state via `NetworkStatusIndicator` actually visible.

## P2 — Polish / week-one follow-ups

### 11. Admin tooling
- `/admin` should expose lifetime code creation + redemption list (we deferred this).
- Add a "Resync subscription from Stripe" button for support tickets.
- Add a "Force tier" override for enterprise comping.

### 12. Email deliverability
- Verify SPF/DKIM/DMARC for `optirfp.ai` send domain.
- Review every transactional template for branding consistency and unsubscribe link where required.
- Send-test all triggered emails: signup, invite, password reset, subscription confirmation, lifetime confirmation, opportunity alerts, annual renewal reminder.

### 13. Legal & compliance
- Public Terms, Privacy, DPA, Subprocessors page reachable from footer.
- Cookie banner if shipping to EU.
- Confirm GDPR delete-account flow (`delete-own-account`) actually purges rows and Stripe customer.

### 14. Analytics & funnel
- Confirm `useAnalytics` fires `signup_started`, `signup_completed`, `checkout_started`, `checkout_completed`, `proposal_generated`, `proposal_exported`.
- Set up a conversion dashboard (signup → first proposal → upgrade).

### 15. Documentation & support
- `HelpCenter` + `Documentation` cover the top 10 questions (uploading RFP, generating proposal, inviting team, billing/cancel, lifetime deal, knowledge base, exporting).
- API docs (`/api-docs`) match what `public-api` actually accepts; include rate limits and auth header format.
- Status page or at least a `/status` link.

## Suggested execution order
1. P0 (1–4): security/billing/auth/data — block launch on these.
2. P0 #5 smoke test — pass before any soft-launch.
3. P1 in parallel during soft launch (SEO, perf, a11y, empty states, monitoring).
4. P2 in week one.

## Deliverable for the next loop
If you approve, the next pass will:
- Run the linter + security scan and triage findings.
- Walk the critical user paths in the preview, capture issues, and fix the blocking ones.
- Audit SEO meta on every public page and patch gaps.

Tell me which sections you want me to take on first, or say "all P0" and I'll start there.

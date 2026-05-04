
# App-Wide UX & Integration Review

I walked the auth flow, dashboard, onboarding, opportunity search, edge function inventory, and console/network logs from your current session. Here are the real, reproducible issues — grouped by severity — and a focused fix plan. No speculative refactors.

---

## Critical (broken or user-facing bugs)

### 1. Welcome dialog still re-appears on login
The earlier fix added DB-backed skip tracking in `useOnboardingFlow` (good), but `Dashboard.tsx` still has a **second, independent wizard** (`FirstRFPWizard`) gated only by two `localStorage` keys (`optirfp_first_rfp_complete`, `optirfp_wizard_skipped`). When a user logs in on a new browser/device, both keys are missing and the wizard pops again — exactly the behavior you reported.

Fix: gate `FirstRFPWizard` on the same DB-backed `onboarding.isCompleted || onboarding.isSkipped` signal (already loaded from `profiles`), and persist its skip/complete to the profile too. Treat localStorage as a cache, not the source of truth.

### 2. Auth initialization timing out on every load
Console shows `Auth initialization timeout reached. Force completing auth init` on both anonymous and signed-in loads. The `getSession()` race in `AuthProvider` uses a 3s timeout, then a 7s safety timeout — but the 7s fires because the session listener path doesn't always clear `loading`. This makes the first paint feel slow and triggers the "Loading your session…" spinner unnecessarily.

Fix: clear `loading` inside `onAuthStateChange` on first event, and shorten the safety timeout fallback. Also remove the redundant double profile fetch visible in logs (the profile is fetched twice back-to-back for the same user).

### 3. Dialog accessibility error in production
`DialogContent requires a DialogTitle` warning is firing in the built bundle (likely the command palette / a sheet). Screen readers will announce nothing; Radix may also throw in strict mode.

Fix: audit dialogs without `DialogTitle` (wrap with `VisuallyHidden` where the title shouldn't be displayed). Most likely culprits: `CommandDialog`, quick-search popovers.

### 4. Opportunity search returns 0 results for valid keywords
Network log: SAM.gov returns `30754 total records (90-day window)` for "Video", but the response surfaces `opportunities: []`. Provider says `success, count: 25` yet the array is empty — a mapping/filter step inside `search-opportunities` is dropping all rows (likely the per-org keyword post-filter or a field-name mismatch after the SAM payload shape changed).

Fix: trace the mapping in `supabase/functions/search-opportunities/index.ts`, add a diagnostic count before/after each filter, and ensure the SAM `opportunitiesData[]` → unified shape mapping isn't returning `null` for every row.

### 5. FedConnect silently disabled
`FedConnect: skipped — API key not configured`. Either remove FedConnect from the default selected sources, or surface a one-time admin notice. Right now users tick the checkbox and get nothing, with no UI feedback.

---

## High (degraded experience)

### 6. Two competing onboarding systems
You have **three** onboarding surfaces firing on the dashboard:
- `ProgressiveOnboarding` (DB-backed, new)
- `FirstRFPWizard` (localStorage-backed, legacy)
- `EnterpriseOnboarding` + `EnterpriseGettingStarted` (also localStorage)
- Plus `KnowledgeSetupWizard` and `DashboardEmptyState` checklist

A first-time user can see 2–3 modals stacked. Consolidate: `ProgressiveOnboarding` is the single source of truth; `FirstRFPWizard` becomes an *optional* deeper-dive triggered only from the empty-state CTA, never auto-opened.

### 7. Enterprise onboarding gating is wrong
`{isEnterprise && (isNewUser || !localStorage.getItem('enterprise-onboarding-skipped')) && <EnterpriseOnboarding />}` — the `||` means non-new users who never clicked skip still see the banner forever. Should be `&&`, and skip state belongs in `organizations.settings.setup_progress` (already exists from the prior task).

### 8. Profile fetched twice per login
Logs show `Fetching profile data (attempt 1)` running twice within 50ms because both `useProfile` and a parallel listener trigger it. Memoize via React Query (you already have it set up) instead of the custom fetch in `use-profile.tsx`.

### 9. CSM contact widget shows placeholder data
For non-enterprise orgs, `csm_name = "Your OptiRFP CSM"` and `csm_email = "csm@optirfp.ai"` are seeded as defaults. `CSMContactWidget` happily shows them, implying every Pro user has a dedicated CSM. Hide the widget unless `subscription_tier IN ('enterprise','white_label')`.

### 10. `legacy /admin/source-health` and a few orphan routes
Some sidebar links go to pages that throw 404 or render empty: `SourceStatusDashboard` requires `is_system_admin` but isn't gated in routing.

---

## Medium (polish)

- **Organization name renders as `'s Organization`** (logs) — empty `first_name` at signup creates a malformed default. Fall back to `email.split('@')[0] + "'s Organization"`.
- **Subscription provider clears + refetches on every mount** ("Clearing subscription data" → "Fetching subscription data from API"), causing dashboard widgets to flash. Add a `staleTime`.
- **Network indicator polls `HEAD /favicon.ico` every 30s forever** — wasteful; switch to `navigator.onLine` + a single ping on `online`/`offline` events.
- **Toaster duration 4s + 3 visible** can clip long error messages. Bump to 6s for `richColors` errors.
- **`/settings` redirects to `/account`** — fine, but the sidebar still shows two entries in some places.

---

## Low (housekeeping)

- Unused imports in `App.tsx` (`React`).
- `EnterpriseOnboarding` page (`/onboarding/enterprise`) and the dashboard banner duplicate steps; pick one entry point.
- `PricingRedirect` is named like a redirect but renders the full pricing page — rename for clarity.

---

## Implementation Plan (in order)

1. **Onboarding consolidation (fixes #1, #6, #7)**
   - Remove auto-open of `FirstRFPWizard` from `Dashboard.tsx`; only open via the empty-state button.
   - Persist `FirstRFPWizard` complete/skip to `profiles.onboarding_completed` (reuse `useOnboardingFlow.skip/complete`).
   - Change `EnterpriseOnboarding` gate to `isNewUser && !setup_progress.welcome_dismissed`; store dismiss in `organizations.settings`.

2. **Auth/profile loop (fixes #2, #8)**
   - In `AuthProvider`, set `loading=false` on first `onAuthStateChange` event; drop the 7s safety to 3s.
   - Migrate `useProfile` to a single React Query keyed by `user.id` with `staleTime: 5min`.

3. **Opportunity search results (fix #4)**
   - Add diagnostic logging in `search-opportunities` mapper; verify SAM field names; return the actual mapped array.
   - Ship a regression test via `supabase--test_edge_functions`.

4. **FedConnect UX (fix #5)**
   - Hide FedConnect from the source list when `FEDCONNECT_API_KEY` is not configured (server returns a `configured: false` flag).

5. **Dialog a11y (fix #3)**
   - Sweep `CommandDialog` and any custom dialogs for missing titles; wrap hidden ones in `VisuallyHidden`.

6. **CSM widget gating (fix #9)** — single conditional in `CSMContactWidget`.

7. **Polish pass** — org-name fallback, subscription `staleTime`, network indicator rewrite, toast duration.

---

## Out of scope (call out, don't change)
- The broader multi-tenant / white-label roadmap in `project-knowledge` — not touching it here.
- Stripe/HubSpot integrations look healthy in logs; no changes proposed.

Approve and I'll implement steps 1–6 in one pass, then do the polish items in a follow-up.

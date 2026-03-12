

## Plan: Pricing Page Architecture for Visitors and Logged-in Users

### Changes

**1. Create `/pricing` route redirect — `src/pages/Pricing.tsx`**
- Simple component that redirects to `/#pricing` using `window.location.href`
- Handles both direct navigation and SEO crawlers

**2. Add `/pricing` route — `src/App.tsx`**
- Add `<Route path="/pricing" element={<PricingRedirect />} />` as a public route (alongside `/docs`, `/blog`)

**3. Update homepage hash scroll — `src/pages/Index.tsx`**
- Add `useEffect` to scroll to `#pricing` on load when URL hash is present
- The `<div id="pricing">` already exists (line 155) — no change needed there

**4. Update Footer link — `src/components/navigation/Footer.tsx`**
- Change `<Link to="/subscription">Pricing</Link>` → `<a href="/#pricing">Pricing</a>` for visitors
- For logged-in users, keep linking to `/subscription` (use `useAuth` to branch)

**5. Add "View Plans" to desktop user dropdown — `src/components/navigation/Navbar.tsx`**
- Add a `DropdownMenuItem` linking to `/subscription` with a `DollarSign` icon between "Account Settings" and the separator (line ~243)

**6. Add "View Plans" to mobile nav — `src/components/navigation/Navbar.tsx`**
- The mobile nav already has a "Subscription" link (line 423-431) pointing to `/account-settings#subscription`
- Update it to link to `/subscription` instead, and rename to "Plans & Pricing"

**7. Add "See all plans" link to TrialCountdown — `src/components/subscription/TrialCountdown.tsx`**
- In the banner variant's description text, add a `PlanComparisonModal` trigger: "See all plans" link next to the Upgrade button
- Reuse existing `PlanComparisonModal` component

### Files touched
- **New**: `src/pages/Pricing.tsx`
- **Modified**: `src/App.tsx`, `src/pages/Index.tsx`, `src/components/navigation/Footer.tsx`, `src/components/navigation/Navbar.tsx`, `src/components/subscription/TrialCountdown.tsx`


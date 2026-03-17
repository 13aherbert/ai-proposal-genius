

## Plan: Suppress Upgrade Prompts for Enterprise Users

### Problem
Enterprise users ($1,499/mo) see upgrade banners, feature gate paywalls, and "Upgrade to Growth — $199/month" CTAs — which is incorrect since they already have full access.

### Root Cause
Several components check for free/starter plan but don't short-circuit for enterprise:
- `UsageProgressBanner` — shows project limit bar and "Upgrade Now" for all plans
- `TrialCountdown` — only checks `isFreePlan` but shows upgrade buttons
- `UpgradeBanner` — only checks `isFreePlan` (already works correctly — returns null for enterprise)
- `FeatureGate` — relies on `hasFeature()` which already grants all features to enterprise via `FEATURE_ACCESS_MAP`, so this **already works correctly**
- `UpgradeGateModal` — can still open for enterprise users
- `PlanComparisonModal` — shows "Upgrade" CTAs even for current/lower plans

### Changes

| File | Change |
|------|--------|
| `src/components/subscription/UsageProgressBanner.tsx` | Return early with "Enterprise Plan — Unlimited Projects" badge when `plan === 'enterprise'` or `projectLimit === -1` |
| `src/components/subscription/TrialCountdown.tsx` | Add enterprise check alongside `isFreePlan` — return null for enterprise |
| `src/components/subscription/UpgradeGateModal.tsx` | Return null / don't render when `currentPlan === 'enterprise'` |
| `src/components/subscription/PlanComparisonModal.tsx` | Show "Your Plan" badge on Enterprise row, disable CTA buttons for current and lower plans |
| `src/components/dashboard/WelcomeMessage.tsx` | Show "Enterprise" properly (already capitalizes, but ensure correct display) |

### What Already Works (No Changes Needed)
- `FeatureGate.tsx` — `hasFeature()` returns true for all features on enterprise, so children render directly
- `UpgradeBanner.tsx` — checks `isFreePlan`, returns null for enterprise
- Navigation — no upgrade links found
- `feature-access.ts` — enterprise is in all feature access lists

### No database or backend changes needed.


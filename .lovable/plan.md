

## Plan: Usage Progress Banner

### What to Build
A `UsageProgressBanner` component that replaces the three trial-focused banners (`TrialCountdown`, `TrialExpiredBanner`, `UpgradeBanner`) in `DashboardLayout`. It shows project usage with color-coded progress bar and contextual upgrade CTA -- no trial language.

### New Component: `src/components/subscription/UsageProgressBanner.tsx`

**Data sources**: Uses `useSubscriptionFeatures()` for plan/limit and queries `projects` table via org for count (same pattern as existing `UsageStats`).

**Layout (banner style, ~48px)**:
- Left: Plan badge + "Free Plan — 2 of 3 projects used"  
- Center: Progress bar (h-2, rounded-full, animated width transition)
- Right: "Upgrade" button (visible when ≥70% or at limit)
- Mobile: stacks vertically, simplified "2/3 projects used"

**Color logic on the progress fill**:
- `< 70%`: `bg-green-500`
- `70–90%`: `bg-orange-500`  
- `> 90%`: `bg-red-500`

**At-limit state**: Banner changes to urgent messaging — "You've reached your 3-project limit. Upgrade to Basic for 10 projects." with prominent CTA.

**Plan name mapping**: `starter` → "Free Plan", `basic` → "Basic Plan", `pro` → "Pro Plan". No "trial", "expires", or "days left" language.

### Modify: `src/layouts/DashboardLayout.tsx`
- Remove imports/renders of `TrialCountdown`, `TrialExpiredBanner`, `UpgradeBanner`
- Add `UsageProgressBanner` in their place
- Remove `useSubscription` import (banner handles its own data)

### Modify: `src/types/subscription.ts`
- Fix inconsistency: `SUBSCRIPTION_PLAN_LIMITS.starter` says 3 but `use-project-limits.ts` logs say 10. The canonical limit is **3** per `subscription-limits.ts` and `DEFAULT_STARTER_SUBSCRIPTION`. The log messages in `use-project-limits.ts` are wrong — will note but not change in this task (separate concern).

### Files

| File | Action |
|------|--------|
| `src/components/subscription/UsageProgressBanner.tsx` | Create |
| `src/layouts/DashboardLayout.tsx` | Replace 3 banners with `UsageProgressBanner` |




## Plan: Implement Project Limit Enforcement and Upgrade Gates

### Current State
- `use-rfp-upload.ts` already checks project count vs limit and `UploadRFP.tsx` shows `UpgradeGateModal` when at limit
- `UsageWarning` component exists on Dashboard but is text-only (no progress bar)
- `UpgradeGateModal` shows generic Growth-only content with stale limits (12 instead of 6)
- `check_project_limit` DB function exists and is called via trigger `enforce_project_limit`
- `get_plan_limits` DB function is stale (returns 3/10/30 for starter/basic/pro)

### Changes

**1. Fix `get_plan_limits` DB function** — New migration
- Return 6/36/120/-1 for starter/growth/business/enterprise instead of stale 3/10/30

**2. Redesign `UpgradeGateModal` to be tier-aware**
- Accept `currentPlan` prop (starter/growth/business) to show different content per tier
- **Starter at limit**: headline "You've used all 6 projects", bullets about Growth features (36 projects, unlimited team, no watermarks, Opportunity Search, email support), CTAs: "Upgrade to Growth — $199/month" + "Explore Business Plan"
- **Growth at limit**: headline "You've reached your Growth plan limit", bullets about Business features (120 projects, unlimited Opportunity Search, API access, AI Evaluation, priority support), CTA: "Upgrade to Business — $499/month"
- Microcopy: "14-day free trial · Cancel anytime"
- Fix stale `currentLimit` default from 12 to 6, update comparison rows

**3. Add "last project" warning toast in `use-rfp-upload.ts`**
- After successful project creation, if `currentProjectCount === projectLimit - 1`, show warning toast: "This is your last project slot. Upgrade for more."

**4. Replace `UsageWarning` with `UsageProgressWidget`** — new component
- Visual progress bar using existing `Progress` component
- Shows "4 of 6 projects used" with color coding: green (<70%), yellow (70-90%), red (>=100%)
- At 5+ of 6: yellow warning state
- At 6 of 6: red + "Upgrade" button that opens `UpgradeGateModal`
- Clicking the bar also opens the upgrade modal when at limit

**5. Update Dashboard to use `UsageProgressWidget`**
- Replace `<UsageWarning>` with `<UsageProgressWidget>` in Dashboard.tsx
- Pass `currentPlan` for tier-aware modal content

**6. Update `ProjectsToolbar` to show last-project warning**
- When `projectCount === displayProjectLimit - 1`, show yellow badge "1 slot left"

**7. Ensure project count excludes archived**
- Update `use-rfp-upload.ts` `fetchProjectCount` to add `.neq('status', 'archived')` filter
- Update `UsageStats`, `UsageProgressWidget`, and `check_project_limit` DB function to exclude archived projects

### Files touched
- **New migration**: `supabase/migrations/[timestamp]_fix_get_plan_limits.sql`
- **Modified**: `src/components/subscription/UpgradeGateModal.tsx`
- **New**: `src/components/subscription/UsageProgressWidget.tsx`
- **Modified**: `src/components/subscription/UsageWarning.tsx` (keep for backward compat, but dashboard switches to widget)
- **Modified**: `src/pages/Dashboard.tsx`
- **Modified**: `src/hooks/use-rfp-upload.ts`
- **Modified**: `src/components/projects/ProjectsToolbar.tsx`


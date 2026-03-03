

## Plan: Interactive Onboarding Checklist

The existing `DashboardEmptyState.tsx` already has a checklist section (lines 164-236) that is close to what's requested but lacks confetti celebration, progress bar, staggered animations, the "all complete" CTA, and the enhanced styling from the spec. The `OnboardingProgress` component in the sidebar is a separate, older widget.

### Approach
Upgrade the checklist section inside `DashboardEmptyState.tsx` in-place rather than creating a separate component, since it already has the correct data flow and props.

### Changes to `src/components/dashboard/DashboardEmptyState.tsx`

**Checklist section upgrades (lines 164-236):**
- Add `Progress` bar (h-2) below the header showing `completedCount / items.length` with percentage text
- Add confetti burst (`canvas-confetti`) via `useEffect` when all 3 items are completed
- Enhance status icons to 32px circles: green-500 + Check for completed, yellow-500 + Loader2 (animate-spin) for in-progress, gray-200 + Circle for pending
- Add staggered fade-in animation on checklist items using inline `style={{ animationDelay }}` with the existing `animate-fade-in` class
- Add "all complete" state: green border on Card, "Complete!" badge with Sparkles in header, description changes to congratulatory text, and a full-width "Create Your First Proposal" CTA at the bottom linking to `/upload-rfp`
- Item card styling: use `border-2` instead of `border`, add hover transition on pending items

**Imports to add:** `Progress`, `Loader2`, `confetti` (from canvas-confetti), `useEffect`/`useState` (already imported: useMemo)

### Changes to `src/pages/Dashboard.tsx`

No changes needed — `DashboardEmptyState` is already rendered with the correct props when `!isEstablished && !isEnterprise`.

### Files Summary

| File | Action |
|------|--------|
| `src/components/dashboard/DashboardEmptyState.tsx` | Modify — enhance checklist with progress bar, confetti, animations, all-complete state |




## Plan: Inline Upgrade Prompts Throughout the App

### What to Build

Three reusable components plus integration points across the app.

### Component 1: `FeatureGate` — Soft gate for Pro/Enterprise features

**File**: `src/components/subscription/FeatureGate.tsx`

A wrapper component that shows children normally if the user has access, or renders a blurred/locked overlay with "Pro Feature — Upgrade to unlock" if they don't.

```text
┌─────────────────────────────────┐
│ [blurred content underneath]    │
│       🔒 Pro Feature            │
│    "Upgrade to unlock"          │
│       [Upgrade button]          │
└─────────────────────────────────┘
```

- Props: `feature: FeatureName`, `children`, optional `label` override
- Uses `useSubscriptionFeatures().hasFeature()` to check access
- Click opens `PlanComparisonModal` (Component 3)
- No urgency language — just "Upgrade to unlock"

### Component 2: `UsageWarning` — Progressive usage messaging

**File**: `src/components/subscription/UsageWarning.tsx`

A small inline text component that shows contextual usage messages based on project count vs limit.

- Props: `projectCount: number`, `projectLimit: number`, `className?`
- Messages:
  - `< 70%`: "X projects remaining on Free Plan" (subtle, `text-muted-foreground`)
  - `70-90%`: "1 project remaining — consider upgrading" (orange text)
  - `100%`: "You've used all X projects — upgrade for more" (red text + upgrade link)
- Renders inline (not a banner) — suitable for placement inside cards/sections

### Component 3: `PlanComparisonModal` — Full 4-column plan comparison

**File**: `src/components/subscription/PlanComparisonModal.tsx`

A `max-w-4xl` dialog with a 4-column plan comparison table. Triggered by any "Upgrade" or "See all plans" CTA throughout the app.

- Columns: Starter (Free) | Basic ($49/mo) | Pro ($99/mo) | Enterprise ($499/mo)
- Highlights current plan with badge + ring
- Highlights recommended upgrade column
- Per-feature rows with checkmarks: Projects, AI Analysis, Support, Data Export, Team Collaboration, Opportunity Search, API Access, Custom Templates
- Each column has a CTA button at bottom
- Props: `open`, `onOpenChange`, optional `highlightPlan` to pre-select recommended
- Reuse feature data from existing `SubscriptionPlans.tsx` for consistency
- Blue CTAs, no urgency language

### Integration Points

**Dashboard (`src/pages/Dashboard.tsx`)**:
- Add `FeatureGate` around "Find Opportunities" quick action card for non-Pro users — show it always but locked for starter/basic
- Add `UsageWarning` below the quick actions grid showing progressive usage text

**ProjectsToolbar (`src/components/projects/ProjectsToolbar.tsx`)**:
- Replace the `UpgradeGateModal` trigger with `PlanComparisonModal` (full 4-col comparison instead of 2-col)
- The "3 of 3" counter already exists in `ProjectsHeader`; no changes needed there

**AccountSettings — SubscriptionCard**:
- Wire "See all plans" to open `PlanComparisonModal` instead of navigating to `/subscription`

**Opportunities page** (`src/pages/Opportunities.tsx`):
- Already gates on `opportunity_search` feature — wrap the locked state in `FeatureGate` for consistent styling

### Files

| File | Action |
|------|--------|
| `src/components/subscription/FeatureGate.tsx` | Create — reusable soft gate wrapper |
| `src/components/subscription/UsageWarning.tsx` | Create — progressive usage text |
| `src/components/subscription/PlanComparisonModal.tsx` | Create — 4-column plan comparison dialog |
| `src/pages/Dashboard.tsx` | Modify — add FeatureGate on Opportunities card, add UsageWarning |
| `src/components/projects/ProjectsToolbar.tsx` | Modify — use PlanComparisonModal |
| `src/components/subscription/UpgradeGateModal.tsx` | Modify — delegate to PlanComparisonModal internally |


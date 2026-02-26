

## Gate Design Studio to Pro+ Subscribers

### Problem
The Design tab currently uses `proposal_draft` as its feature gate, which grants access to all plans (trial, starter, pro). It should be restricted to pro and higher.

### Changes

#### 1. Add `design_studio` feature to the feature system
**File:** `src/hooks/subscription/subscription-features-types.ts`
- Add `'design_studio'` to the `FeatureName` union type

#### 2. Add `design_studio` to the feature access map
**File:** `src/hooks/subscription/feature-access.ts`
- Add `design_studio: ['pro']` to `FEATURE_ACCESS_MAP`

#### 3. Update sidebar to use new feature gate
**File:** `src/components/project/details/ProjectSidebar.tsx`
- Change the design section's `feature` from `"proposal_draft"` to `"design_studio"`

#### 4. Update ProjectContent to use new feature gate
**File:** `src/components/project/details/ProjectContent.tsx`
- Change the `case "design"` check from `hasFeature("proposal_draft")` to `hasFeature("design_studio")`

| File | Change |
|------|--------|
| `subscription-features-types.ts` | Add `design_studio` to `FeatureName` |
| `feature-access.ts` | Add `design_studio: ['pro']` to access map |
| `ProjectSidebar.tsx` | Update design section feature to `design_studio` |
| `ProjectContent.tsx` | Update design case feature check to `design_studio` |


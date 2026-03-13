

## Plan: Update Feature Gates for Unlimited Users on Paid Tiers

### Problem
1. `FeatureGate.tsx` shows a generic lock overlay for all features — no feature-specific messaging for team collaboration (user limits, ROI, etc.)
2. `PlanComparisonModal.tsx` has stale plan data: old names (Basic/Pro), old prices ($49/$99), wrong project limits (3/10/30), and no "Team Members" row showing unlimited users on paid tiers.

### Changes

**1. Update `FeatureGate.tsx` — Feature-specific lock messaging**
- Add a `FEATURE_GATE_CONFIG` map keyed by `FeatureName` with custom icon, title, description, and upgrade CTA for specific features.
- For `team_collaboration`: icon = `Users`, title = "Invite Your Team", description = "Collaborate with unlimited team members on proposals", current status = "Free plan: 1 user only", CTA = "Upgrade to Growth — $199/month for unlimited users", ROI line = "Less than $17/user for a 12-person team".
- For features without custom config, fall back to the existing generic lock overlay.
- Import `Users` from lucide-react for the team collaboration gate.

**2. Update `PlanComparisonModal.tsx` — Align with current pricing model**
- Update `PLANS` array to new tiers: Starter ($0), Growth ($199/mo), Business ($499/mo), Enterprise ($1,499/mo).
- Update `FEATURES` rows:
  - Projects: 12 / 36 / 120 / Unlimited
  - **Add "Team Members" row**: 1 user / Unlimited / Unlimited / Unlimited (highlight unlimited)
  - Team Collaboration: false / true / true / true (available on all paid tiers, not just Pro+)
  - Data Export: false / true / true / true
  - Update other rows as needed to match current feature access
- Update CTA buttons: "Upgrade to Growth", "Upgrade to Business", "Contact Sales"
- Update recommended logic: starter → growth (not basic)

### Files touched
- **Modified**: `src/components/subscription/FeatureGate.tsx`, `src/components/subscription/PlanComparisonModal.tsx`


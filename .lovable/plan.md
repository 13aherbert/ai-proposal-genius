## Goal
Make tier access consistent across the app and fix the bug where Starter users are blocked from RFP Summary and Proposal Outline (they should have access).

## Canonical tier matrix (single source of truth)

| Capability | Starter | Growth | Business | Enterprise |
|---|---|---|---|---|
| RFP Summary | ✅ | ✅ | ✅ | ✅ |
| Proposal Outline | ✅ | ✅ | ✅ | ✅ |
| Proposal Draft (editor) | ✅ | ✅ | ✅ | ✅ |
| Compiled / Split view | — | ✅ | ✅ | ✅ |
| AI Editor, Custom Templates, Data Export, Team Collab, Opportunity Search | — | ✅ | ✅ | ✅ |
| Auto-Generated Proposal, Evaluation, Review Pipeline, Design Studio, Advanced Analytics, API, Priority Support | — | — | ✅ | ✅ |
| White Label, SSO | — | — | — | ✅ |
| Project limit | 6 | 36 | 120 | unlimited |

This matches `FEATURE_ACCESS_MAP` in `src/hooks/subscription/feature-access.ts` and the FAQ copy.

## Bugs to fix

1. **Starter blocked from RFP Summary & Outline** — `src/components/project/unified-analysis/UnifiedAnalysisView.tsx` wraps both panels in `<GatedFeature requiredTier="growth">`, which forces a paywall regardless of `FEATURE_ACCESS_MAP`. Remove the GatedFeature wrappers around `RFPAnalysis` and `ProposalOutline` (they are starter-tier features). Also drop the `Lock` icon / locked state on the two tabs since `hasFeature` returns true for both on starter.

2. **`compiled_draft` mismatch** — UI in `UnifiedProposalView.tsx` gates Compiled & Split views to `growth`, but `FEATURE_ACCESS_MAP.compiled_draft` is `['business','enterprise']`. Resolution: align the map to growth (Compiled/Split are presentation-only views of the existing draft, so growth is the right floor and matches the UI). Update `feature-access.ts`.

## Files to change

- `src/components/project/unified-analysis/UnifiedAnalysisView.tsx`
  - Remove the two `GatedFeature` wrappers; render `RFPAnalysis` and `ProposalOutline` directly inside their `Suspense` boundaries.
  - Simplify the tabs (no `locked` / `Lock` icon — both are available on every tier).
  - Drop the now-unused `useSubscriptionFeatures`, `Lock`, `GatedFeature` imports.

- `src/hooks/subscription/feature-access.ts`
  - Change `compiled_draft: ['business', 'enterprise']` → `compiled_draft: ['growth', 'business', 'enterprise']`.

## Verified already-consistent (no change)

- `ProjectStageNav` deliver stage → growth (review starts at growth) ✅
- `ProjectContent` Deliver tabs: Review → growth, Design → business ✅
- `UnifiedProposalView` Auto-Generated → business ✅
- `ProjectSidebar` SECTION_REQUIRED_TIER (overview/analysis/proposal=free, review=growth, design=business) ✅
- `useFeatureGate` FEATURE_REQUIRED_PLAN, `SubscriptionManager` pricing copy, `faq.tsx` ✅

## Out of scope
- Pricing page marketing copy (already aligned)
- Database `pricing_tiers` rows (handled by prior migration)
- Stripe price IDs

## Verification
After changes, on a Starter account on `/projects/:id`:
- Brief, Analyze (RFP Summary + Outline tabs both render content), Draft (Editor + Draft view) are all accessible.
- Auto-Generated, Compiled, Split, Deliver stages still show the upgrade gate at the correct tiers.

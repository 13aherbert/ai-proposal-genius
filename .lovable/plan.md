

## Plan: Fix Confusing "$49" on Pricing Page

### Problem
The "Average Cost per Proposal" comparison chart in `src/components/blocks/comparison-charts.tsx` shows `$49` as OptiRFP's cost. While this represents a per-proposal cost (not a subscription price), it appears on the same page as pricing cards and is easily mistaken for a plan price — confusing prospects.

### Analysis
- The `$49` figure is in a bar chart labeled "Average Cost per Proposal" (Traditional: $2,000 vs OptiRFP: $49)
- Based on current Business plan math: $499×12÷120 projects ≈ $50/proposal — so the number is approximately correct
- However, the label just says "$49" with no "per proposal" qualifier, making it look like a subscription price
- No other stale pricing ($49 subscription or $99 old Pro) exists in the codebase — all other references are correct competitor prices (e.g., Proposify's $49/user/month)

### Changes

**`src/components/blocks/comparison-charts.tsx`** — Update chart data to avoid confusion:
- Change value from `49` to `50` and label from `$49` to `$50/proposal` to clearly distinguish from subscription pricing
- This aligns with actual Business plan math ($499×12÷120 = $49.90 ≈ $50)

### Files Modified (1)
- `src/components/blocks/comparison-charts.tsx`


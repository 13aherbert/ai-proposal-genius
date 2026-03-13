

## Plan: Fix Competitor Comparison Boolean Display

The issue is in the `CellValue` component in `CompetitorComparison.tsx`. Currently, `true` (competitors charge per-seat) renders a red **X**, and `false` (OptiRFP doesn't) renders a green **checkmark**. This reads as if competitors *don't* charge per-seat and OptiRFP *does* — the exact opposite of the intent.

### Fix

Replace the boolean icons with clear text labels:
- `true` → **"Yes"** styled in red/muted (bad for customer)
- `false` → **"No"** styled in green/bold (good for customer — OptiRFP's advantage)

This removes all ambiguity. A simple "Yes" / "No" makes the per-seat row immediately clear.

### File changed
- `src/components/blocks/CompetitorComparison.tsx` — Update `CellValue` boolean rendering


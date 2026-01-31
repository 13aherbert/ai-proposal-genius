
# Fix Deprecated Claude Model Names - COMPLETED ✅

## Problem Summary

During end-to-end testing of the Auto-Generate Proposal feature, I discovered that 19 out of 29 sections failed to generate because the Claude 3.5 models (`claude-3-5-sonnet-20241022` and `claude-3-5-haiku-20241022`) were deprecated and returned 404 errors.

## Changes Made

Updated all three model selector files to use current Claude 4.5 model names:

### File 1: `supabase/functions/generate-full-proposal/model-selector.ts` ✅

- HIGH tier: `claude-sonnet-4-5-20250929` (Claude Sonnet 4.5)
- MEDIUM tier: `claude-sonnet-4-5-20250929` (Claude Sonnet 4.5)
- LOW tier: `claude-haiku-4-5-20251001` (Claude Haiku 4.5)
- Updated MODEL_COSTS with new pricing ratios

### File 2: `supabase/functions/generate-section-content/model-selector.ts` ✅

- Same model updates applied
- Updated display names
- Updated cost estimation function

### File 3: `supabase/functions/generate-section-content/multi-model-orchestrator.ts` ✅

- Updated MODELS array with new model names

## Updated Model Configuration

```text
+-------------------+---------------------------+
| Tier              | Model                     |
+-------------------+---------------------------+
| HIGH (Strategic)  | claude-sonnet-4-5-20250929|
| MEDIUM (Balanced) | claude-sonnet-4-5-20250929|
| LOW (Fast)        | claude-haiku-4-5-20251001 |
+-------------------+---------------------------+
```

## Expected Outcome

- 29/29 sections should now generate successfully
- Cost reduction maintained at ~60% vs Opus baseline
- Generation quality should be high across all tiers

## Status: DEPLOYED ✅

Edge functions deployed and ready for testing.

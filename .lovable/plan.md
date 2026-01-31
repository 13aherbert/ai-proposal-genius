
# Fix Deprecated Claude Model Names

## Problem Summary

During end-to-end testing of the Auto-Generate Proposal feature, I discovered that 19 out of 29 sections failed to generate because the Claude 3.5 models (`claude-3-5-sonnet-20241022` and `claude-3-5-haiku-20241022`) have been deprecated and now return 404 errors.

Only the HIGH tier using `claude-sonnet-4-20250514` (Claude Sonnet 4) worked correctly.

## What's Working

- **Chunking system**: Successfully processes 5 chunks of sections
- **Knowledge filtering**: 98-99% context reduction (276K to 3-6K chars)
- **Model selection logic**: Correctly categorizes section complexity
- **Error handling**: Gracefully adds placeholders for failed sections
- **Progress tracking**: Real-time UI updates
- **Cost optimization metrics**: Displays tier distribution

## Required Changes

Update the model names in two files to use the current Anthropic Claude 4.5 models:

### File 1: `supabase/functions/generate-full-proposal/model-selector.ts`

Update the MODELS constant:
- HIGH tier: Keep `claude-sonnet-4-20250514` (working) or update to `claude-sonnet-4-5-20250929`
- MEDIUM tier: Change from `claude-3-5-sonnet-20241022` to `claude-sonnet-4-5-20250929`
- LOW tier: Change from `claude-3-5-haiku-20241022` to `claude-haiku-4-5-20251001`

Update the MODEL_COSTS dictionary with new pricing based on official Anthropic pricing:
- Claude Sonnet 4.5: $3/MTok input, $15/MTok output
- Claude Haiku 4.5: $1/MTok input, $5/MTok output

### File 2: `supabase/functions/generate-section-content/model-selector.ts`

Apply the same model name updates to ensure consistency across both edge functions.

### File 3: `supabase/functions/generate-section-content/multi-model-orchestrator.ts`

Update the MODELS array with the correct model names.

## Updated Model Configuration

```text
+-------------------+---------------------------+---------------+
| Tier              | Current (Broken)          | Fixed Model   |
+-------------------+---------------------------+---------------+
| HIGH (Strategic)  | claude-sonnet-4-20250514  | claude-sonnet-4-5-20250929 |
| MEDIUM (Balanced) | claude-3-5-sonnet-20241022| claude-sonnet-4-5-20250929 |
| LOW (Fast)        | claude-3-5-haiku-20241022 | claude-haiku-4-5-20251001  |
+-------------------+---------------------------+---------------+
```

Note: With the new model lineup, HIGH and MEDIUM tiers will use the same model (Sonnet 4.5) since there's no intermediate option between Sonnet 4.5 and Haiku 4.5.

## Updated Cost Calculations

Based on current Anthropic pricing:
- Claude Sonnet 4.5: ~$3/MTok input, ~$15/MTok output
- Claude Haiku 4.5: ~$1/MTok input, ~$5/MTok output
- Claude Opus 4.5 (baseline): ~$5/MTok input, ~$25/MTok output

Relative costs vs Opus 4.5:
- Sonnet 4.5: ~60% input cost, ~60% output cost
- Haiku 4.5: ~20% input cost, ~20% output cost

## Expected Outcome After Fix

- 29/29 sections should generate successfully
- Average quality should improve from 25% to 70-80%
- Cost reduction should remain at approximately 60%
- Generation time should remain around 27 seconds per batch

## Technical Notes

The fix is minimal - only model name strings need to be updated. The tiered model selection logic, knowledge filtering, and chunking system are all working correctly.

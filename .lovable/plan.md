

# Proposal Evaluation Enhancement Plan

## Problem Identified

The Proposal Evaluation functionality has two issues:
1. **Token Limit Too Low**: Current `max_tokens: 4000` may truncate detailed evaluations
2. **Direct Anthropic API**: Still vulnerable to quota limits (other functions already migrated to Lovable AI Gateway)

## Current Configuration

| Setting | Current Value | Issue |
|---------|---------------|-------|
| Model | `claude-sonnet-4-5-20250929` | Good choice, but API may hit quota |
| Max Tokens | `4000` | Too low for comprehensive evaluations |
| API | Direct Anthropic | Not aligned with other migrated functions |

## Proposed Solution

### Migrate to Lovable AI Gateway with Optimized Settings

**Model Selection**: `google/gemini-2.5-pro`
- Best for complex analysis and large context handling
- Excellent at synthesizing multiple sections
- Cost-effective via Lovable AI Gateway (pre-provisioned credits)

**Token Limit**: Increase to `8000` tokens
- Allows comprehensive multi-section evaluation
- Supports detailed recommendations without truncation
- ~6000 words of evaluation output capacity

---

## Implementation Details

### Changes to `supabase/functions/evaluate-proposal/index.ts`:

**1. Switch to Lovable AI Gateway**
```typescript
// Replace direct Anthropic API call with:
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
```

**2. Use Gemini 2.5 Pro for Deep Analysis**
```typescript
body: JSON.stringify({
  model: 'google/gemini-2.5-pro',  // Best for complex analytical tasks
  max_tokens: 8000,                // Double the current limit
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
})
```

**3. Add Proper Error Handling**
- Handle 429 (rate limit) and 402 (credits exhausted) responses
- Surface user-friendly error messages

**4. Restructure Prompt for Better Output**
- Add explicit instructions to complete all sections
- Include word budget guidance per evaluation section
- Request structured output to prevent meandering

---

## Cost Comparison

| Model | Input Cost (1M tokens) | Output Cost (1M tokens) | Recommendation |
|-------|------------------------|-------------------------|----------------|
| Claude Sonnet 4.5 | $3.00 | $15.00 | Current - expensive |
| Gemini 2.5 Pro | ~$1.25 | ~$5.00 | Proposed - 60% cheaper |
| Gemini 3 Flash | ~$0.10 | ~$0.40 | Too fast/light for evaluation |

**Gemini 2.5 Pro** provides the right balance:
- Deep analytical capability for evaluation tasks
- Large context window (handles all proposal sections)
- Cost-effective via Lovable AI Gateway
- Won't hit Anthropic quota limits

---

## Technical Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/evaluate-proposal/index.ts` | Modify | Migrate to Lovable AI Gateway, use Gemini 2.5 Pro, increase token limit |

---

## Expected Outcomes

1. **No More Truncation**: 8000 tokens provides ample room for comprehensive evaluations
2. **No Quota Issues**: Lovable AI Gateway uses workspace credits, not external API quotas
3. **Cost Reduction**: ~60% lower per-evaluation cost
4. **Consistent Architecture**: Aligns with already-migrated functions (analyze-rfp, generate-proposal-outline)
5. **Better Error Messages**: Users see friendly messages for rate limits or credit issues


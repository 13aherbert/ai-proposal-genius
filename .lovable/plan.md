

# Fix: Apply Evaluation Suggestions Invalid Model Error

## Problem Identified

The `apply-evaluation-suggestions` edge function is using an invalid model name:
- **Current**: `google/gemini-2.5-flash-preview-05-20` (INVALID)
- **Error**: The Lovable AI Gateway rejects this model name

## Valid Models Available

From the error message, the allowed models are:
- `openai/gpt-5-mini`, `openai/gpt-5`, `openai/gpt-5-nano`, `openai/gpt-5.2`
- `google/gemini-2.5-pro`, `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`
- `google/gemini-3-pro-preview`, `google/gemini-3-flash-preview`

## Recommended Fix

**Model**: `google/gemini-2.5-flash`

This model is ideal because:
- Fast response times for batch section processing
- Cost-effective for iterative improvements
- Sufficient capability for rewriting tasks
- Already proven in other functions

## Implementation

### File: `supabase/functions/apply-evaluation-suggestions/index.ts`

**Change on line 136:**

```typescript
// Current (INVALID):
model: 'google/gemini-2.5-flash-preview-05-20',

// Fixed:
model: 'google/gemini-2.5-flash',
```

---

## Summary

| Item | Details |
|------|---------|
| File to modify | `supabase/functions/apply-evaluation-suggestions/index.ts` |
| Line number | 136 |
| Change | Replace invalid model name with `google/gemini-2.5-flash` |
| Deployment | Edge function will auto-redeploy |

This is a one-line fix that will resolve the error immediately.

